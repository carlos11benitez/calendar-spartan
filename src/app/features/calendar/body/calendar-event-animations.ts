// calendar-spartan/src/app/features/calendar/body/calendar-event-animations.ts
import {
  trigger,
  transition,
  style,
  animate,
  type AnimationTriggerMetadata,
} from '@angular/animations';

/**
 * Factory: `:enter` trigger for event card add animation.
 *
 * Transitions from opacity 0 / scale 0.95 → opacity 1 / scale 1.
 * Duration is parameterized so the caller (view component) can pass
 * `motion.duration(200)` — which collapses to 0 when reduced-motion is on.
 *
 * Usage in component decorator:
 *   animations: [eventCardEnter()]
 *
 * Usage in template:
 *   [@eventCardEnter]="{ value: '', params: { duration: motion.duration(200) } }"
 */
export function eventCardEnter(): AnimationTriggerMetadata {
  return trigger('eventCardEnter', [
    transition(
      ':enter',
      [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate(
          '{{duration}}ms ease-out',
          style({ opacity: 1, transform: 'scale(1)' }),
        ),
      ],
      { params: { duration: 200 } },
    ),
  ]);
}

/**
 * Factory: `:leave` trigger for event card delete animation.
 *
 * Transitions from opacity 1 / scale 1 → opacity 0 / scale 0.95.
 * Angular Animations holds the element in the DOM for the full duration,
 * so the card fades out before the DOM node is removed.
 *
 * Usage in component decorator:
 *   animations: [eventCardLeave()]
 *
 * Usage in template:
 *   [@eventCardLeave]="{ value: '', params: { duration: motion.duration(150) } }"
 */
export function eventCardLeave(): AnimationTriggerMetadata {
  return trigger('eventCardLeave', [
    transition(
      ':leave',
      [
        style({ opacity: 1, transform: 'scale(1)' }),
        animate(
          '{{duration}}ms ease-in',
          style({ opacity: 0, transform: 'scale(0.95)' }),
        ),
      ],
      { params: { duration: 150 } },
    ),
  ]);
}
