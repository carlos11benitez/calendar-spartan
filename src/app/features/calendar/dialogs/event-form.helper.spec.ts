import { describe, it, expect } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { addHours } from 'date-fns';
import { buildEventForm, endAfterStartValidator, nextHour } from './event-form.helper';

describe('nextHour', () => {
  it('returns the next whole hour when minutes > 0', () => {
    const d = new Date(2024, 0, 1, 10, 30, 0, 0);
    const result = nextHour(d);
    expect(result.getHours()).toBe(11);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('returns the next whole hour when minutes === 0', () => {
    const d = new Date(2024, 0, 1, 10, 0, 0, 0);
    const result = nextHour(d);
    expect(result.getHours()).toBe(11);
    expect(result.getMinutes()).toBe(0);
  });

  it('does not mutate the input date', () => {
    const d = new Date(2024, 0, 1, 9, 35, 0, 0);
    const originalHours = d.getHours();
    nextHour(d);
    expect(d.getHours()).toBe(originalHours);
    expect(d.getMinutes()).toBe(35);
  });
});

describe('endAfterStartValidator', () => {
  const fb = new FormBuilder();

  it('returns null when end > start', () => {
    const start = new Date(2024, 0, 1, 10, 0);
    const end = new Date(2024, 0, 1, 11, 0);
    const form = fb.group({ start: [start], end: [end] }, { validators: endAfterStartValidator });
    expect(form.errors).toBeNull();
  });

  it('returns { endBeforeStart: true } when end === start', () => {
    const t = new Date(2024, 0, 1, 10, 0);
    const form = fb.group({ start: [t], end: [t] }, { validators: endAfterStartValidator });
    expect(form.errors).toEqual({ endBeforeStart: true });
  });

  it('returns { endBeforeStart: true } when end < start', () => {
    const start = new Date(2024, 0, 1, 11, 0);
    const end = new Date(2024, 0, 1, 10, 0);
    const form = fb.group({ start: [start], end: [end] }, { validators: endAfterStartValidator });
    expect(form.errors).toEqual({ endBeforeStart: true });
  });
});

describe('buildEventForm', () => {
  const fb = new FormBuilder();

  it('has 4 controls', () => {
    const form = buildEventForm(fb);
    expect(Object.keys(form.controls)).toHaveLength(4);
  });

  it('defaults title to empty string', () => {
    expect(buildEventForm(fb).get('title')?.value).toBe('');
  });

  it('defaults color to blue', () => {
    expect(buildEventForm(fb).get('color')?.value).toBe('blue');
  });

  it('defaults start to next whole hour', () => {
    const form = buildEventForm(fb);
    const start: Date = form.get('start')?.value;
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });

  it('defaults end to start + 1 hour', () => {
    const form = buildEventForm(fb);
    const start: Date = form.get('start')?.value;
    const end: Date = form.get('end')?.value;
    expect(end.getTime()).toBe(addHours(start, 1).getTime());
  });

  it('title control is required — invalid when empty', () => {
    const form = buildEventForm(fb);
    form.get('title')?.setValue('');
    expect(form.get('title')?.valid).toBe(false);
  });

  it('endAfterStartValidator is attached to the group', () => {
    const form = buildEventForm(fb);
    const start = new Date(2024, 0, 1, 10, 0);
    const end = new Date(2024, 0, 1, 9, 0);
    form.patchValue({ start, end });
    expect(form.errors).toEqual({ endBeforeStart: true });
  });
});
