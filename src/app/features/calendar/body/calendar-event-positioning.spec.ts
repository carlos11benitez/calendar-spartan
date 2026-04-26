// calendar-spartan/src/app/features/calendar/body/calendar-event-positioning.spec.ts
import { describe, it, expect } from 'vitest';
import {
  HOUR_HEIGHT,
  eventTopPx,
  eventHeightPx,
  calculateEventLayout,
  type EventLayout,
} from './calendar-event-positioning';
import type { CalendarEvent } from '../calendar-types';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function evt(
  start: { y: number; m: number; d: number; h: number; min?: number },
  end: { y: number; m: number; d: number; h: number; min?: number },
  id: string = crypto.randomUUID(),
): CalendarEvent {
  return {
    id,
    title: 't',
    color: 'blue',
    start: new Date(start.y, start.m, start.d, start.h, start.min ?? 0),
    end: new Date(end.y, end.m, end.d, end.h, end.min ?? 0),
  };
}

const D = { y: 2026, m: 3, d: 15 }; // April 15 2026
const APRIL_15 = new Date(D.y, D.m, D.d);

// ----------------------------------------------------------------------------
// EP-CONST: HOUR_HEIGHT
// ----------------------------------------------------------------------------

describe('HOUR_HEIGHT (EP-CONST)', () => {
  it('is a positive number — single source of truth for row height', () => {
    expect(HOUR_HEIGHT).toBeGreaterThan(0);
  });
});

// ----------------------------------------------------------------------------
// EP-TOP-*: eventTopPx — assertions derived from HOUR_HEIGHT so the suite is
// robust to row-height tuning (REQ-EP-1: positioning math is a function of
// HOUR_HEIGHT, not a hard-coded pixel value).
// ----------------------------------------------------------------------------

describe('eventTopPx', () => {
  it('EP-TOP-MIDNIGHT: 00:00 → 0', () => {
    const e = evt({ ...D, h: 0, min: 0 }, { ...D, h: 1, min: 0 });
    expect(eventTopPx(e)).toBe(0);
  });

  it('EP-TOP-1H: 01:00 → 1 × HOUR_HEIGHT', () => {
    const e = evt({ ...D, h: 1, min: 0 }, { ...D, h: 2, min: 0 });
    expect(eventTopPx(e)).toBe(HOUR_HEIGHT);
  });

  it('EP-TOP-12H30: 12:30 → 12 × HOUR_HEIGHT + HOUR_HEIGHT/2', () => {
    const e = evt({ ...D, h: 12, min: 30 }, { ...D, h: 13, min: 0 });
    expect(eventTopPx(e)).toBe(12 * HOUR_HEIGHT + HOUR_HEIGHT / 2);
  });

  it('EP-TOP-23H59: 23:59 → 23 × HOUR_HEIGHT + (59/60) × HOUR_HEIGHT', () => {
    const e = evt({ ...D, h: 23, min: 59 }, { y: 2026, m: 3, d: 16, h: 0, min: 30 });
    expect(eventTopPx(e)).toBeCloseTo(23 * HOUR_HEIGHT + (59 / 60) * HOUR_HEIGHT, 5);
  });
});

// ----------------------------------------------------------------------------
// EP-HEIGHT-*: eventHeightPx — also derived from HOUR_HEIGHT.
// ----------------------------------------------------------------------------

describe('eventHeightPx', () => {
  it('EP-HEIGHT-30M: 30 min → HOUR_HEIGHT/2', () => {
    const e = evt({ ...D, h: 9, min: 0 }, { ...D, h: 9, min: 30 });
    expect(eventHeightPx(e)).toBe(HOUR_HEIGHT / 2);
  });

  it('EP-HEIGHT-60M: 60 min → HOUR_HEIGHT', () => {
    const e = evt({ ...D, h: 9, min: 0 }, { ...D, h: 10, min: 0 });
    expect(eventHeightPx(e)).toBe(HOUR_HEIGHT);
  });

  it('EP-HEIGHT-8H: 8 hours → 8 × HOUR_HEIGHT', () => {
    const e = evt({ ...D, h: 9, min: 0 }, { ...D, h: 17, min: 0 });
    expect(eventHeightPx(e)).toBe(8 * HOUR_HEIGHT);
  });

  it('EP-HEIGHT-ZERO: zero duration → 0', () => {
    const e = evt({ ...D, h: 9, min: 0 }, { ...D, h: 9, min: 0 });
    expect(eventHeightPx(e)).toBe(0);
  });

  it('EP-HEIGHT-MIDNIGHT: midnight-spanning (23:00→01:00 next day) → clamped to 23:59 → 59 min → (59/60) × HOUR_HEIGHT', () => {
    const e = evt({ ...D, h: 23, min: 0 }, { y: 2026, m: 3, d: 16, h: 1, min: 0 });
    expect(eventHeightPx(e)).toBeCloseTo((59 / 60) * HOUR_HEIGHT, 5);
  });
});

// ----------------------------------------------------------------------------
// EP-LAYOUT-*: calculateEventLayout
// ----------------------------------------------------------------------------

describe('calculateEventLayout', () => {
  it('EP-LAYOUT-FILTER: empty list → empty result', () => {
    expect(calculateEventLayout([], APRIL_15)).toEqual([]);
  });

  it('EP-LAYOUT-FILTER: events only on other days → empty result', () => {
    const e = evt({ y: 2026, m: 3, d: 14, h: 9 }, { y: 2026, m: 3, d: 14, h: 10 });
    expect(calculateEventLayout([e], APRIL_15)).toHaveLength(0);
  });

  it('EP-LAYOUT-FILTER: mixed days — only same-day events returned', () => {
    const on = evt({ ...D, h: 9 }, { ...D, h: 10 }, 'on');
    const off = evt({ y: 2026, m: 3, d: 14, h: 9 }, { y: 2026, m: 3, d: 14, h: 10 }, 'off');
    const result = calculateEventLayout([on, off], APRIL_15);
    expect(result).toHaveLength(1);
    expect(result[0].event.id).toBe('on');
  });

  it('EP-LAYOUT-SINGLE: 1 event, no overlap → left="0%", width="100%"', () => {
    const e = evt({ ...D, h: 9 }, { ...D, h: 10 });
    const [r] = calculateEventLayout([e], APRIL_15);
    expect(r.left).toBe('0%');
    expect(r.width).toBe('100%');
    expect(r.top).toBe(9 * HOUR_HEIGHT);
    expect(r.height).toBe(HOUR_HEIGHT);
  });

  it('EP-LAYOUT-2OVERLAP: two overlapping events → each 50%, positions 0% and 50%', () => {
    const a = evt({ ...D, h: 9, min: 0 }, { ...D, h: 10, min: 0 }, 'a');
    const b = evt({ ...D, h: 9, min: 30 }, { ...D, h: 10, min: 30 }, 'b');
    const result = calculateEventLayout([a, b], APRIL_15);
    expect(result).toHaveLength(2);
    const ra = result.find(r => r.event.id === 'a')!;
    const rb = result.find(r => r.event.id === 'b')!;
    expect(ra.width).toBe('50%');
    expect(ra.left).toBe('0%');    // sorted first by start
    expect(rb.width).toBe('50%');
    expect(rb.left).toBe('50%');
  });

  it('EP-LAYOUT-3OVERLAP: three overlapping events → each 33.33...%', () => {
    const a = evt({ ...D, h: 9, min: 0 }, { ...D, h: 11, min: 0 }, 'a');
    const b = evt({ ...D, h: 9, min: 15 }, { ...D, h: 11, min: 15 }, 'b');
    const c = evt({ ...D, h: 9, min: 30 }, { ...D, h: 11, min: 30 }, 'c');
    const result = calculateEventLayout([a, b, c], APRIL_15);
    expect(result).toHaveLength(3);
    const w = `${100 / 3}%`;
    expect(result.find(r => r.event.id === 'a')!.width).toBe(w);
    expect(result.find(r => r.event.id === 'b')!.width).toBe(w);
    expect(result.find(r => r.event.id === 'c')!.width).toBe(w);
    expect(result.find(r => r.event.id === 'a')!.left).toBe(`${(0 * 100) / 3}%`);
    expect(result.find(r => r.event.id === 'b')!.left).toBe(`${(1 * 100) / 3}%`);
    expect(result.find(r => r.event.id === 'c')!.left).toBe(`${(2 * 100) / 3}%`);
  });

  it('EP-LAYOUT-BOUNDARY: boundary-touching (a.end === b.start) → NOT overlapping, both full width', () => {
    const a = evt({ ...D, h: 9, min: 0 }, { ...D, h: 10, min: 0 }, 'a');
    const b = evt({ ...D, h: 10, min: 0 }, { ...D, h: 11, min: 0 }, 'b');
    const result = calculateEventLayout([a, b], APRIL_15);
    expect(result).toHaveLength(2);
    expect(result.every(r => r.width === '100%' && r.left === '0%')).toBe(true);
  });

  it('EP-LAYOUT-ORDER: position is stable by start.getTime() — earlier start → position 0', () => {
    const late = evt({ ...D, h: 9, min: 30 }, { ...D, h: 10, min: 30 }, 'late');
    const early = evt({ ...D, h: 9, min: 0 }, { ...D, h: 10, min: 0 }, 'early');
    const result = calculateEventLayout([late, early], APRIL_15);
    expect(result.find(r => r.event.id === 'early')!.left).toBe('0%');
    expect(result.find(r => r.event.id === 'late')!.left).toBe('50%');
  });

  it('top and height are numeric (not strings)', () => {
    const e = evt({ ...D, h: 9 }, { ...D, h: 10 });
    const [r] = calculateEventLayout([e], APRIL_15);
    expect(typeof r.top).toBe('number');
    expect(typeof r.height).toBe('number');
    expect(typeof r.left).toBe('string');
    expect(typeof r.width).toBe('string');
  });

  it('EP-LAYOUT-COL-REUSE: a 9-10, b 9:30-10:30, c 10-11 → c reuses col 0', () => {
    // a and b form 2-col cluster; c starts when a ends → c can fit in col 0.
    // Cluster {a,b,c} (transitively overlapping via b).
    // Cols: [[a, c], [b]] → numCols=2.
    // c's expansion: col 1 has b 9:30-10:30, b.end=10:30 > c.start=10 → busy → span=1.
    const a = evt({ ...D, h: 9, min: 0 }, { ...D, h: 10, min: 0 }, 'a');
    const b = evt({ ...D, h: 9, min: 30 }, { ...D, h: 10, min: 30 }, 'b');
    const c = evt({ ...D, h: 10, min: 0 }, { ...D, h: 11, min: 0 }, 'c');
    const result = calculateEventLayout([a, b, c], APRIL_15);
    const ra = result.find((r) => r.event.id === 'a')!;
    const rb = result.find((r) => r.event.id === 'b')!;
    const rc = result.find((r) => r.event.id === 'c')!;
    expect(ra.left).toBe('0%');
    expect(ra.width).toBe('50%');
    expect(rb.left).toBe('50%');
    expect(rb.width).toBe('50%');
    expect(rc.left).toBe('0%'); // reused col 0
    expect(rc.width).toBe('50%');
  });

  it('EP-LAYOUT-EXPAND: long anchor + 2 shorts + late event expands to 2/3', () => {
    // Mirrors the user's dense-week dogfood case:
    //   Arch  14:00-17:00 (col 0)
    //   Bug   15:00-16:00 (col 1)
    //   User  15:30-16:30 (col 2)
    //   Design 16:45-17:45 (col 1: Bug ended; expands into col 2 since User ended)
    // numCols=3. Design ends at 17:45 but span=2 is decided per cluster width.
    const arch = evt({ ...D, h: 14, min: 0 }, { ...D, h: 17, min: 0 }, 'arch');
    const bug = evt({ ...D, h: 15, min: 0 }, { ...D, h: 16, min: 0 }, 'bug');
    const user = evt({ ...D, h: 15, min: 30 }, { ...D, h: 16, min: 30 }, 'user');
    const design = evt({ ...D, h: 16, min: 45 }, { ...D, h: 17, min: 45 }, 'design');
    const result = calculateEventLayout([arch, bug, user, design], APRIL_15);

    const r = (id: string) => result.find((x) => x.event.id === id)!;
    const third = `${100 / 3}%`;
    const twoThirds = `${(2 * 100) / 3}%`;

    expect(r('arch').left).toBe('0%');
    expect(r('arch').width).toBe(third);
    expect(r('bug').left).toBe(third);
    expect(r('bug').width).toBe(third);
    expect(r('user').left).toBe(twoThirds);
    expect(r('user').width).toBe(third);
    // Design lands in col 1 (Bug ended at 16:00, free 16:45+).
    // Expansion: col 2 has User 15:30-16:30 — User.end=16:30 < Design.start=16:45 → free → span=2.
    expect(r('design').left).toBe(third);
    expect(r('design').width).toBe(twoThirds);
  });

  it('EP-LAYOUT-EXPAND-FULL: lone event in cluster of multi-col chain expands fully', () => {
    // a 9-10 forces 2 cols only because b overlaps. c after both → its own cluster, full width.
    // Sanity: when a cluster has only 1 col, span=1 still equals 100%.
    const lone = evt({ ...D, h: 13, min: 0 }, { ...D, h: 14, min: 0 }, 'lone');
    const result = calculateEventLayout([lone], APRIL_15);
    expect(result[0].left).toBe('0%');
    expect(result[0].width).toBe('100%');
  });
});
