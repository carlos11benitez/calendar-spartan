// calendar-spartan/src/app/features/calendar/header/actions/calendar-header-actions-add.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '../../../../libs/ui/button/src/lib/hlm-button';
import { HlmIcon } from '../../../../libs/ui/icon/src/lib/hlm-icon';
import { CalendarStateService } from '../../calendar-state.service';

/**
 * "Add Event" button in the calendar header.
 * Click → state.openNewEventDialog(). The dialog itself is rendered separately
 * by CalendarNewEventDialogComponent.
 */
@Component({
  selector: 'app-calendar-header-actions-add',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, NgIcon, HlmIcon],
  template: `
    <button
      type="button"
      hlmBtn
      variant="default"
      class="flex items-center gap-1"
      (click)="onAdd()"
    >
      <ng-icon hlm name="lucidePlus" />
      Add Event
    </button>
  `,
})
export class CalendarHeaderActionsAddComponent {
  protected readonly state = inject(CalendarStateService);

  protected onAdd(): void {
    this.state.openNewEventDialog();
  }
}
