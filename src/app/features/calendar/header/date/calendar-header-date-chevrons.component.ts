// calendar-spartan/src/app/features/calendar/header/date/calendar-header-date-chevrons.component.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { HlmButton } from '../../../../libs/ui/button/src/lib/hlm-button';
import { HlmIcon } from '../../../../libs/ui/icon/src/lib/hlm-icon';
import { CalendarStateService } from '../../calendar-state.service';
import type { Mode } from '../../calendar-types';

/**
 * Previous/next chevron buttons for the header date navigator.
 *   - Center label: format(state.date(), 'MMMM d, yyyy')  e.g. "April 24, 2026"
 *   - Left chevron: sub{Months,Weeks,Days}(date, 1) depending on mode
 *   - Right chevron: add{Months,Weeks,Days}(date, 1) depending on mode
 *
 * Switch has an exhaustive `satisfies never` guard so that adding a new
 * Mode at the type level forces an update here at compile time.
 */
@Component({
  selector: 'app-calendar-header-date-chevrons',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, NgIcon, HlmIcon],
  host: { class: 'flex items-center gap-2' },
  template: `
    <button
      type="button"
      hlmBtn
      variant="outline"
      class="h-7 w-7 p-1"
      [attr.aria-label]="'Previous ' + state.mode()"
      (click)="handleBackward()"
    >
      <ng-icon hlm name="lucideChevronLeft" class="min-w-5 min-h-5" />
    </button>
    <span class="min-w-[140px] text-center font-medium">{{ label() }}</span>
    <button
      type="button"
      hlmBtn
      variant="outline"
      class="h-7 w-7 p-1"
      [attr.aria-label]="'Next ' + state.mode()"
      (click)="handleForward()"
    >
      <ng-icon hlm name="lucideChevronRight" class="min-w-5 min-h-5" />
    </button>
  `,
})
export class CalendarHeaderDateChevronsComponent {
  protected readonly state = inject(CalendarStateService);

  protected readonly label = computed<string>(() =>
    format(this.state.date(), 'MMMM d, yyyy'),
  );

  protected handleBackward(): void {
    const d = this.state.date();
    const mode: Mode = this.state.mode();
    switch (mode) {
      case 'day':
        this.state.setDate(subDays(d, 1));
        return;
      case 'week':
        this.state.setDate(subWeeks(d, 1));
        return;
      case 'month':
        this.state.setDate(subMonths(d, 1));
        return;
      default: {
        const _exhaustive: never = mode;
        return _exhaustive;
      }
    }
  }

  protected handleForward(): void {
    const d = this.state.date();
    const mode: Mode = this.state.mode();
    switch (mode) {
      case 'day':
        this.state.setDate(addDays(d, 1));
        return;
      case 'week':
        this.state.setDate(addWeeks(d, 1));
        return;
      case 'month':
        this.state.setDate(addMonths(d, 1));
        return;
      default: {
        const _exhaustive: never = mode;
        return _exhaustive;
      }
    }
  }
}
