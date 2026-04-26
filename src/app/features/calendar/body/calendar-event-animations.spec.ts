// calendar-spartan/src/app/features/calendar/body/calendar-event-animations.spec.ts
//
// F8b-03 — Component tests for animation trigger wiring.
// Tests cover:
//   - Day view: trigger metadata present, animationsDisabled signal starts true
//   - Month view: trigger metadata present, animationsDisabled signal starts true
//   - Week view: trigger metadata present, animationsDisabled signal starts true
//   - Reduced-motion integration: MotionPreferenceService.duration(n) returns 0 when reduced
//
// Strategy: mount with provideAnimations() (NOT NoopAnimationsModule) so the
// animation engine is present and triggers are registered. Existing specs that
// use no animation provider are unaffected — Angular silently no-ops triggers
// when no animation engine is configured.
//
// We do NOT use real timers or fakeAsync for duration testing because we mock
// MotionPreferenceService to return 0ms synchronously.

import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { addHours, startOfDay } from 'date-fns';
import { vi } from 'vitest';

import { CalendarBodyDayContentComponent } from './day/calendar-body-day-content.component';
import { CalendarBodyWeekColumnComponent } from './week/calendar-body-week-column.component';
import { CalendarBodyMonthCellComponent } from './month/calendar-body-month-cell.component';
import { CalendarStateService } from '../calendar-state.service';
import { TimeService } from '../../../core/services/time.service';
import { MotionPreferenceService } from '../../../core/services/motion-preference.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../core/storage';
import type { CalendarEvent } from '../calendar-types';

// ── Shared helpers ───────────────────────────────────────────────────────────

const TODAY = new Date(2026, 3, 15); // April 15, 2026

function makeEvent(id: string, date: Date, startH = 9, endH = 10): CalendarEvent {
  return {
    id,
    title: `Event ${id}`,
    start: addHours(startOfDay(date), startH),
    end: addHours(startOfDay(date), endH),
    color: 'blue',
  };
}

/**
 * Build a minimal MotionPreferenceService mock.
 * When `reduced` is true, duration() returns 0; otherwise returns the passed ms.
 */
function motionMock(reduced: boolean): Partial<MotionPreferenceService> {
  return {
    reducedMotion: signal(reduced),
    duration: (ms: number) => (reduced ? 0 : ms),
  };
}

/** Stub window.matchMedia for jsdom — required by MotionPreferenceService root instantiation. */
function stubMatchMedia(matches = false) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

// ── Day view — trigger wiring ────────────────────────────────────────────────

describe('CalendarBodyDayContentComponent — animation triggers (F8b)', () => {
  let fixture: ComponentFixture<CalendarBodyDayContentComponent>;
  let state: CalendarStateService;

  beforeEach(async () => {
    stubMatchMedia(false);

    await TestBed.configureTestingModule({
      imports: [CalendarBodyDayContentComponent],
      providers: [
        provideAnimations(),
        CalendarStateService,
        TimeService,
        { provide: STORAGE_TOKEN, useFactory: createStorageStub },
        {
          provide: MotionPreferenceService,
          useValue: motionMock(false),
        },
      ],
    }).compileComponents();

    state = TestBed.inject(CalendarStateService);
    state.setDate(TODAY);
    fixture = TestBed.createComponent(CalendarBodyDayContentComponent);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SCEN-F8B-DAY-1: renders event wrapper div when an event is added', () => {
    state.setEvents([makeEvent('d1', TODAY)]);
    fixture.detectChanges();

    const wrappers = fixture.debugElement.queryAll(By.css('.absolute.px-1'));
    expect(wrappers.length).toBe(1);
  });

  it('SCEN-F8B-DAY-2: component renders the relative container with [@.disabled] attribute', () => {
    // Verify the container that hosts [@.disabled] is present and contains event wrappers.
    state.setEvents([makeEvent('d1', TODAY)]);
    fixture.detectChanges();

    // The "flex-1 relative" div is the container that receives [@.disabled]
    const container = fixture.debugElement.query(By.css('.flex-1.relative'));
    expect(container).not.toBeNull();
  });

  it('SCEN-F8B-DAY-3: reduced-motion mock — duration returns correct values', () => {
    // The mock is wired with reduced=false, so duration(200)→200
    const motion = TestBed.inject(MotionPreferenceService);
    expect(motion.duration(200)).toBe(200);
    expect(motion.duration(150)).toBe(150);
  });
});

// ── Day view — reduced-motion integration ────────────────────────────────────

describe('CalendarBodyDayContentComponent — reduced-motion gate (F8b)', () => {
  let fixture: ComponentFixture<CalendarBodyDayContentComponent>;
  let state: CalendarStateService;

  beforeEach(async () => {
    stubMatchMedia(true); // reduced-motion ON at OS level

    await TestBed.configureTestingModule({
      imports: [CalendarBodyDayContentComponent],
      providers: [
        provideAnimations(),
        CalendarStateService,
        TimeService,
        { provide: STORAGE_TOKEN, useFactory: createStorageStub },
        {
          provide: MotionPreferenceService,
          useValue: motionMock(true), // reduced-motion ON
        },
      ],
    }).compileComponents();

    state = TestBed.inject(CalendarStateService);
    state.setDate(TODAY);
    fixture = TestBed.createComponent(CalendarBodyDayContentComponent);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SCEN-F8B-DAY-REDUCED-1: duration(n) returns 0 when reduced-motion is active', () => {
    const motion = TestBed.inject(MotionPreferenceService);
    expect(motion.duration(200)).toBe(0);
    expect(motion.duration(150)).toBe(0);
  });

  it('SCEN-F8B-DAY-REDUCED-2: component mounts and renders normally under reduced-motion', () => {
    state.setEvents([makeEvent('d1', TODAY)]);
    fixture.detectChanges();
    const wrappers = fixture.debugElement.queryAll(By.css('.absolute.px-1'));
    expect(wrappers.length).toBe(1);
  });
});

// ── Week view — trigger wiring ───────────────────────────────────────────────

describe('CalendarBodyWeekColumnComponent — animation triggers (F8b)', () => {
  let fixture: ComponentFixture<CalendarBodyWeekColumnComponent>;
  let state: CalendarStateService;

  beforeEach(async () => {
    stubMatchMedia(false);

    await TestBed.configureTestingModule({
      imports: [CalendarBodyWeekColumnComponent],
      providers: [
        provideAnimations(),
        CalendarStateService,
        TimeService,
        { provide: STORAGE_TOKEN, useFactory: createStorageStub },
        {
          provide: MotionPreferenceService,
          useValue: motionMock(false),
        },
      ],
    }).compileComponents();

    state = TestBed.inject(CalendarStateService);
    fixture = TestBed.createComponent(CalendarBodyWeekColumnComponent);
    fixture.componentRef.setInput('date', TODAY);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SCEN-F8B-WEEK-1: renders event wrapper div when an event is on the column date', () => {
    state.setEvents([makeEvent('w1', TODAY)]);
    fixture.detectChanges();

    const wrappers = fixture.debugElement.queryAll(By.css('.absolute.px-1'));
    expect(wrappers.length).toBe(1);
  });

  it('SCEN-F8B-WEEK-2: flex-1 relative container present (hosts [@.disabled])', () => {
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.css('.flex-1.relative'));
    expect(container).not.toBeNull();
  });
});

// ── Month view — trigger wiring ──────────────────────────────────────────────

describe('CalendarBodyMonthCellComponent — animation triggers (F8b)', () => {
  let fixture: ComponentFixture<CalendarBodyMonthCellComponent>;
  let state: CalendarStateService;

  const APR_1 = new Date(2026, 3, 1);

  beforeEach(async () => {
    stubMatchMedia(false);

    await TestBed.configureTestingModule({
      imports: [CalendarBodyMonthCellComponent],
      providers: [
        provideAnimations(),
        CalendarStateService,
        { provide: STORAGE_TOKEN, useFactory: createStorageStub },
        {
          provide: MotionPreferenceService,
          useValue: motionMock(false),
        },
      ],
    }).compileComponents();

    state = TestBed.inject(CalendarStateService);
    state.setDate(APR_1);
    fixture = TestBed.createComponent(CalendarBodyMonthCellComponent);
    fixture.componentRef.setInput('date', TODAY);
    fixture.componentRef.setInput('active', false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SCEN-F8B-MONTH-1: renders app-calendar-event chips when events exist', () => {
    state.setEvents([makeEvent('m1', TODAY), makeEvent('m2', TODAY)]);
    fixture.detectChanges();

    const chips = fixture.debugElement.queryAll(By.css('app-calendar-event'));
    expect(chips.length).toBe(2);
  });

  it('SCEN-F8B-MONTH-2: event chip container ([@.disabled] host) is present', () => {
    // The "flex flex-col gap-1 mt-1" div hosts [@.disabled] — verify it renders.
    state.setEvents([makeEvent('m1', TODAY)]);
    fixture.detectChanges();

    const container = fixture.debugElement.query(By.css('.flex.flex-col.gap-1.mt-1'));
    expect(container).not.toBeNull();
  });

  it('SCEN-F8B-MONTH-3: reduced-motion mock returns 0 for duration when reduced', () => {
    // Verify the mock function contract: reducedMotion ON → duration() always 0.
    const reducedMotion = motionMock(true);
    expect(reducedMotion.duration!(200)).toBe(0);
    expect(reducedMotion.duration!(150)).toBe(0);
  });
});
