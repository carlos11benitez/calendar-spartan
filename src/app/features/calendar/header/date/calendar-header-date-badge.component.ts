// calendar-spartan/src/app/features/calendar/header/date/calendar-header-date-badge.component.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { isSameMonth } from 'date-fns';
import { CalendarStateService } from '../../calendar-state.service';

/**
 * Event-count badge shown next to the month/year title.
 *   - count = events where isSameMonth(event.start, state.date())
 *   - Always filters by isSameMonth, regardless of the active view mode
 *   - When count === 0: renders nothing (no DOM node)
 *   - Badge text: `"{count} events"`
 */
@Component({
  selector: 'app-calendar-header-date-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (count() > 0) {
      <div class="whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs">
        {{ count() }} events
      </div>
    }
  `,
})
export class CalendarHeaderDateBadgeComponent {
  protected readonly state = inject(CalendarStateService);

  protected readonly count = computed<number>(() => {
    const anchor = this.state.date();
    return this.state.events().filter((e) => isSameMonth(e.start, anchor)).length;
  });
}
