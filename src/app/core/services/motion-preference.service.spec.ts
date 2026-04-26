// calendar-spartan/src/app/core/services/motion-preference.service.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MotionPreferenceService } from './motion-preference.service';

/** Build a minimal MediaQueryList stub with controllable state. */
function createMqStub(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];

  return {
    matches,
    addEventListener: vi.fn((_type: string, fn: (e: MediaQueryListEvent) => void) => {
      listeners.push(fn);
    }),
    removeEventListener: vi.fn(),
    /** Test helper — fire the registered 'change' listeners with a new matches value. */
    trigger(newMatches: boolean) {
      listeners.forEach(fn =>
        fn({ matches: newMatches } as MediaQueryListEvent),
      );
    },
  };
}

describe('MotionPreferenceService', () => {
  let mqStub: ReturnType<typeof createMqStub>;

  function setup(initialMatches: boolean): MotionPreferenceService {
    mqStub = createMqStub(initialMatches);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mqStub));

    TestBed.configureTestingModule({});
    return TestBed.inject(MotionPreferenceService);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('SCEN-MP-1 — initial reducedMotion() is false when matchMedia.matches is false', () => {
    const svc = setup(false);
    expect(svc.reducedMotion()).toBe(false);
  });

  it('SCEN-MP-2 — initial reducedMotion() is true when matchMedia.matches is true', () => {
    const svc = setup(true);
    expect(svc.reducedMotion()).toBe(true);
  });

  it('SCEN-MP-3 — listener callback flips signal when preference changes at runtime', () => {
    const svc = setup(false);
    expect(svc.reducedMotion()).toBe(false);

    mqStub.trigger(true);
    expect(svc.reducedMotion()).toBe(true);

    mqStub.trigger(false);
    expect(svc.reducedMotion()).toBe(false);
  });

  it('SCEN-MP-4 — duration() returns 0 when reduced, else the provided ms', () => {
    const svcReduced = setup(true);
    expect(svcReduced.duration(200)).toBe(0);
    expect(svcReduced.duration(150)).toBe(0);
    expect(svcReduced.duration(0)).toBe(0);

    TestBed.resetTestingModule();
    vi.unstubAllGlobals();

    const svcNormal = setup(false);
    expect(svcNormal.duration(200)).toBe(200);
    expect(svcNormal.duration(150)).toBe(150);
    expect(svcNormal.duration(0)).toBe(0);
  });

  it('SCEN-MP-5 — removeEventListener is called when the service is destroyed', () => {
    setup(false);
    expect(mqStub.removeEventListener).not.toHaveBeenCalled();

    // Destroying the TestBed triggers DestroyRef.onDestroy callbacks.
    TestBed.resetTestingModule();

    expect(mqStub.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});
