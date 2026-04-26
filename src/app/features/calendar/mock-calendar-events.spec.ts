// calendar-spartan/src/app/features/calendar/mock-calendar-events.spec.ts
import { describe, it, expect } from 'vitest';
import { generateMockEvents } from './mock-calendar-events';
import { EVENT_COLOR_CLASSES } from './calendar-tailwind-classes';

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validColors = new Set(Object.keys(EVENT_COLOR_CLASSES));

describe('generateMockEvents', () => {
  // Use a fixed seed so tests are deterministic and fast.
  const events = generateMockEvents(1);

  it('SCEN-MK-A: returns between 100 and 150 events', () => {
    expect(events.length).toBeGreaterThanOrEqual(100);
    expect(events.length).toBeLessThanOrEqual(150);
  });

  it('SCEN-MK-B: every event has a valid EventColor', () => {
    for (const event of events) {
      expect(validColors.has(event.color), `unexpected color: ${event.color}`).toBe(true);
    }
  });

  it('SCEN-MK-C: events are sorted ascending by start date', () => {
    for (let i = 0; i < events.length - 1; i++) {
      expect(events[i].start.getTime()).toBeLessThanOrEqual(events[i + 1].start.getTime());
    }
  });

  it('SCEN-MK-D: every event has end > start', () => {
    for (const event of events) {
      expect(event.end.getTime()).toBeGreaterThan(event.start.getTime());
    }
  });

  it('SCEN-MK-E: every event id matches UUID v4 pattern', () => {
    // Note: crypto.randomUUID() generates UUID v4; the pattern below accepts
    // the general UUID hex format (as per the spec scenario).
    for (const event of events) {
      expect(UUID_V4_RE.test(event.id), `invalid UUID: ${event.id}`).toBe(true);
    }
  });
});
