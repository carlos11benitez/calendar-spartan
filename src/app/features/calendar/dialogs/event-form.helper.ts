import {
  FormBuilder,
  FormGroup,
  Validators,
  type ValidatorFn,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { addHours, setMilliseconds, setSeconds, setMinutes } from 'date-fns';
import type { EventColor } from '../calendar-tailwind-classes';

export interface EventFormValue {
  title: string;
  start: Date;
  end: Date;
  color: EventColor;
}

/**
 * Round a date to the top of the next hour.
 * If minutes > 0: zero out sub-minute, advance hour by 1.
 * If minutes === 0: zero out sub-minute, advance hour by 1.
 * Semantic: always returns the NEXT whole hour (never the current hour).
 * Never mutates the input date.
 */
export function nextHour(d: Date): Date {
  const zeroed = setMilliseconds(setSeconds(setMinutes(new Date(d), 0), 0), 0);
  return addHours(zeroed, 1);
}

export const endAfterStartValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const start = group.get('start')?.value as Date | null;
  const end = group.get('end')?.value as Date | null;
  if (!start || !end) return null;
  return end <= start ? { endBeforeStart: true } : null;
};

export function buildEventForm(fb: FormBuilder, defaults?: Partial<EventFormValue>): FormGroup {
  const start = defaults?.start ?? nextHour(new Date());
  const end = defaults?.end ?? addHours(start, 1);
  return fb.group(
    {
      title: [defaults?.title ?? '', [Validators.required]],
      start: [start, [Validators.required]],
      end: [end, [Validators.required]],
      color: [defaults?.color ?? ('blue' as EventColor), [Validators.required]],
    },
    { validators: endAfterStartValidator },
  );
}
