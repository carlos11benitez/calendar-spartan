// calendar-spartan/src/app/features/calendar/body/week/week-day-tabs.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { format, isSameDay } from 'date-fns';

/**
 * Mobile-only pill strip showing the 7 days of the current week.
 *
 * Presentational component — no service injection, no DOM APIs.
 * The parent composer (CalendarBodyWeekComponent) owns state and passes it down.
 *
 * Renders 7 pill buttons with 3-letter day name + numeric date:
 *   - Today pill: bg-primary text-primary-foreground
 *   - Active pill (activeIndex): ring-2 ring-ring; if also today: ring-primary-foreground
 *   - Keyboard-activatable (Enter + Space trigger pillClick)
 *   - Each pill has aria-label="EEEE MMMM d" (e.g. "Wednesday April 23")
 *   - Host: block md:hidden — strip is mobile-only
 */
@Component({
  selector: 'app-week-day-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block md:hidden' },
  template: `
    <div class="flex gap-2 px-2 py-2 overflow-x-auto bg-background border-b sticky top-0 z-10">
      @for (day of days(); track day.getTime(); let i = $index) {
        <button
          type="button"
          class="flex flex-col items-center justify-center min-w-[3rem] px-2 py-1 rounded-md text-sm transition-colors focus-visible:outline-none"
          [class.bg-primary]="isToday(day)"
          [class.text-primary-foreground]="isToday(day)"
          [class.ring-2]="i === activeIndex()"
          [class.ring-ring]="i === activeIndex() && !isToday(day)"
          [class.ring-primary-foreground]="i === activeIndex() && isToday(day)"
          [class.bg-muted]="!isToday(day) && i !== activeIndex()"
          [attr.aria-label]="ariaLabel(day)"
          [attr.aria-current]="i === activeIndex() ? 'true' : null"
          (click)="pillClick.emit(i)"
          (keydown.enter)="pillClick.emit(i)"
          (keydown.space)="onSpace($event, i)"
        >
          <span class="text-xs font-medium leading-none">{{ dayName(day) }}</span>
          <span class="text-base font-semibold leading-none mt-1">{{ dayNum(day) }}</span>
        </button>
      }
    </div>
  `,
})
export class WeekDayTabsComponent {
  /** The 7 days of the current week (Mon–Sun). Required. */
  readonly days = input.required<Date[]>();

  /** Index of the currently-active day column (from IntersectionObserver). Required. */
  readonly activeIndex = input.required<number>();

  /** Today's date; used to apply today highlight. Required. */
  readonly today = input.required<Date>();

  /** Emits the index of the pill the user activated (click or keyboard). */
  readonly pillClick = output<number>();

  /** True if `d` is the same calendar day as `today`. */
  protected isToday(d: Date): boolean {
    return isSameDay(d, this.today());
  }

  /** Full accessible label: "Wednesday April 23". */
  protected ariaLabel(d: Date): string {
    return format(d, 'EEEE MMMM d');
  }

  /** 3-letter day name: "Mon", "Tue", … */
  protected dayName(d: Date): string {
    return format(d, 'EEE');
  }

  /** Numeric date: "21", "22", … */
  protected dayNum(d: Date): string {
    return format(d, 'd');
  }

  /** Space keydown handler — prevents page scroll and emits. */
  protected onSpace(event: Event, i: number): void {
    event.preventDefault();
    this.pillClick.emit(i);
  }
}
