// calendar-spartan/src/app/features/calendar/header/actions/calendar-header-actions.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Pure wrapper that projects its children via <ng-content>.
 * Carries no state — layout shell only.
 */
@Component({
  selector: 'app-calendar-header-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex items-center gap-2 md:justify-start justify-between' },
  template: `<ng-content />`,
})
export class CalendarHeaderActionsComponent {}
