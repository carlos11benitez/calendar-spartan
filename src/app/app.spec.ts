// calendar-spartan/src/app/app.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { App } from './app';
import { CalendarStateService } from './features/calendar/calendar-state.service';
import { STORAGE_TOKEN, createStorageStub } from './core/storage';

/** Minimal matchMedia stub for jsdom — required by MotionPreferenceService (F8b). */
function stubMatchMedia(matches = false) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('App', () => {
  beforeEach(() => {
    // MotionPreferenceService uses window.matchMedia — stub it for jsdom (F8b pattern).
    stubMatchMedia();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideNoopAnimations(),
        CalendarStateService,
        { provide: STORAGE_TOKEN, useFactory: createStorageStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('REQ-F14-03: theme toggle aria-label is "Switch to dark mode" when theme is light (default)', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    // ThemeService defaults to 'light' (no localStorage entry) → isDark() === false
    // → aria-label = "Switch to dark mode"
    const button = fixture.debugElement.query(
      By.css('button[aria-label="Switch to dark mode"]'),
    );
    expect(button).not.toBeNull();
    expect(button.nativeElement.getAttribute('aria-label')).toBe('Switch to dark mode');
  });

  it('REQ-F14-04: aria-live status region is present in rendered DOM', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const region = fixture.debugElement.query(
      By.css('[role="status"][aria-live="polite"]'),
    );
    expect(region).not.toBeNull();
  });

  it('REQ-F14-05: aria-live region textContent reflects state.announcement() signal', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    // App provides CalendarStateService in its own providers array (not at TestBed level),
    // so we must retrieve the service from the component's injector.
    const state = fixture.debugElement.injector.get(CalendarStateService);
    state.announce('Test announcement');
    fixture.detectChanges();
    const region = fixture.debugElement.query(
      By.css('[role="status"][aria-live="polite"]'),
    );
    expect(region.nativeElement.textContent).toBe('Test announcement');
  });
});
