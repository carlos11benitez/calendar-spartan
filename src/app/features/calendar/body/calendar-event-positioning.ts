// calendar-spartan/src/app/features/calendar/body/calendar-event-positioning.ts
/**
 * Pure event positioning math for day/week views.
 *
 * Returns numeric `top` / `height` in PIXELS and percent-string `left` / `width`.
 * Callers convert numerics to `'${n}px'` (e.g. via `[style.top.px]`).
 *
 * No Angular imports — testable as plain functions.
 */
import { isSameDay } from 'date-fns';
import type { CalendarEvent } from '../calendar-types';

/**
 * Pixel height of one hour row. Single source of truth — margin rows and
 * event positioning both derive from this constant so they stay in sync.
 *
 * Tuned to 64 (half of the original 128) for a denser, more readable grid:
 * a 30-min event renders 32 px tall and a 1-hour event renders 64 px,
 * matching common calendar densities (Apple Calendar / Google Calendar default).
 */
export const HOUR_HEIGHT = 64;

/**
 * Layout result for one event after overlap resolution.
 * `top` and `height` are pixels (numbers); `left` and `width` are percent
 * strings (e.g. `'50%'`) ready to drop into inline styles.
 */
export interface EventLayout {
  event: CalendarEvent;
  top: number;       // pixels, numeric — caller appends 'px'
  height: number;    // pixels, numeric — caller appends 'px'
  left: string;      // percent string, e.g. '0%', '33.33%'
  width: string;     // percent string, e.g. '100%', '50%'
}

/**
 * Pixel offset from the top of the day axis to the event's start.
 * Formula: `startHour * HOUR_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT`.
 *
 * Examples (HOUR_HEIGHT=64):
 *   00:00 → 0
 *   01:00 → 64
 *   12:30 → 12*64 + (30/60)*64 = 768 + 32 = 800
 *   23:59 → 23*64 + (59/60)*64 ≈ 1472 + 62.93 ≈ 1534.93
 */
export function eventTopPx(event: CalendarEvent): number {
  const startHour = event.start.getHours();
  const startMinutes = event.start.getMinutes();
  return startHour * HOUR_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT;
}

/**
 * Pixel height of the event card.
 * Formula: `(durationMinutes / 60) * HOUR_HEIGHT`.
 *
 * MIDNIGHT-SPAN CLAMP: if `start` and `end` are on different calendar days,
 * clamp `end` to 23:59 of the start day before computing duration.
 * This prevents overnight events from producing a negative or oversized height.
 *
 * Examples (HOUR_HEIGHT=64):
 *   30 min  → 32
 *   60 min  → 64
 *   8 h     → 512
 *   0 dur   → 0
 *   23:00→01:00 next day → clamped to 23:59 → 59 min → (59/60)*64 ≈ 62.93
 */
export function eventHeightPx(event: CalendarEvent): number {
  const startHour = event.start.getHours();
  const startMinutes = event.start.getMinutes();

  let endHour = event.end.getHours();
  let endMinutes = event.end.getMinutes();

  if (!isSameDay(event.start, event.end)) {
    endHour = 23;
    endMinutes = 59;
  }

  const durationMinutes = endHour * 60 + endMinutes - (startHour * 60 + startMinutes);
  return (durationMinutes / 60) * HOUR_HEIGHT;
}

/**
 * Compute layout (top, height, left, width) for every event whose
 * `start` falls on `date`. Events on other days are filtered out.
 *
 * Algorithm — column-packing with right-expansion (Google Calendar style):
 *
 *   1. Filter and sort events by start ascending (tie-break: longer first
 *      so wide events claim col 0).
 *   2. Group into CLUSTERS: contiguous runs whose start falls before the
 *      cluster's running max-end (transitive overlap chain).
 *   3. Within each cluster, assign each event to the FIRST column whose
 *      latest event ends at or before this event's start (greedy fit).
 *      `numCols` for the cluster = total columns used.
 *   4. Each event's BASE width = `1 / numCols`. Then EXPAND to the right:
 *      while the next column has no event overlapping THIS event's
 *      [start, end), include it. Stop on first conflict.
 *      Final width  = `(span / numCols) * 100%`.
 *      Final left   = `(myCol / numCols) * 100%`.
 *
 * Why expansion: an asymmetric overlap like
 *   Arch  14:00–17:00 (col 0)
 *   Bug   15:00–16:00 (col 1)
 *   User  15:30–16:30 (col 2)
 *   Design 16:45–17:45 (col 1, col 2 free at 16:45)
 * leaves col 2 free during Design's lifetime. With expansion Design
 * grows to span cols 1+2 → 2/3 width instead of 1/3, fixing the
 * cramped truncation seen in dense weeks.
 *
 * Boundary touch (E.end === P.start): NOT overlapping → separate cluster
 * → both events get full width, matching the React port.
 */
export function calculateEventLayout(
  events: CalendarEvent[],
  date: Date,
): EventLayout[] {
  const dayEvents = events
    .filter((e) => isSameDay(e.start, date))
    .slice()
    .sort(
      (a, b) =>
        a.start.getTime() - b.start.getTime() ||
        b.end.getTime() - a.end.getTime(),
    );

  // Step 2: build clusters of transitively-overlapping events.
  const clusters: CalendarEvent[][] = [];
  let current: CalendarEvent[] = [];
  let currentMaxEnd = 0;

  for (const e of dayEvents) {
    if (current.length === 0 || e.start.getTime() < currentMaxEnd) {
      current.push(e);
      currentMaxEnd = Math.max(currentMaxEnd, e.end.getTime());
    } else {
      clusters.push(current);
      current = [e];
      currentMaxEnd = e.end.getTime();
    }
  }
  if (current.length) clusters.push(current);

  const result: EventLayout[] = [];

  for (const cluster of clusters) {
    // Step 3: greedy column assignment.
    const cols: CalendarEvent[][] = [];
    const colOf = new Map<string, number>();

    for (const e of cluster) {
      let placed = false;
      for (let i = 0; i < cols.length; i++) {
        const tail = cols[i][cols[i].length - 1];
        if (tail.end.getTime() <= e.start.getTime()) {
          cols[i].push(e);
          colOf.set(e.id, i);
          placed = true;
          break;
        }
      }
      if (!placed) {
        cols.push([e]);
        colOf.set(e.id, cols.length - 1);
      }
    }

    const numCols = cols.length;

    // Step 4: width = (span / numCols), where span extends to the right
    // through any columns free during this event's [start, end).
    for (const e of cluster) {
      const myCol = colOf.get(e.id)!;
      let span = 1;
      for (let k = myCol + 1; k < numCols; k++) {
        const busy = cols[k].some(
          (other) =>
            other.start.getTime() < e.end.getTime() &&
            other.end.getTime() > e.start.getTime(),
        );
        if (busy) break;
        span++;
      }
      result.push({
        event: e,
        top: eventTopPx(e),
        height: eventHeightPx(e),
        left: `${(myCol * 100) / numCols}%`,
        width: `${(span * 100) / numCols}%`,
      });
    }
  }

  return result;
}
