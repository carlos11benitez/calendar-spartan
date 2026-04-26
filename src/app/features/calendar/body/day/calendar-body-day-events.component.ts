import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CalendarStateService } from '../../calendar-state.service';
import { EVENT_COLOR_CLASSES } from '../../calendar-tailwind-classes';
import type { CalendarEvent } from '../../calendar-types';

@Component({
  selector: 'app-calendar-body-day-events',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dayEvents().length > 0) {
      <div class="flex flex-col gap-2">
        <p class="font-medium p-2 pb-0 font-heading">Events</p>
        <div class="flex flex-col gap-2">
          @for (event of dayEvents(); track event.id) {
            <div
              class="flex items-center gap-2 px-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none"
              role="button"
              tabindex="0"
              (click)="openEvent(event)"
              (keydown.enter)="openEvent(event)"
              (keydown.space)="onSpaceEvent($event, event)"
            >
              <div class="flex items-center gap-2">
                <div class="size-2 rounded-full" [class]="colorDotClass(event)"></div>
                <p class="text-muted-foreground text-sm font-medium">{{ event.title }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="p-2 text-muted-foreground">No events today...</div>
    }
  `,
})
export class CalendarBodyDayEventsComponent {
  protected readonly state = inject(CalendarStateService);

  protected readonly dayEvents = computed(() =>
    this.state.eventsForDate(this.state.date()).slice().sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    ),
  );

  protected colorDotClass(event: CalendarEvent): string {
    return EVENT_COLOR_CLASSES[event.color].swatch;
  }

  protected openEvent(event: CalendarEvent): void {
    this.state.setSelectedEvent(event);
    this.state.openManageEventDialog();
  }

  /**
   * Space keydown handler for event rows.
   * preventDefault suppresses browser scroll; then delegates to openEvent.
   * Parameter typed as Event — Angular host binding emits Event; KeyboardEvent at runtime.
   */
  protected onSpaceEvent(e: Event, event: CalendarEvent): void {
    e.preventDefault();
    this.openEvent(event);
  }
}
