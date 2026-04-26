/**
 * mock-calendar-events.ts
 *
 * Generates a set of realistic-looking mock `CalendarEvent` objects for
 * development, demos, and tests.
 */
import { addDays, startOfMonth } from 'date-fns';
import type { CalendarEvent } from './calendar-types';
import { EVENT_COLOR_CLASSES } from './calendar-tailwind-classes';
import type { EventColor } from './calendar-tailwind-classes';

/** 15 realistic meeting titles. */
const EVENT_TITLES: readonly string[] = [
  'Team Standup',
  'Project Review',
  'Client Meeting',
  'Design Workshop',
  'Code Review',
  'Sprint Planning',
  'Product Demo',
  'Architecture Discussion',
  'User Testing',
  'Stakeholder Update',
  'Tech Talk',
  'Deployment Planning',
  'Bug Triage',
  'Feature Planning',
  'Team Training',
];

/** Durations in minutes. */
const DURATIONS_MINUTES: readonly number[] = [30, 60, 90, 120];

const EVENT_COUNT = 120;

/** Valid color keys derived from the lookup map (single source of truth). */
const EVENT_COLORS = Object.keys(EVENT_COLOR_CLASSES) as readonly EventColor[];

/** Tiny deterministic RNG (mulberry32). Avoids extra deps. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Generates 120 mock calendar events spread across a 90-day window beginning
 * at `startOfMonth(new Date())` (forward only — no past events).
 *
 * @param seed Optional seed for deterministic output (useful in tests).
 *             When omitted, uses `Math.random()` — different results each call.
 * @returns Events sorted ascending by `start`.
 */
export function generateMockEvents(seed?: number): CalendarEvent[] {
  const rng: () => number = seed === undefined ? Math.random.bind(Math) : mulberry32(seed);
  const windowStart = startOfMonth(new Date());
  const events: CalendarEvent[] = [];

  for (let i = 0; i < EVENT_COUNT; i++) {
    // 0..89 days forward from startOfMonth (inclusive 90-day window)
    const offset = Math.floor(rng() * 90);
    const day = addDays(windowStart, offset);

    // Hours 8..21 inclusive: 14 choices → floor(rng * 14) + 8
    const hour = Math.floor(rng() * 14) + 8;
    // Minutes: 0, 15, 30, 45
    const minute = Math.floor(rng() * 4) * 15;

    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
    const duration = pick(rng, DURATIONS_MINUTES);
    const end = new Date(start.getTime() + duration * 60_000);

    events.push({
      id: crypto.randomUUID(),
      title: pick(rng, EVENT_TITLES),
      color: pick(rng, EVENT_COLORS),
      start,
      end,
    });
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  return events;
}
