// calendar-spartan/src/app/features/calendar/header/calendar-header.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Flex row container that projects all children and renders a bottom border.
 * Carries no state — pure layout shell.
 */
@Component({
  selector: 'app-calendar-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b',
  },
  template: `<ng-content />`,
})
export class CalendarHeaderComponent {}
