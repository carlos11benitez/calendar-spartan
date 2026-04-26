// calendar-spartan/src/app/features/calendar/header/date/calendar-header-date-icon.component.ts
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { format } from 'date-fns';
import { CalendarStateService } from '../../calendar-state.service';

/**
 * Mini calendar-icon tile showing the month abbreviation and day number.
 *   - Input `iconIsToday: boolean` (default `true`).
 *   - effective date = iconIsToday() ? new Date() : state.date()
 *   - month tile = format(effectiveDate, 'MMM').toUpperCase()   e.g. "APR"
 *   - day tile   = format(effectiveDate, 'dd')                   e.g. "24"
 *
 * `.toUpperCase()` is applied in code rather than relying on CSS text-transform
 * so the text content itself is uppercase regardless of CSS resets.
 */
@Component({
  selector: 'app-calendar-header-date-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex size-14 flex-col items-start overflow-hidden rounded-lg border">
      <p
        class="flex h-6 w-full items-center justify-center bg-primary text-center text-xs font-semibold text-background uppercase"
      >
        {{ monthLabel() }}
      </p>
      <p class="flex w-full items-center justify-center text-lg font-bold">
        {{ dayLabel() }}
      </p>
    </div>
  `,
})
export class CalendarHeaderDateIconComponent {
  protected readonly state = inject(CalendarStateService);

  /** When true (default), renders today's date. When false, renders state.date(). */
  readonly iconIsToday = input<boolean>(true);

  protected readonly effectiveDate = computed<Date>(() =>
    this.iconIsToday() ? new Date() : this.state.date(),
  );

  protected readonly monthLabel = computed<string>(() =>
    format(this.effectiveDate(), 'MMM').toUpperCase(),
  );

  protected readonly dayLabel = computed<string>(() =>
    format(this.effectiveDate(), 'dd'),
  );
}
