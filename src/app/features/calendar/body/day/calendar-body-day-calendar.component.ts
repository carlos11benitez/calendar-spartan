import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HlmCalendar } from '@spartan-ng/helm/calendar';
import { CalendarStateService } from '../../calendar-state.service';

@Component({
  selector: 'app-calendar-body-day-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmCalendar],
  template: `
    <div class="w-full">
      <hlm-calendar
        [date]="state.date()"
        (dateChange)="onDateChange($event)"
      />
    </div>
  `,
})
export class CalendarBodyDayCalendarComponent {
  protected readonly state = inject(CalendarStateService);

  /**
   * `hlm-calendar` typing allows `undefined` from its `date = model<T>()`
   * during transient UI states. Forward only valid Date instances to state.
   * The state service also guards, but this avoids unnecessary setter calls.
   */
  protected onDateChange(date: Date | undefined): void {
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      this.state.setDate(date);
    }
  }
}
