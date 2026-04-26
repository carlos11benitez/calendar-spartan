// calendar-spartan/src/app/features/calendar/header/actions/calendar-header-actions-mode.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '../../../../libs/ui/button/src/lib/hlm-button';
import { HlmIcon } from '../../../../libs/ui/icon/src/lib/hlm-icon';
import { CalendarStateService } from '../../calendar-state.service';
import { CALENDAR_MODES, type Mode } from '../../calendar-types';
import { calendarModeIconMap } from '../calendar-mode-icon-map';

/**
 * Day/Week/Month view-mode switcher.
 *   - role="group" on container (NOT a radio group)
 *   - Renders exactly 3 buttons in order ['day','week','month']
 *   - Each button: lucide icon + capitalized label ('Day'/'Week'/'Month')
 *   - [attr.aria-pressed] bound to state.mode() === modeValue
 *   - Click always calls state.setMode(modeValue) — no deselection
 */
@Component({
  selector: 'app-calendar-header-actions-mode',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, NgIcon, HlmIcon],
  host: {
    class: 'flex gap-0 -space-x-px rounded-sm border overflow-hidden shadow-sm shadow-black/5',
    role: 'group',
  },
  template: `
    @for (mode of modes; track mode) {
      <button
        type="button"
        hlmBtn
        variant="ghost"
        class="rounded-none flex-1 flex items-center justify-center gap-2 px-3 py-2"
        [attr.aria-label]="labelFor(mode) + ' view'"
        [attr.aria-pressed]="state.mode() === mode"
        (click)="onSelect(mode)"
      >
        <ng-icon hlm [name]="iconMap[mode]" />
        <span class="hidden md:inline font-medium">{{ labelFor(mode) }}</span>
      </button>
    }
  `,
})
export class CalendarHeaderActionsModeComponent {
  protected readonly state = inject(CalendarStateService);

  /** Locked order: CALENDAR_MODES === ['day','week','month']. */
  protected readonly modes = CALENDAR_MODES;
  protected readonly iconMap = calendarModeIconMap;

  protected labelFor(mode: Mode): string {
    // Capitalize first char → 'Day' / 'Week' / 'Month'.
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  }

  protected onSelect(mode: Mode): void {
    this.state.setMode(mode);
  }
}
