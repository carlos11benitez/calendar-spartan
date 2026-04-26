// calendar-spartan/src/app/features/calendar/calendar-tailwind-classes.spec.ts
import { describe, it, expect } from 'vitest';
import { EVENT_COLOR_CLASSES, COLOR_OPTIONS } from './calendar-tailwind-classes';

describe('EVENT_COLOR_CLASSES', () => {
  it('SCEN-TC-A: has exactly 7 color keys', () => {
    expect(Object.keys(EVENT_COLOR_CLASSES)).toHaveLength(7);
    const expected = ['blue', 'indigo', 'pink', 'red', 'orange', 'amber', 'emerald'];
    expect(Object.keys(EVENT_COLOR_CLASSES).sort()).toEqual(expected.sort());
  });

  it('SCEN-TC-SLOTS-VALID: every entry has non-empty surface, text, and swatch string properties; no .base key', () => {
    for (const [key, classSet] of Object.entries(EVENT_COLOR_CLASSES)) {
      // surface, text, swatch must exist and be non-empty strings
      expect(typeof classSet.surface, `${key}.surface should be string`).toBe('string');
      expect(typeof classSet.text, `${key}.text should be string`).toBe('string');
      expect(typeof classSet.swatch, `${key}.swatch should be string`).toBe('string');
      expect(classSet.surface.length, `${key}.surface should be non-empty`).toBeGreaterThan(0);
      expect(classSet.text.length, `${key}.text should be non-empty`).toBeGreaterThan(0);
      expect(classSet.swatch.length, `${key}.swatch should be non-empty`).toBeGreaterThan(0);

      // .base must NOT exist (SCEN-TC-BASE-ABSENT via runtime check)
      expect(Object.prototype.hasOwnProperty.call(classSet, 'base')).toBe(false);

      // surface must contain bg-{c}-500/10 and border-{c}-500, must NOT contain text-{c}-
      expect(classSet.surface).toContain('/10');
      expect(classSet.surface).not.toMatch(/text-\w+-\d+/);

      // text must contain 'text-' and must NOT contain 'bg-'
      expect(classSet.text).toContain('text-');
      expect(classSet.text).not.toContain('bg-');

      // swatch must be exactly 'bg-{c}-500' — no alpha modifier
      expect(classSet.swatch).toContain('bg-');
      expect(classSet.swatch).not.toContain('/10');
      expect(classSet.swatch).not.toContain('/20');
    }
  });

  it('SCEN-TC-C: COLOR_OPTIONS has 7 entries and every value is a key of EVENT_COLOR_CLASSES', () => {
    expect(COLOR_OPTIONS).toHaveLength(7);
    const colorKeys = new Set(Object.keys(EVENT_COLOR_CLASSES));
    for (const option of COLOR_OPTIONS) {
      expect(colorKeys.has(option.value), `${option.value} not in EVENT_COLOR_CLASSES`).toBe(true);
    }
  });

  it('SCEN-TC-STATIC-LITERALS: no class string contains template literal interpolation (${})', () => {
    for (const [key, classSet] of Object.entries(EVENT_COLOR_CLASSES)) {
      expect(classSet.surface, `${key}.surface must not contain \${`).not.toContain('${');
      expect(classSet.text, `${key}.text must not contain \${`).not.toContain('${');
      expect(classSet.swatch, `${key}.swatch must not contain \${`).not.toContain('${');
    }
  });
});
