// calendar-spartan/src/app/features/calendar/calendar-state.service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CalendarStateService } from './calendar-state.service';
import type { CalendarEvent } from './calendar-types';
import { STORAGE_TOKEN, createStorageStub, createThrowingStorageStub } from '../../core/storage';

/** Storage key used by the service — kept in sync with the implementation. */
const STORAGE_KEY = 'calendar-spartan/events/v1';

function makeEvent(partial: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title ?? 'Test Event',
    color: partial.color ?? 'blue',
    start: partial.start ?? new Date(2026, 3, 24, 10, 0, 0),
    end: partial.end ?? new Date(2026, 3, 24, 11, 0, 0),
  };
}

describe('CalendarStateService', () => {
  let service: CalendarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CalendarStateService,
        { provide: STORAGE_TOKEN, useFactory: createStorageStub },
      ],
    });
    service = TestBed.inject(CalendarStateService);
  });

  describe('defaults', () => {
    it('starts with an empty events list', () => {
      expect(service.events()).toEqual([]);
    });

    it('starts in month mode', () => {
      expect(service.mode()).toBe('month');
    });

    it('starts with a Date for today', () => {
      expect(service.date()).toBeInstanceOf(Date);
    });

    it('starts with no selected event', () => {
      expect(service.selectedEvent()).toBeNull();
    });

    it('starts with both dialogs closed', () => {
      expect(service.newEventDialogOpen()).toBe(false);
      expect(service.manageEventDialogOpen()).toBe(false);
    });

    it('starts with empty announcement', () => {
      expect(service.announcement()).toBe('');
    });
  });

  describe('event mutators', () => {
    it('setEvents replaces the list', () => {
      const evts = [makeEvent(), makeEvent()];
      service.setEvents(evts);
      expect(service.events()).toEqual(evts);
    });

    it('addEvent appends to the list', () => {
      const a = makeEvent({ title: 'A' });
      const b = makeEvent({ title: 'B' });
      service.addEvent(a);
      service.addEvent(b);
      expect(service.events()).toEqual([a, b]);
    });

    it('updateEvent replaces the event with matching id', () => {
      const a = makeEvent({ id: 'evt-1', title: 'Original' });
      const b = makeEvent({ id: 'evt-2', title: 'Other' });
      service.setEvents([a, b]);
      const updated = { ...a, title: 'Updated' };
      service.updateEvent(updated);
      expect(service.events()).toEqual([updated, b]);
    });

    it('updateEvent is a no-op when id is not found', () => {
      const a = makeEvent({ id: 'evt-1' });
      service.setEvents([a]);
      const ghost = makeEvent({ id: 'evt-999', title: 'Ghost' });
      service.updateEvent(ghost);
      expect(service.events()).toEqual([a]);
    });

    it('deleteEvent removes the event with matching id', () => {
      const a = makeEvent({ id: 'evt-1' });
      const b = makeEvent({ id: 'evt-2' });
      service.setEvents([a, b]);
      service.deleteEvent('evt-1');
      expect(service.events()).toEqual([b]);
    });

    it('deleteEvent is a no-op when id is not found', () => {
      const a = makeEvent({ id: 'evt-1' });
      service.setEvents([a]);
      service.deleteEvent('evt-999');
      expect(service.events()).toEqual([a]);
    });
  });

  describe('view mutators', () => {
    it('setMode updates the mode signal', () => {
      service.setMode('month');
      expect(service.mode()).toBe('month');
      service.setMode('day');
      expect(service.mode()).toBe('day');
    });

    it('setDate updates the date signal', () => {
      const d = new Date(2030, 0, 15);
      service.setDate(d);
      expect(service.date()).toBe(d);
    });

    it('setDate ignores undefined input (guards hlm-calendar transient emit)', () => {
      const before = service.date();
      service.setDate(undefined as unknown as Date);
      expect(service.date()).toBe(before);
    });

    it('setDate ignores null input', () => {
      const before = service.date();
      service.setDate(null as unknown as Date);
      expect(service.date()).toBe(before);
    });

    it('setDate ignores Invalid Date (NaN time)', () => {
      const before = service.date();
      service.setDate(new Date('not-a-date'));
      expect(service.date()).toBe(before);
    });
  });

  describe('selection', () => {
    it('setSelectedEvent stores a reference', () => {
      const e = makeEvent();
      service.setSelectedEvent(e);
      expect(service.selectedEvent()).toBe(e);
    });

    it('setSelectedEvent(null) clears the selection', () => {
      service.setSelectedEvent(makeEvent());
      service.setSelectedEvent(null);
      expect(service.selectedEvent()).toBeNull();
    });
  });

  describe('dialog mutators', () => {
    it('openNewEventDialog sets flag true', () => {
      service.openNewEventDialog();
      expect(service.newEventDialogOpen()).toBe(true);
    });

    it('closeNewEventDialog sets flag false', () => {
      service.openNewEventDialog();
      service.closeNewEventDialog();
      expect(service.newEventDialogOpen()).toBe(false);
    });

    it('openManageEventDialog sets flag true', () => {
      service.openManageEventDialog();
      expect(service.manageEventDialogOpen()).toBe(true);
    });

    it('closeManageEventDialog sets flag false', () => {
      service.openManageEventDialog();
      service.closeManageEventDialog();
      expect(service.manageEventDialogOpen()).toBe(false);
    });
  });

  describe('eventsForDate', () => {
    it('returns only events whose start is on the given date', () => {
      const d1 = new Date(2026, 3, 24, 10, 0);
      const d2 = new Date(2026, 3, 25, 10, 0);
      const d3 = new Date(2026, 3, 24, 14, 0);
      const a = makeEvent({ id: '1', start: d1, end: new Date(2026, 3, 24, 11, 0) });
      const b = makeEvent({ id: '2', start: d2, end: new Date(2026, 3, 25, 11, 0) });
      const c = makeEvent({ id: '3', start: d3, end: new Date(2026, 3, 24, 15, 0) });
      service.setEvents([a, b, c]);
      const result = service.eventsForDate(new Date(2026, 3, 24, 23, 59));
      expect(result).toEqual([a, c]);
    });
  });

  describe('instance isolation', () => {
    it('two instances do not share state', () => {
      const s1 = TestBed.runInInjectionContext(() => new CalendarStateService());
      const s2 = TestBed.runInInjectionContext(() => new CalendarStateService());
      s1.setMode('week');
      s1.addEvent(makeEvent({ id: 'only-in-s1' }));
      expect(s2.mode()).toBe('month');
      expect(s2.events()).toEqual([]);
    });
  });

  describe('announce()', () => {
    it('addEvent sets announcement() synchronously to the correct string', () => {
      const event = makeEvent({ title: 'Team standup' });
      service.addEvent(event);
      expect(service.announcement()).toBe('Event "Team standup" created');
    });

    it('announcement() clears to "" after 3000ms (fake timers)', () => {
      vi.useFakeTimers();
      try {
        service.announce('Event "Lunch" created');
        expect(service.announcement()).toBe('Event "Lunch" created');
        vi.advanceTimersByTime(3000);
        expect(service.announcement()).toBe('');
      } finally {
        vi.useRealTimers();
      }
    });

    it('second announce() at 2000ms cancels first clear — advancing 3000ms more clears signal', () => {
      vi.useFakeTimers();
      try {
        service.announce('Event "A" created');
        vi.advanceTimersByTime(2000);
        service.announce('Event "B" updated');
        expect(service.announcement()).toBe('Event "B" updated');
        // The first timer was cancelled; only the second timer fires at +3000ms from the second call
        vi.advanceTimersByTime(3000);
        expect(service.announcement()).toBe('');
      } finally {
        vi.useRealTimers();
      }
    });

    it('deleteEvent for unknown id leaves announcement() as ""', () => {
      service.deleteEvent('x99');
      expect(service.announcement()).toBe('');
    });
  });

  // ----------------------------------------------------------------
  // F10 — localStorage Event Persistence
  // ----------------------------------------------------------------

  describe('persistence — restore from storage (REQ-F10-02, REQ-F10-04)', () => {
    it('restores events from storage on construction — dates are real Date instances', () => {
      const storedEvent = {
        id: 'evt-stored-1',
        title: 'Stored Event',
        color: 'blue',
        start: '2025-06-15T09:00:00.000Z',
        end: '2025-06-15T10:00:00.000Z',
      };
      const stub = createStorageStub();
      stub.setItem(STORAGE_KEY, JSON.stringify([storedEvent]));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CalendarStateService,
          { provide: STORAGE_TOKEN, useValue: stub },
        ],
      });
      const freshService = TestBed.inject(CalendarStateService);

      const events = freshService.events();
      expect(events).toHaveLength(1);
      expect(events[0].start).toBeInstanceOf(Date);
      expect(events[0].end).toBeInstanceOf(Date);
      expect(events[0].start.getTime()).toBe(new Date('2025-06-15T09:00:00.000Z').getTime());
      expect(events[0].end.getTime()).toBe(new Date('2025-06-15T10:00:00.000Z').getTime());
    });

    it('starts with empty events when storage has null at the key (REQ-F10-02)', () => {
      // Default stub returns null for any key — events must be []
      expect(service.events()).toEqual([]);
    });

    it('triangulation — two distinct stored events are both restored', () => {
      const e1 = { id: 'e1', title: 'A', color: 'blue', start: '2025-01-01T08:00:00.000Z', end: '2025-01-01T09:00:00.000Z' };
      const e2 = { id: 'e2', title: 'B', color: 'red',  start: '2025-02-01T08:00:00.000Z', end: '2025-02-01T09:00:00.000Z' };
      const stub = createStorageStub();
      stub.setItem(STORAGE_KEY, JSON.stringify([e1, e2]));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CalendarStateService,
          { provide: STORAGE_TOKEN, useValue: stub },
        ],
      });
      const freshService = TestBed.inject(CalendarStateService);

      const events = freshService.events();
      expect(events).toHaveLength(2);
      expect(events[0].id).toBe('e1');
      expect(events[1].id).toBe('e2');
      expect(events[0].start).toBeInstanceOf(Date);
      expect(events[1].start).toBeInstanceOf(Date);
    });
  });

  describe('persistence — reactive write-through (REQ-F10-03)', () => {
    it('addEvent writes to storage after effect flush (S-F10-03)', () => {
      const stub = TestBed.inject(STORAGE_TOKEN) as Storage;
      const evt = makeEvent({ id: 'new-evt', title: 'New Event' });
      service.addEvent(evt);
      TestBed.tick(); // flush Angular effect scheduler
      const stored = JSON.parse(stub.getItem(STORAGE_KEY) ?? '[]') as { id: string }[];
      expect(stored.some((e) => e.id === 'new-evt')).toBe(true);
    });

    it('updateEvent writes updated title to storage after effect flush (S-F10-05)', () => {
      const stub = TestBed.inject(STORAGE_TOKEN) as Storage;
      const evt = makeEvent({ id: 'upd-evt', title: 'Old Title' });
      service.setEvents([evt]);
      TestBed.tick();

      service.updateEvent({ ...evt, title: 'New Title' });
      TestBed.tick();

      const stored = JSON.parse(stub.getItem(STORAGE_KEY) ?? '[]') as { id: string; title: string }[];
      const found = stored.find((e) => e.id === 'upd-evt');
      expect(found).toBeDefined();
      expect(found!.title).toBe('New Title');
    });

    it('deleteEvent removes event from storage after effect flush (S-F10-04)', () => {
      const stub = TestBed.inject(STORAGE_TOKEN) as Storage;
      const evt = makeEvent({ id: 'del-evt', title: 'To Delete' });
      service.setEvents([evt]);
      TestBed.tick();

      service.deleteEvent('del-evt');
      TestBed.tick();

      const stored = JSON.parse(stub.getItem(STORAGE_KEY) ?? '[]') as { id: string }[];
      expect(stored.some((e) => e.id === 'del-evt')).toBe(false);
    });

    it('setEvents([]) writes empty array to storage after effect flush (REQ-F10-03)', () => {
      const stub = TestBed.inject(STORAGE_TOKEN) as Storage;
      service.setEvents([]);
      TestBed.tick();
      const stored = JSON.parse(stub.getItem(STORAGE_KEY) ?? 'null');
      expect(Array.isArray(stored)).toBe(true);
      expect(stored).toHaveLength(0);
    });
  });

  describe('persistence — quota exceeded handling (REQ-F10-07, S-F10-06)', () => {
    it('console.warn is called once and events remain in memory when setItem throws QuotaExceededError', () => {
      const throwingStub = createThrowingStorageStub({ onSet: 'quota' });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CalendarStateService,
          { provide: STORAGE_TOKEN, useValue: throwingStub },
        ],
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const freshService = TestBed.inject(CalendarStateService);
        // Clear any warn calls from initial effect run (first flush writes [] and quota throws)
        warnSpy.mockClear();

        const evt = makeEvent({ id: 'quota-evt', title: 'Quota Event' });
        freshService.addEvent(evt);
        TestBed.tick(); // flush Angular effect scheduler

        expect(freshService.events().some((e) => e.id === 'quota-evt')).toBe(true);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('quota');
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe('persistence — storage unavailable fallback (REQ-F10-08, S-F10-07)', () => {
    it('starts with empty events and emits no console.error when getItem throws', () => {
      const throwingStub = createThrowingStorageStub({ onGet: true });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CalendarStateService,
          { provide: STORAGE_TOKEN, useValue: throwingStub },
        ],
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const freshService = TestBed.inject(CalendarStateService);
        expect(freshService.events()).toEqual([]);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  });

  describe('persistence — corrupted JSON handling (REQ-F10-09, S-F10-08)', () => {
    it('starts with empty events when storage contains unparseable JSON', () => {
      const stub = createStorageStub();
      stub.setItem(STORAGE_KEY, '{not json');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CalendarStateService,
          { provide: STORAGE_TOKEN, useValue: stub },
        ],
      });
      const freshService = TestBed.inject(CalendarStateService);
      expect(freshService.events()).toEqual([]);
    });

    it('triangulation — non-array JSON is discarded (array guard)', () => {
      const stub = createStorageStub();
      stub.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CalendarStateService,
          { provide: STORAGE_TOKEN, useValue: stub },
        ],
      });
      const freshService = TestBed.inject(CalendarStateService);
      expect(freshService.events()).toEqual([]);
    });
  });

  // ----------------------------------------------------------------
  // F16 — Multi-Tab localStorage Sync via storage event
  // ----------------------------------------------------------------

  describe('F16 — multi-tab storage sync', () => {
    const syncedPayload = JSON.stringify([
      {
        id: 'sync-1',
        title: 'Synced',
        start: '2026-04-25T10:00:00.000Z',
        end: '2026-04-25T11:00:00.000Z',
        color: 'blue',
      },
    ]);

    it('F16-T1: StorageEvent with matching key + valid payload → events() updated with Date instances', () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: syncedPayload,
          storageArea: localStorage,
        }),
      );

      const events = service.events();
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('sync-1');
      expect(events[0].title).toBe('Synced');
      expect(events[0].start).toBeInstanceOf(Date);
      expect(events[0].end).toBeInstanceOf(Date);
    });

    it('F16-T2: StorageEvent with matching key + newValue null → events() becomes []', () => {
      // First put something in events so we can verify it gets cleared
      service.setEvents([makeEvent({ id: 'pre-existing' })]);
      expect(service.events()).toHaveLength(1);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: null,
          storageArea: localStorage,
        }),
      );

      expect(service.events()).toEqual([]);
    });

    it('F16-T3: StorageEvent with mismatching key → events() unchanged', () => {
      service.setEvents([makeEvent({ id: 'existing-event' })]);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'theme',
          newValue: syncedPayload,
          storageArea: localStorage,
        }),
      );

      expect(service.events()).toHaveLength(1);
      expect(service.events()[0].id).toBe('existing-event');
    });

    it('F16-T4: StorageEvent with matching key + invalid JSON → events() unchanged + console.warn fired', () => {
      service.setEvents([makeEvent({ id: 'stable-event' })]);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: '{invalid json{{',
            storageArea: localStorage,
          }),
        );

        expect(service.events()).toHaveLength(1);
        expect(service.events()[0].id).toBe('stable-event');
        expect(warnSpy).toHaveBeenCalledTimes(1);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('F16-T5: After fixture destroyed, StorageEvent does NOT update events (listener removed)', () => {
      // Capture events before destroy
      const initialEvents = [makeEvent({ id: 'before-destroy' })];
      service.setEvents(initialEvents);

      // Destroy the TestBed (which destroys the service and triggers onDestroy)
      TestBed.resetTestingModule();

      // Dispatch after destruction — should not affect the service
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: syncedPayload,
          storageArea: localStorage,
        }),
      );

      // The service's events should still be what they were at destroy time
      // (listener was removed, so the dispatch had no effect)
      expect(service.events()).toHaveLength(1);
      expect(service.events()[0].id).toBe('before-destroy');
    });
  });
});
