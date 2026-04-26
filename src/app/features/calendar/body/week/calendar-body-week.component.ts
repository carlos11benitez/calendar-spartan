// calendar-spartan/src/app/features/calendar/body/week/calendar-body-week.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { addDays, isSameDay, startOfWeek } from 'date-fns';
import { CalendarStateService } from '../../calendar-state.service';
import { CalendarBodyMarginComponent } from '../calendar-body-margin.component';
import { CalendarBodyWeekColumnComponent } from './calendar-body-week-column.component';
import { WeekDayTabsComponent } from './week-day-tabs.component';
import { MotionPreferenceService } from '../../../../core/services/motion-preference.service';

/**
 * Composer: renders 7 CalendarBodyWeekColumnComponent instances for the week
 * containing state.date(). Derives weekStart with weekStartsOn: 1 (Monday).
 *
 * Responsive layout:
 *   - Always flex-row with overflow-x-auto for horizontal scroll on mobile
 *   - Shared margin always visible (hour axis at far left, scrolls with columns)
 *   - At md+: all 7 columns fit without scroll (min-w-0 on each column)
 *
 * Host class note: 'flex flex-1 min-h-0 overflow-hidden' ensures this component
 * participates correctly in the CalendarBodyComponent flex-col chain.
 * 'overflow-hidden' on host; inner div handles overflow-y-auto for scroll.
 *
 * Mobile scroll-snap mechanics:
 *   - Scroll row gets snap-x snap-mandatory md:snap-none scroll-pl-12
 *   - scroll-pl-12 = scroll-padding-left: 3rem = 48px = w-12 hour-axis margin.
 *     If the hour-axis margin width ever changes, update scroll-pl-N to match.
 *   - Each column gets snap-start via its host class (see CalendarBodyWeekColumnComponent)
 *   - activeDayIndex signal tracks the most-visible column via IntersectionObserver
 *   - Debounced 150ms bridge to CalendarStateService.setDate()
 *   - Observer created in afterNextRender; cleaned up via DestroyRef
 */
@Component({
  selector: 'app-calendar-body-week',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarBodyMarginComponent, CalendarBodyWeekColumnComponent, WeekDayTabsComponent],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
  template: `
    <div class="flex flex-col flex-1 overflow-y-auto">
      <!-- Mobile-only day tabs strip. Hidden at md+. -->
      <app-week-day-tabs
        [days]="days()"
        [activeIndex]="activeDayIndex()"
        [today]="today"
        (pillClick)="onPillClick($event)"
      />
      <!-- snap-x snap-mandatory: mobile scroll-snap -->
      <!-- md:snap-none: disables snap on desktop -->
      <!-- scroll-pl-12 = scroll-padding-left: 3rem = 48px = w-12 hour-axis margin (calendar-body-margin) -->
      <!-- [&>:first-child]:border-r-0 suppresses the divide-x edge that
           Tailwind 4 places on the right of every child except the last.
           This removes the line between the hour-axis margin and column 0,
           matching day view (which has no divider there). Dividers between
           day columns are preserved. -->
      <div
        #row
        class="relative flex flex-1 flex-row divide-x [&>:first-child]:border-r-0 overflow-x-auto snap-x snap-mandatory md:snap-none scroll-pl-12"
      >
        <div>
          <app-calendar-body-margin />
        </div>
        @for (day of days(); track day.getTime()) {
          <app-calendar-body-week-column #column [date]="day" />
        }
      </div>
    </div>
  `,
})
export class CalendarBodyWeekComponent {
  protected readonly state = inject(CalendarStateService);
  private readonly motion = inject(MotionPreferenceService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Today's date — passed to WeekDayTabsComponent as an input so it stays
   * a pure presentational component. Derived once at construction time;
   * if midnight rollover is needed, replace with a `time.now()` computation.
   */
  protected readonly today = new Date();

  protected readonly days = computed(() => {
    const start = startOfWeek(this.state.date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  });

  /** Active day index driven by IntersectionObserver. */
  protected readonly activeDayIndex = signal(0);

  /**
   * ViewChildren query for '#column' template refs.
   * Reads ElementRef<HTMLElement> on the host element of each column.
   * Populated after first render; signals API updates reactively.
   */
  private readonly columns = viewChildren<CalendarBodyWeekColumnComponent, ElementRef<HTMLElement>>('column', { read: ElementRef });

  /** ViewChild for the scroll row container (#row). */
  private readonly rowRef = viewChild<ElementRef<HTMLElement>>('row');

  /** Per-column intersection ratios; used to pick the dominant column. */
  private readonly ratios = new Map<number, number>();

  /** Active IntersectionObserver instance; null before afterNextRender. */
  private observer: IntersectionObserver | null = null;

  /** Debounce timer handle for throttling state sync during rapid swipes. */
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Scroll listener handle (fallback for headless/programmatic scroll where IO may not fire). */
  private scrollHandler: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      const root = this.rowRef()?.nativeElement;
      const cols = this.columns().map((r) => r.nativeElement);

      if (!root || cols.length === 0) return;

      this.observer = new IntersectionObserver(
        (entries) => {
          // Update ratio map from incoming entries
          for (const entry of entries) {
            const idx = cols.indexOf(entry.target as HTMLElement);
            if (idx === -1) continue;
            this.ratios.set(idx, entry.intersectionRatio);
          }

          // Pick the column with the highest intersectionRatio
          let bestIdx = 0;
          let bestRatio = -1;
          for (const [i, r] of this.ratios) {
            if (r > bestRatio) {
              bestRatio = r;
              bestIdx = i;
            }
          }

          // Only act when ratio ≥ 0.5 and the winner changed
          if (bestRatio >= 0.5 && bestIdx !== this.activeDayIndex()) {
            this.activeDayIndex.set(bestIdx);
            this.scheduleStateSync();
          }
        },
        {
          root,
          // Multiple thresholds give sub-50% resolution to pick the dominant column correctly
          threshold: [0, 0.25, 0.5, 0.75, 1],
        },
      );

      cols.forEach((c) => this.observer!.observe(c));

      // rAF-throttled scroll listener — geometry-based fallback. IntersectionObserver
      // does not always fire on programmatic scrollLeft changes in some environments
      // (headless Chromium, certain test runners), and the IO callback can be coalesced
      // even with real input. This listener guarantees the active index follows the
      // scroll position by measuring column rects against the root's anchor point.
      let rafPending = false;
      this.scrollHandler = () => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          const rootRect = root.getBoundingClientRect();
          // 48px hour-axis margin offset matches scroll-pl-12 on the row.
          const anchor = rootRect.left + 48;
          let bestIdx = 0;
          let bestDist = Infinity;
          cols.forEach((el, i) => {
            const r = el.getBoundingClientRect();
            const dist = Math.abs(r.left - anchor);
            if (dist < bestDist) {
              bestDist = dist;
              bestIdx = i;
            }
          });
          if (bestIdx !== this.activeDayIndex()) {
            this.activeDayIndex.set(bestIdx);
            this.scheduleStateSync();
          }
        });
      };
      root.addEventListener('scroll', this.scrollHandler, { passive: true });

      // Scroll to today's column on first mount
      const todayIdx = this.days().findIndex((d) => isSameDay(d, this.today));
      if (todayIdx > 0) {
        cols[todayIdx].scrollIntoView({ inline: 'start', behavior: 'instant' });
        this.activeDayIndex.set(todayIdx);
      }
    });

    // Cleanup observer, scroll listener, and pending debounce timer on destroy
    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      const root = this.rowRef()?.nativeElement;
      if (root && this.scrollHandler) {
        root.removeEventListener('scroll', this.scrollHandler);
      }
      if (this.pendingTimeout) clearTimeout(this.pendingTimeout);
    });
  }

  /**
   * Debounced bridge to CalendarStateService.setDate().
   * Cancels any in-flight timer and schedules a new one for 150ms.
   * Prevents state churn during rapid swipes.
   */
  private scheduleStateSync(): void {
    if (this.pendingTimeout) clearTimeout(this.pendingTimeout);
    this.pendingTimeout = setTimeout(() => {
      this.state.setDate(this.days()[this.activeDayIndex()]);
      this.pendingTimeout = null;
    }, 150);
  }

  /**
   * Called when the user taps a day pill in the tab strip.
   * Bypasses the 150ms debounce — explicit user intent, no coalescing needed.
   */
  protected onPillClick(idx: number): void {
    const colEl = this.columns()[idx]?.nativeElement;
    if (!colEl) return;
    colEl.scrollIntoView({
      inline: 'start',
      behavior: this.motion.reducedMotion() ? 'auto' : 'smooth',
    });
    this.state.setDate(this.days()[idx]); // immediate — no debounce
    this.activeDayIndex.set(idx); // optimistic update
  }
}
