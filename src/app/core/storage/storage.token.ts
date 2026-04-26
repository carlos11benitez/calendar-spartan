/**
 * storage.token.ts
 *
 * Angular InjectionToken that abstracts the Storage interface (e.g. localStorage).
 *
 * Default is window.localStorage — resolved via providedIn: 'root' factory so no
 * manual entry is needed in app.config.ts.
 *
 * Tests override via TestBed providers:
 *   { provide: STORAGE_TOKEN, useFactory: createStorageStub }
 *
 * Do NOT add a duplicate provider in app.config.ts — the token self-provides.
 */
import { InjectionToken } from '@angular/core';

export const STORAGE_TOKEN = new InjectionToken<Storage>('STORAGE_TOKEN', {
  providedIn: 'root',
  factory: () => window.localStorage,
});
