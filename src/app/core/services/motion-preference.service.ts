// calendar-spartan/src/app/core/services/motion-preference.service.ts
import { DestroyRef, Injectable, inject, signal, type Signal } from '@angular/core';

/**
 * MotionPreferenceService
 *
 * Single source of truth for the user's reduced-motion preference.
 * Reads `window.matchMedia('(prefers-reduced-motion: reduce)')` on init
 * and registers a change listener so the signal updates at runtime without
 * a page reload.
 *
 * Provided at root because motion preference is a global OS/browser
 * preference — not scoped to a single calendar instance.
 */
@Injectable({ providedIn: 'root' })
export class MotionPreferenceService {
  private readonly mq: MediaQueryList;
  private readonly _reducedMotion = signal<boolean>(false);

  /** Single source of truth: true when the user prefers reduced motion. */
  readonly reducedMotion: Signal<boolean> = this._reducedMotion.asReadonly();

  constructor() {
    this.mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._reducedMotion.set(this.mq.matches);

    const listener = (e: MediaQueryListEvent): void =>
      this._reducedMotion.set(e.matches);

    this.mq.addEventListener('change', listener);

    inject(DestroyRef).onDestroy(() =>
      this.mq.removeEventListener('change', listener),
    );
  }

  /**
   * Returns `0` when the user prefers reduced motion, otherwise returns `ms`.
   * Use this as the `duration` param in Angular Animations trigger bindings
   * so every animation trigger respects the reduced-motion preference from a single call site.
   */
  duration(ms: number): number {
    return this._reducedMotion() ? 0 : ms;
  }
}
