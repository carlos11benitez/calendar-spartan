// calendar-spartan/src/app/features/calendar/header/date/calendar-header-date.component.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { format } from 'date-fns';
import { CalendarStateService } from '../../calendar-state.service';
import { CalendarHeaderDateIconComponent } from './calendar-header-date-icon.component';
import { CalendarHeaderDateBadgeComponent } from './calendar-header-date-badge.component';
import { CalendarHeaderDateChevronsComponent } from './calendar-header-date-chevrons.component';

/**
 * Composes the calendar icon, "MMMM yyyy" title + event-count badge, and navigation chevrons.
 * Title text: `format(state.date(), 'MMMM yyyy')`.
 */
@Component({
  selector: 'app-calendar-header-date',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarHeaderDateIconComponent,
    CalendarHeaderDateBadgeComponent,
    CalendarHeaderDateChevronsComponent,
  ],
  host: { class: 'flex items-center gap-2' },
  template: `
    <app-calendar-header-date-icon />
    <div>
      <div class="flex items-center gap-1">
        <p class="text-lg font-semibold">{{ title() }}</p>
        <app-calendar-header-date-badge />
      </div>
      <app-calendar-header-date-chevrons />
    </div>
  `,
})
export class CalendarHeaderDateComponent {
  protected readonly state = inject(CalendarStateService);
  protected readonly title = computed(() => format(this.state.date(), 'MMMM yyyy'));
}
