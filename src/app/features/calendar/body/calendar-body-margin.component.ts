// calendar-spartan/src/app/features/calendar/body/calendar-body-margin.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { format, setHours } from 'date-fns';
import { HOUR_HEIGHT } from './calendar-event-positioning';

/**
 * Vertical hour-axis column.
 * 24 rows, each HOUR_HEIGHT px tall. Hour 0 label suppressed.
 * Label format: 'h a' → '1 AM', '12 PM'.
 *
 * HOUR_HEIGHT is imported from calendar-event-positioning so row height and
 * event positioning share a single source of truth.
 */
@Component({
  selector: 'app-calendar-body-margin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sticky left-0 w-12 bg-background z-10 flex flex-col self-start',
  },
  template: `
    <!-- h-[33px] top spacer matches body-header height, stays sticky so the margin aligns while scrolling -->
    <div class="sticky top-0 left-0 h-[33px] bg-background z-20 border-b"></div>
    <div class="sticky left-0 w-12 bg-background z-10 flex flex-col">
      @for (hour of hours; track hour) {
        <!-- row height matches HOUR_HEIGHT so label positions align with event card positions -->
        <div class="relative first:mt-0" [style.height.px]="hourHeight">
          @if (hour !== 0) {
            <!-- Skip hour 0; format 'h a' (e.g. '1 AM') for hours 1–23.
                 Label is vertically centered on the row's top border so it reads as a boundary marker. -->
            <span class="absolute text-xs text-muted-foreground top-0 -translate-y-1/2 right-2">
              {{ labelFor(hour) }}
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class CalendarBodyMarginComponent {
  /** [0..23], iterated by @for in template. */
  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);

  /** Single source of truth for row height, shared with event positioning. */
  protected readonly hourHeight = HOUR_HEIGHT;

  /**
   * Format hour-of-day as 'h a' (e.g. '1 AM', '12 PM').
   * Uses date-fns setHours on a fresh Date so DST never mutates the label.
   */
  protected labelFor(hour: number): string {
    return format(setHours(new Date(), hour), 'h a');
  }
}
