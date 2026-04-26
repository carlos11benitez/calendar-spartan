/**
 * calendar-state.service.ts
 *
 * Signal-based calendar state store.
 *
 * Intentionally declared as `@Injectable()` (NOT `providedIn: 'root'`):
 * it is provided per `<app-calendar>` instance by the shell component
 * so multiple calendars on the same page stay isolated.
 * There is no shared singleton — each provider context gets its own instance.
 *
 * Public API is exposed as readonly `Signal<T>` via `.asReadonly()` so
 * consumers can read reactively but cannot write directly, enforcing
 * unidirectional data flow.
 */
import { DestroyRef, Injectable, effect, inject, signal, type Signal } from '@angular/core';
import type { CalendarEvent, Mode } from './calendar-types';
import { STORAGE_TOKEN } from '../../core/storage';

// --- Persistence constants and helpers ---

/** The localStorage key where events are stored. Bump the version segment for schema changes. */
const STORAGE_KEY = 'calendar-spartan/events/v1';

/**
 * Matches ISO 8601 UTC strings as produced by Date.toJSON().
 * Tight enough that user-entered strings (titles, notes) are extremely unlikely to match.
 * Forward-compatible: any date field added to CalendarEvent will be auto-revived.
 */
const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

/** JSON.parse reviver — turns ISO strings back into Date instances. */
function dateReviver(_key: string, value: unknown): unknown {
  return typeof value === 'string' && ISO_REGEX.test(value) ? new Date(value) : value;
}

@Injectable()
export class CalendarStateService {
  // --- backing writable signals (private) ---
  private readonly _events = signal<CalendarEvent[]>([]);
  private readonly _mode = signal<Mode>('month');
  private readonly _date = signal<Date>(new Date());
  private readonly _selectedEvent = signal<CalendarEvent | null>(null);
  private readonly _newEventDialogOpen = signal<boolean>(false);
  private readonly _manageEventDialogOpen = signal<boolean>(false);

  /**
   * Polite live-region message. Cleared 3 s after the last set, so the same
   * message can be re-announced (screen readers re-read on text change).
   * Debounced: a new announce() cancels the previous clear timer.
   */
  private readonly _announcement = signal<string>('');
  private announceTimer: ReturnType<typeof setTimeout> | null = null;

  // --- public readonly projections ---

  /** Read-only signal of the current event list. */
  readonly events: Signal<CalendarEvent[]> = this._events.asReadonly();

  /** Read-only signal of the current view mode. Initial value: `'month'`. */
  readonly mode: Signal<Mode> = this._mode.asReadonly();

  /** Read-only signal of the currently displayed date. */
  readonly date: Signal<Date> = this._date.asReadonly();

  /** Read-only signal of the currently selected event, or `null` when none. */
  readonly selectedEvent: Signal<CalendarEvent | null> = this._selectedEvent.asReadonly();

  /** Read-only signal indicating whether the new-event creation dialog is open. */
  readonly newEventDialogOpen: Signal<boolean> = this._newEventDialogOpen.asReadonly();

  /** Read-only signal indicating whether the manage-event (edit/delete) dialog is open. */
  readonly manageEventDialogOpen: Signal<boolean> = this._manageEventDialogOpen.asReadonly();

  /** Read-only signal of the latest polite announcement. Cleared 3 s after the last `announce()` call. */
  readonly announcement: Signal<string> = this._announcement.asReadonly();

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      if (this.announceTimer) {
        clearTimeout(this.announceTimer);
        this.announceTimer = null;
      }
    });

    // Restore persisted events on construction.
    const storage = inject(STORAGE_TOKEN);

    // Outer try: catches storage.getItem() throwing (unavailable / security error).
    // Inner try: catches JSON.parse() failing on corrupted data.
    // Both paths leave _events at its [] default — no console.error emitted.
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw, dateReviver) as unknown;
          if (Array.isArray(parsed)) {
            this._events.set(parsed as CalendarEvent[]);
          }
        } catch {
          // Corrupted JSON — discard and start empty.
          console.warn('[CalendarStateService] Corrupted storage data discarded.');
        }
      }
    } catch {
      // Storage unavailable — start empty silently.
    }

    // Reactive write-through: persist events to localStorage on every change.
    // Registered inside the constructor to preserve Angular injection context.
    // First run executes in the next microtask after construction; on a warm
    // restore this writes the same JSON back (idempotent).
    effect(() => {
      const arr = this._events();
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(arr));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.warn(
            '[CalendarStateService] localStorage quota exceeded; events kept in memory only.',
          );
        }
        // Other write errors are swallowed — in-memory state is still valid.
      }
    });

    // Multi-tab sync via the browser's 'storage' event.
    // The browser only fires 'storage' events in tabs OTHER than the one that
    // wrote to localStorage. So this handler receives changes made in other tabs,
    // parses them with dateReviver (same logic as the restore path), and updates
    // _events. The subsequent effect write-through is idempotent (same JSON).
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue === null) {
        this._events.set([]);
        return;
      }
      try {
        const parsed = JSON.parse(e.newValue, dateReviver);
        if (Array.isArray(parsed)) {
          this._events.set(parsed as CalendarEvent[]);
        } else {
          console.warn(`[CalendarStateService] Storage sync: parsed value is not an array; ignoring.`);
        }
      } catch (err) {
        console.warn(`[CalendarStateService] Storage sync: failed to parse newValue.`, err);
      }
    };
    window.addEventListener('storage', onStorage);
    destroyRef.onDestroy(() => {
      window.removeEventListener('storage', onStorage);
    });
  }

  // --- announcement ---

  /**
   * Set a polite live-region message. Auto-clears to `''` after 3 s.
   * A subsequent call cancels the pending clear and replaces the message.
   */
  announce(message: string): void {
    if (this.announceTimer) {
      clearTimeout(this.announceTimer);
    }
    this._announcement.set(message);
    this.announceTimer = setTimeout(() => {
      this._announcement.set('');
      this.announceTimer = null;
    }, 3000);
  }

  // --- event mutators ---

  /** Replace the entire event list. After the call `events()` equals the passed array by reference. */
  setEvents(events: CalendarEvent[]): void {
    this._events.set(events);
  }

  /** Append one event. No id-uniqueness check — caller owns id generation. */
  addEvent(event: CalendarEvent): void {
    this._events.update((list) => [...list, event]);
    this.announce(`Event "${event.title}" created`);
  }

  /**
   * Replace the event with matching `id`. No-op if id not found — callers
   * can blind-fire without a prior existence check.
   */
  updateEvent(event: CalendarEvent): void {
    let didUpdate = false;
    this._events.update((list) => {
      const idx = list.findIndex((e) => e.id === event.id);
      if (idx === -1) return list;
      const next = list.slice();
      next[idx] = event;
      didUpdate = true;
      return next;
    });
    if (didUpdate) {
      this.announce(`Event "${event.title}" updated`);
    }
  }

  /** Remove the event with matching `id`. No-op if id not found. */
  deleteEvent(id: string): void {
    const target = this._events().find((e) => e.id === id);
    this._events.update((list) => list.filter((e) => e.id !== id));
    if (target) {
      this.announce(`Event "${target.title}" deleted`);
    }
  }

  // --- view mutators ---

  /** Set the active view mode. TypeScript rejects non-`Mode` strings at compile time. */
  setMode(mode: Mode): void {
    this._mode.set(mode);
  }

  /**
   * Set the currently displayed date. Invalid inputs (non-Date, NaN time) are
   * silently ignored — this guards against third-party components like
   * `hlm-calendar` whose `date = model<T>()` can emit `undefined` during
   * transient UI states (e.g. month navigation without selection).
   */
  setDate(date: Date): void {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
    this._date.set(date);
  }

  // --- selection ---

  /** Set or clear the selected event. Pass `null` to deselect. */
  setSelectedEvent(event: CalendarEvent | null): void {
    this._selectedEvent.set(event);
  }

  // --- dialog mutators ---

  /** Open the new-event creation dialog. */
  openNewEventDialog(): void {
    this._newEventDialogOpen.set(true);
  }

  /** Close the new-event creation dialog. */
  closeNewEventDialog(): void {
    this._newEventDialogOpen.set(false);
  }

  /** Open the manage-event (edit/delete) dialog. */
  openManageEventDialog(): void {
    this._manageEventDialogOpen.set(true);
  }

  /** Close the manage-event (edit/delete) dialog. */
  closeManageEventDialog(): void {
    this._manageEventDialogOpen.set(false);
  }

  // --- query helpers ---

  /**
   * Returns events whose `start` falls on the same calendar day (local time)
   * as the given `date`. Uses year/month/day getters to avoid a date-fns
   * dependency in this file.
   *
   * This is a plain method rather than a `computed()` because the date
   * argument changes per call — views that need memoization can wrap it
   * in their own `computed()`.
   */
  eventsForDate(d: Date): CalendarEvent[] {
    return this._events().filter(
      (e) =>
        e.start.getFullYear() === d.getFullYear() &&
        e.start.getMonth() === d.getMonth() &&
        e.start.getDate() === d.getDate(),
    );
  }
}
