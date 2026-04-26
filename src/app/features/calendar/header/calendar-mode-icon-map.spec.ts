// calendar-spartan/src/app/features/calendar/header/calendar-mode-icon-map.spec.ts
import { describe, it, expect } from 'vitest';
import { calendarModeIconMap } from './calendar-mode-icon-map';

describe('calendarModeIconMap', () => {
  it('maps every Mode to its locked lucide icon name', () => {
    expect(calendarModeIconMap.day).toBe('lucideList');
    expect(calendarModeIconMap.week).toBe('lucideColumns2');
    expect(calendarModeIconMap.month).toBe('lucideGrid3x3');
  });
});
