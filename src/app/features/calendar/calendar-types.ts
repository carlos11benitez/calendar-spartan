/**
 * calendar-types.ts
 *
 * Core type definitions for the calendar feature.
 * `EventColor` and `ColorClassSet` are re-exported from `calendar-tailwind-classes.ts`
 * (single source of truth): `EventColor = keyof typeof EVENT_COLOR_CLASSES`
 * is declared there, ensuring types and the runtime map stay in sync automatically.
 */

import type { ColorClassSet, EventColor } from './calendar-tailwind-classes';

// Re-export so consumers can import EventColor / ColorClassSet from either
// this file or the barrel — no duplicate declaration of the union.
export type { ColorClassSet, EventColor };

/**
 * Calendar view modes. `day` shows a single day, `week` a 7-day grid,
 * `month` the classic month grid. Keep as a `const` tuple so the union
 * type and the runtime array stay in sync.
 */
export const CALENDAR_MODES = ['day', 'week', 'month'] as const;

/** Union of valid calendar view modes derived from the tuple above. */
export type Mode = (typeof CALENDAR_MODES)[number];

/**
 * A single calendar event.
 * - `id`: stable identifier generated via `crypto.randomUUID()`.
 * - `title`: display label shown in the event chip.
 * - `color`: one of the 7 supported color keys; drives the class lookup
 *   in `EVENT_COLOR_CLASSES`.
 * - `start` / `end`: full `Date` instances so view components can compute
 *   overlaps and durations without re-parsing ISO strings.
 */
export interface CalendarEvent {
  readonly id: string;
  title: string;
  color: EventColor;
  start: Date;
  end: Date;
}
