// calendar-spartan/src/app/features/calendar/body/month/calendar-body-month-cell.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { isSameMonth, isToday, isSameDay, format } from 'date-fns';
import { CalendarStateService } from '../../calendar-state.service';
import { MotionPreferenceService } from '../../../../core/services/motion-preference.service';
import { AnimationsReadyService } from '../../../../core/services/animations-ready.service';
import { CalendarEventComponent } from '../calendar-event.component';
import { eventCardEnter, eventCardLeave } from '../calendar-event-animations';

/**
 * Per-day cell in the month grid.
 *
 * Inputs:
 *   `date = input.required<Date>()` — the calendar day this cell represents.
 *   `active = input.required<boolean>()` — whether this cell is the roving-tabindex
 *     active cell. When true, host tabindex="0"; otherwise tabindex="-1".
 *     The composer (`CalendarBodyMonthComponent`) owns the active-cell index signal
 *     and passes `[active]="i === activeCellIndex()"` per cell.
 *
 * Events are read directly from CalendarStateService (no events input prop — the cell
 * self-filters, keeping the composer thin).
 *
 * Host class note: `aspect-square` MUST be in the host declaration (not a wrapper div)
 * so that the CSS grid cell gets square proportions. Applying it to a child div instead
 * causes a silent layout collapse because the grid item itself stays unconstrained.
 *
 * Out-of-month cells additionally carry 'bg-muted/50 hidden md:flex' applied via
 * host [class] binding on the `outOfMonthClass` computed. This merges at the host
 * element — same node as the base host class.
 *
 * Click on host → navigate() → state.setDate(this.date()) + state.setMode('day').
 * Overflow element click also calls navigate() — redundant mutations are idempotent;
 * no stopPropagation needed.
 */
@Component({
  selector: 'app-calendar-body-month-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarEventComponent],
  animations: [eventCardEnter(), eventCardLeave()],
  host: {
    role: 'button',
    '[attr.tabindex]': 'active() ? 0 : -1',
    class: 'relative flex flex-col border-b border-r p-2 md:aspect-square cursor-pointer bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
    '[class]': 'outOfMonthClass()',
    '(click)': 'navigate()',
    '(keydown.enter)': 'navigate()',
    '(keydown.space)': 'onSpace($event)',
    '[attr.aria-current]': "isToday() ? 'date' : null",
  },
  template: `
    <!-- Day number badge -->
    <div
      class="text-sm font-medium w-fit p-1 flex flex-col items-center justify-center rounded-full aspect-square"
      [class.bg-primary]="isToday()"
      [class.text-background]="isToday()"
      [class.text-muted-foreground]="!isCurrentMonth() && !isToday()"
    >
      {{ dayNumber() }}
    </div>

    <!-- Event chips + overflow indicator -->
    <div class="flex flex-col gap-1 mt-1" [@.disabled]="animationsDisabled()">
      @for (event of visibleEvents(); track event.id) {
        <app-calendar-event
          [event]="event"
          [month]="true"
          [@eventCardEnter]="{ value: '', params: { duration: motion.duration(200) } }"
          [@eventCardLeave]="{ value: '', params: { duration: motion.duration(150) } }"
        />
      }
      @if (overflowCount() > 0) {
        <div
          class="text-xs text-muted-foreground"
          (click)="navigate()"
        >
          +{{ overflowCount() }} more
        </div>
      }
    </div>
  `,
})
export class CalendarBodyMonthCellComponent {
  /** The calendar day this cell represents. Required — set by the composer. */
  readonly date = input.required<Date>();

  /**
   * Whether this cell is the roving-tabindex active cell.
   * true → tabindex="0" (receives Tab focus); false → tabindex="-1".
   * Set by CalendarBodyMonthComponent using `[active]="i === activeCellIndex()"`.
   */
  readonly active = input.required<boolean>();

  protected readonly state = inject(CalendarStateService);
  protected readonly motion = inject(MotionPreferenceService);
  private readonly mount = inject(AnimationsReadyService);

  /**
   * Suppresses all animations during the FIRST app render only. Subsequent
   * cell instantiations (month-chevron nav re-creates 28-42 cells) read the
   * already-true ready signal so :enter/:leave fire normally on date changes.
   */
  protected readonly animationsDisabled = computed(() => !this.mount.ready());

  /** True when this cell's date is in the same calendar month as state.date(). */
  protected readonly isCurrentMonth = computed(() =>
    isSameMonth(this.date(), this.state.date()),
  );

  /** True when this cell's date is today (uses date-fns isToday). */
  protected readonly isToday = computed(() => isToday(this.date()));

  /**
   * All events whose start is on this cell's date, sorted ascending by start time.
   * Reads state.events() directly — no events input prop needed.
   */
  protected readonly dayEvents = computed(() =>
    this.state
      .events()
      .filter((e) => isSameDay(e.start, this.date()))
      .sort((a, b) => a.start.getTime() - b.start.getTime()),
  );

  /** At most 3 event chips rendered; excess is shown as an overflow count. */
  protected readonly visibleEvents = computed(() => this.dayEvents().slice(0, 3));

  /** How many events are hidden beyond the 3-chip cap. Non-negative. */
  protected readonly overflowCount = computed(() =>
    Math.max(0, this.dayEvents().length - 3),
  );

  /** The day-of-month number as a string (e.g. "1", "15", "31"). */
  protected readonly dayNumber = computed(() => format(this.date(), 'd'));

  /**
   * Additional classes applied to the host element when this cell is out of the
   * current month (`bg-muted/50 hidden md:flex`).
   * Returns an empty string for in-month cells (no-op).
   *
   * Mechanism: host '[class]' binding appends this string to the static host class.
   * This is identical to the mechanism used in CalendarEventComponent for colorClass.
   */
  protected readonly outOfMonthClass = computed(() =>
    this.isCurrentMonth() ? '' : 'bg-muted/50 hidden md:flex',
  );

  /**
   * Navigate to day view for this cell's date.
   * ORDER IS LOCKED: setDate THEN setMode.
   * Called by host (click) and overflow (click).
   */
  protected navigate(): void {
    this.state.setDate(this.date());
    this.state.setMode('day');
  }

  /**
   * Space keydown handler.
   * preventDefault suppresses browser scroll; then delegates to navigate.
   * Parameter typed as Event — Angular host binding emits Event; KeyboardEvent at runtime.
   */
  protected onSpace(e: Event): void {
    e.preventDefault();
    this.navigate();
  }
}
