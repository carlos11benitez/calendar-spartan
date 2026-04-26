// calendar-spartan/src/app/features/calendar/body/calendar-body-header.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { format, isSameDay } from 'date-fns';

/**
 * Day-of-week + day-number label row. Shared by day and week views.
 *
 * Inputs:
 *   date: Date    — required
 *   onlyDay: boolean (default false) — when true, hide the day-number span
 */
@Component({
  selector: 'app-calendar-body-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex items-center justify-center gap-1 py-2 w-full sticky top-0 bg-background z-10 border-b',
    '[attr.aria-current]': "isToday() ? 'date' : null",
  },
  template: `
    <span [class]="dowClass()">{{ dowLabel() }}</span>
    @if (!onlyDay()) {
      <span [class]="dayClass()">{{ dayLabel() }}</span>
    }
  `,
})
export class CalendarBodyHeaderComponent {
  /** Required date to label. */
  readonly date = input.required<Date>();

  /**
   * When true, suppress the day-number span.
   * Default false — no booleanAttribute transform.
   */
  readonly onlyDay = input<boolean>(false);

  protected readonly isToday = computed(() => isSameDay(this.date(), new Date()));

  /** 'Mon', 'Tue', etc. */
  protected readonly dowLabel = computed(() => format(this.date(), 'EEE'));

  /** '01', '15', etc. */
  protected readonly dayLabel = computed(() => format(this.date(), 'dd'));

  /** text-primary when today, text-muted-foreground otherwise */
  protected readonly dowClass = computed(() =>
    this.isToday()
      ? 'text-xs font-medium text-primary'
      : 'text-xs font-medium text-muted-foreground',
  );

  /** text-primary + font-bold when today, text-foreground otherwise */
  protected readonly dayClass = computed(() =>
    this.isToday()
      ? 'text-xs font-medium text-primary font-bold'
      : 'text-xs font-medium text-foreground',
  );
}
