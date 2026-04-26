import { Injectable, signal, type Signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimeService {
  private readonly _now = signal<Date>(new Date());

  /** Readonly signal of the current time, updated every 60 seconds. */
  readonly now: Signal<Date> = this._now.asReadonly();

  constructor() {
    setInterval(() => this._now.set(new Date()), 60_000);
  }
}
