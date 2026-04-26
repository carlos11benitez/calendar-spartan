// calendar-spartan/src/app/app.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ThemeService } from './core/services/theme.service';
import {
  CalendarStateService,
  CalendarHeaderComponent,
  CalendarHeaderDateComponent,
  CalendarHeaderActionsComponent,
  CalendarHeaderActionsModeComponent,
  CalendarHeaderActionsAddComponent,
  CalendarBodyComponent,
  CalendarNewEventDialogComponent,
  CalendarManageEventDialogComponent,
  generateMockEvents,
} from './features/calendar';
import type { CalendarEvent } from './features/calendar';

/** Overlapping events on today, for dogfooding the layout algorithm. */
function overlappingTodayEvents(): CalendarEvent[] {
  const at = (h: number, m = 0): Date => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };
  return [
    { id: crypto.randomUUID(), title: 'Team Standup',     color: 'blue',    start: at(9, 0),  end: at(11, 0) },
    { id: crypto.randomUUID(), title: 'Code Review',      color: 'orange',  start: at(9, 30), end: at(10, 30) },
    { id: crypto.randomUUID(), title: 'Architecture Sync', color: 'indigo', start: at(14, 0), end: at(17, 0) },
    { id: crypto.randomUUID(), title: 'Bug Triage',       color: 'red',     start: at(15, 0), end: at(16, 0) },
    { id: crypto.randomUUID(), title: 'User Testing',     color: 'emerald', start: at(15, 30), end: at(16, 30) },
    { id: crypto.randomUUID(), title: 'Tech Talk',        color: 'pink',    start: at(19, 0), end: at(20, 0) },
  ];
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgIcon,
    CalendarHeaderComponent,
    CalendarHeaderDateComponent,
    CalendarHeaderActionsComponent,
    CalendarHeaderActionsModeComponent,
    CalendarHeaderActionsAddComponent,
    CalendarBodyComponent,
    CalendarNewEventDialogComponent,
    CalendarManageEventDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // CalendarStateService is provided here so the shell owns the instance —
  // multiple calendars on the same page each get an isolated state tree.
  providers: [CalendarStateService],
  template: `
    <div class="h-screen overflow-hidden bg-background text-foreground flex flex-col">
      <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">{{ state.announcement() }}</div>
      <div class="flex items-center justify-end p-4 border-b">
        <button
          type="button"
          class="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border hover:bg-accent hover:text-accent-foreground"
          [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          (click)="theme.toggle()"
        >
          <ng-icon [name]="theme.isDark() ? 'lucideSun' : 'lucideMoon'" size="20" />
        </button>
      </div>
      <main class="flex flex-col flex-1 min-h-0">
        <app-calendar-header>
          <app-calendar-header-date />
          <app-calendar-header-actions>
            <app-calendar-header-actions-mode />
            <app-calendar-header-actions-add />
          </app-calendar-header-actions>
        </app-calendar-header>
        <app-calendar-body />
      </main>
      <app-calendar-new-event-dialog />
      <app-calendar-manage-event-dialog />
      <router-outlet />
    </div>
  `,
})
export class App {
  protected readonly theme = inject(ThemeService);
  protected readonly state = inject(CalendarStateService);

  constructor() {
    // Seed only when storage is empty so returning users keep their events.
    // Angular DI guarantees CalendarStateService.constructor (and its storage restore)
    // finishes before App.constructor runs — no async guard needed.
    if (this.state.events().length === 0) {
      this.state.setEvents([...generateMockEvents(42), ...overlappingTodayEvents()]);
    }
  }
}
