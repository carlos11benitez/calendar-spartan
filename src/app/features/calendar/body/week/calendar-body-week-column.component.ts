// calendar-spartan/src/app/features/calendar/body/week/calendar-body-week-column.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { format, isToday } from 'date-fns';
import { CalendarStateService } from '../../calendar-state.service';
import { TimeService } from '../../../../core/services/time.service';
import { MotionPreferenceService } from '../../../../core/services/motion-preference.service';
import { AnimationsReadyService } from '../../../../core/services/animations-ready.service';
import { CalendarBodyHeaderComponent } from '../calendar-body-header.component';
import { CalendarEventComponent } from '../calendar-event.component';
import { calculateEventLayout, HOUR_HEIGHT } from '../calendar-event-positioning';
import { eventCardEnter, eventCardLeave } from '../calendar-event-animations';

/**
 * Per-day column in the week view. Mirrors the structure of
 * CalendarBodyDayContentComponent but parameterized by a `date` signal input
 * rather than reading state.date() directly.
 *
 * CRITICAL: Do NOT read this.state.date() in this component. Only this.date()
 * (the input signal) is the source of truth for which day this column represents.
 * state.date() belongs to the CalendarBodyWeekComponent (composer).
 *
 * The hour-axis margin is rendered once by the composer (CalendarBodyWeekComponent),
 * not per column, so this component does not import CalendarBodyMarginComponent.
 *
 * Host class: 'flex flex-col flex-1 min-w-[80vw] md:min-w-0 self-start'
 * min-w-[80vw] ensures each column is readable on mobile (single-column swipe).
 * md:min-w-0 restores original desktop behaviour (7 columns fit without scroll).
 */
@Component({
  selector: 'app-calendar-body-week-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarBodyHeaderComponent, CalendarEventComponent],
  animations: [eventCardEnter(), eventCardLeave()],
  // snap-start: aligns this column to the scroll-snap grid on mobile
  // md:snap-none: neutralizes snap alignment on desktop (the row-level md:snap-none handles the rest)
  host: { class: 'flex flex-col flex-1 min-w-[80vw] md:min-w-0 self-start snap-start md:snap-none' },
  template: `
    <app-calendar-body-header [date]="date()" [onlyDay]="false" />
    <div class="flex flex-1">
      <div class="flex-1 relative" [@.disabled]="animationsDisabled()">
        @for (h of hours; track h) {
          <div class="border-b border-border/50" [style.height.px]="HOUR_HEIGHT"></div>
        }
        @for (item of layouts(); track item.event.id) {
          <div
            class="absolute px-1"
            [style.top.px]="item.top"
            [style.height.px]="item.height"
            [style.left]="item.left"
            [style.width]="item.width"
            [@eventCardEnter]="{ value: '', params: { duration: motion.duration(200) } }"
            [@eventCardLeave]="{ value: '', params: { duration: motion.duration(150) } }"
          >
            <app-calendar-event [event]="item.event" />
          </div>
        }
        @if (isCurrentDay()) {
          <div
            class="absolute -left-12 right-0 flex items-center gap-1 z-20 pointer-events-none"
            [style.top.px]="timeLinePx()"
          >
            <span class="w-12 pr-1 text-right text-xs text-primary leading-none">
              {{ currentTimeLabel() }}
            </span>
            <div class="h-2 w-2 rounded-full bg-primary shrink-0"></div>
            <div class="h-0.5 flex-1 bg-primary"></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class CalendarBodyWeekColumnComponent {
  /** The day this column represents. Required — set by the week composer. */
  readonly date = input.required<Date>();

  protected readonly state = inject(CalendarStateService);
  protected readonly time = inject(TimeService);
  protected readonly motion = inject(MotionPreferenceService);
  private readonly mount = inject(AnimationsReadyService);
  protected readonly HOUR_HEIGHT = HOUR_HEIGHT;
  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);

  /**
   * Suppresses all animations during the FIRST app render only. Subsequent
   * column instantiations (week-chevron nav re-creates 7 columns via the
   * composer's `@for`) read the already-true ready signal so :enter/:leave
   * fire normally on date changes.
   */
  protected readonly animationsDisabled = computed(() => !this.mount.ready());

  /** Event layout for events on this.date() only. */
  protected readonly layouts = computed(() =>
    calculateEventLayout(this.state.events(), this.date()),
  );

  /** True only if this column's date is today's date. */
  protected readonly isCurrentDay = computed(() => isToday(this.date()));

  /** Pixel offset for the current-time indicator line. */
  protected readonly timeLinePx = computed(
    () =>
      this.time.now().getHours() * HOUR_HEIGHT +
      (this.time.now().getMinutes() / 60) * HOUR_HEIGHT,
  );

  /** 'h:mm a' label reactive on TimeService.now(). */
  protected readonly currentTimeLabel = computed(() =>
    format(this.time.now(), 'h:mm a'),
  );
}
