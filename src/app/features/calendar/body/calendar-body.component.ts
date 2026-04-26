// calendar-spartan/src/app/features/calendar/body/calendar-body.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CalendarStateService } from '../calendar-state.service';
import { CalendarBodyDayComponent } from './day/calendar-body-day.component';
import { CalendarBodyWeekComponent } from './week/calendar-body-week.component';
import { CalendarBodyMonthComponent } from './month/calendar-body-month.component';

/**
 * Body dispatcher. Switches on state.mode() and mounts the day/week/month view.
 * No own layout beyond a flex-1 scroll container.
 */
@Component({
  selector: 'app-calendar-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarBodyDayComponent,
    CalendarBodyWeekComponent,
    CalendarBodyMonthComponent,
  ],
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' },
  template: `
    @switch (state.mode()) {
      @case ('day')   { <app-calendar-body-day /> }
      @case ('week')  { <app-calendar-body-week /> }
      @case ('month') { <app-calendar-body-month /> }
    }
  `,
})
export class CalendarBodyComponent {
  protected readonly state = inject(CalendarStateService);
}
