import { Injectable, Signal, afterNextRender, signal } from '@angular/core';

/**
 * Tracks whether the app has completed its first render. Used to gate
 * Angular Animations on event lists so the cold-load flood (e.g., 126 seed
 * events) does NOT animate on first paint, while subsequent date-navigation
 * (week/month chevrons, today re-entry) DOES fire :enter / :leave.
 *
 * The pattern that previously lived per-component (`animationsDisabled` +
 * `afterNextRender` in each of day/week/month) reset to `true` whenever the
 * column/cell was re-instantiated — which happens on every week/month nav,
 * since the parent `@for` is keyed by the day timestamp. Day view appeared
 * to animate only because its content component is a single instance whose
 * inner `@for` recomputes filter results without remounting.
 *
 * Centralising the signal in a `providedIn: 'root'` service flips it ONCE
 * at app boot. New columns/cells created later read the already-`true`
 * value → animations fire normally on date changes.
 */
@Injectable({ providedIn: 'root' })
export class AnimationsReadyService {
  private readonly _ready = signal(false);

  /** True after the first render commit. Components should gate `[@.disabled]` on `!ready()`. */
  readonly ready: Signal<boolean> = this._ready.asReadonly();

  constructor() {
    afterNextRender(() => this._ready.set(true));
  }
}
