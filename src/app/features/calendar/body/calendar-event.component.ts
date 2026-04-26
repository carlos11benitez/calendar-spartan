// calendar-spartan/src/app/features/calendar/body/calendar-event.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { format } from 'date-fns';
import type { CalendarEvent } from '../calendar-types';
import { EVENT_COLOR_CLASSES } from '../calendar-tailwind-classes';
import { CalendarStateService } from '../calendar-state.service';

/**
 * Leaf event card. Renders title + 12-hour formatted time range.
 *
 * Click pattern: state.setSelectedEvent(event) THEN state.openManageEventDialog()
 * — this exact two-call sequence ensures the selected event is set before
 * the dialog reads it.
 *
 * Color classes split into surface (host) and text (inner div):
 * host applies the 10% tint + border + hover surface slot;
 * inner content div applies the text color only.
 * Keeping them on separate elements avoids a double-tint effect that occurs
 * when both the background tint and text color classes sit on the same node.
 *
 * Positioning: this component does NOT self-apply top/left/width/height.
 * The parent wrapping div owns position and applies `position: absolute`.
 *
 * a11y: role="button" + tabindex="0" on root for keyboard navigation.
 */
@Component({
  selector: 'app-calendar-event',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'button',
    tabindex: '0',
    class:
      'block px-3 py-1.5 rounded-xl truncate cursor-pointer transition-all duration-300 border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
    '[class]': 'surface()',
    '[class.h-full]': '!month()',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onClick($event)',
    '(keydown.space)': 'onSpace($event)',
  },
  template: `
    @if (month()) {
      <div class="flex flex-row items-center justify-between w-full" [class]="textClass()">
        <p class="font-bold truncate text-xs">{{ event().title }}</p>
        <p class="text-xs">
          <span>{{ startLabel() }}</span>
        </p>
      </div>
    } @else {
      <div class="flex flex-col w-full" [class]="textClass()">
        <p class="font-bold truncate">{{ event().title }}</p>
        <p class="text-sm">
          <span>{{ startLabel() }}</span>
          <span class="mx-1">-</span>
          <span>{{ endLabel() }}</span>
        </p>
      </div>
    }
  `,
})
export class CalendarEventComponent {
  /** Required event to render. */
  readonly event = input.required<CalendarEvent>();

  /**
   * When true, render the compact month-cell layout (flex-row, start-only).
   * When false (default), render the standard non-month card (flex-col, time range).
   * No booleanAttribute transform — explicitly typed as input<boolean>(false).
   */
  readonly month = input<boolean>(false);

  protected readonly state = inject(CalendarStateService);

  /**
   * Surface slot: 10% bg tint + border + hover. Applied to host via [class] binding.
   * No text color, no solid bg — keeps surface and text concerns on separate elements.
   */
  protected readonly surface = computed(
    () => EVENT_COLOR_CLASSES[this.event().color].surface,
  );

  /**
   * Text slot: color-only text class. Applied to inner content div via [class] binding.
   * Keeps text color separate from surface so each concern is on the correct element.
   */
  protected readonly textClass = computed(
    () => EVENT_COLOR_CLASSES[this.event().color].text,
  );

  /** '9:00 AM' — 12-hour format. NOT 'HH:mm'. */
  protected readonly startLabel = computed(() => format(this.event().start, 'h:mm a'));

  /** '10:00 AM' — 12-hour format. */
  protected readonly endLabel = computed(() => format(this.event().end, 'h:mm a'));

  /**
   * Click handler.
   * ORDER IS LOCKED: setSelectedEvent THEN openManageEventDialog.
   */
  protected onClick(e: Event): void {
    e.stopPropagation();
    this.state.setSelectedEvent(this.event());
    this.state.openManageEventDialog();
  }

  /**
   * Space keydown handler.
   * preventDefault suppresses browser scroll on Space; then delegates to onClick.
   * Parameter typed as Event — Angular host binding emits Event; KeyboardEvent at runtime.
   */
  protected onSpace(e: Event): void {
    e.preventDefault();
    this.onClick(e);
  }
}
