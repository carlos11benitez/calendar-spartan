import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CalendarBodyMarginComponent } from '../calendar-body-margin.component';
import { CalendarBodyDayContentComponent } from './calendar-body-day-content.component';
import { CalendarBodyDayCalendarComponent } from './calendar-body-day-calendar.component';
import { CalendarBodyDayEventsComponent } from './calendar-body-day-events.component';

@Component({
  selector: 'app-calendar-body-day',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarBodyMarginComponent,
    CalendarBodyDayContentComponent,
    CalendarBodyDayCalendarComponent,
    CalendarBodyDayEventsComponent,
  ],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
  template: `
    <div class="flex flex-1 min-w-0 overflow-y-auto">
      <app-calendar-body-margin />
      <app-calendar-body-day-content />
    </div>
    <aside
      class="hidden lg:flex lg:flex-col w-80 shrink-0 border-l border-border divide-y"
    >
      <app-calendar-body-day-calendar />
      <app-calendar-body-day-events />
    </aside>
  `,
})
export class CalendarBodyDayComponent {}
