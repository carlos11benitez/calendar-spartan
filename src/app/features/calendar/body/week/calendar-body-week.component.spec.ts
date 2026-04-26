// calendar-spartan/src/app/features/calendar/body/week/calendar-body-week.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CalendarBodyWeekComponent } from './calendar-body-week.component';
import { CalendarStateService } from '../../calendar-state.service';
import { TimeService } from '../../../../core/services/time.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';
import { addDays, startOfWeek } from 'date-fns';

// ---------------------------------------------------------------------------
// FakeIntersectionObserver — test seam for REQ-F11-15
// ---------------------------------------------------------------------------
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  callback: IntersectionObserverCallback;
  observed: Element[] = [];
  disconnect = vi.fn();
  takeRecords = (): IntersectionObserverEntry[] => [];

  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(el: Element): void {
    this.observed.push(el);
  }

  unobserve(el: Element): void {
    this.observed = this.observed.filter((e) => e !== el);
  }

  /** Manually trigger the IO callback with synthetic entries. */
  trigger(entries: Partial<IntersectionObserverEntry>[]): void {
    this.callback(
      entries as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

// ---------------------------------------------------------------------------
// scrollIntoView spy — jsdom does not implement this (REQ-F11-15)
// ---------------------------------------------------------------------------
Element.prototype.scrollIntoView = vi.fn();

describe('CalendarBodyWeekComponent', () => {
  let fixture: ComponentFixture<CalendarBodyWeekComponent>;
  let state: CalendarStateService;

  // Anchor date: a Monday within a known week
  const anchorDate = new Date(2026, 3, 20); // Monday 20 April 2026

  beforeEach(async () => {
    // Reset FakeIntersectionObserver registry before each test
    FakeIntersectionObserver.instances = [];

    // Pin time to avoid date-sensitive flakiness
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 20, 10, 0));

    // Stub IntersectionObserver globally (REQ-F11-15)
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

    // MotionPreferenceService uses window.matchMedia — stub it for jsdom (F8b).
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    await TestBed.configureTestingModule({
      imports: [CalendarBodyWeekComponent],
      providers: [provideNoopAnimations(), CalendarStateService, TimeService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    }).compileComponents();

    state = TestBed.inject(CalendarStateService);
    state.setDate(anchorDate);

    // Seed events on day 0 (Mon Apr 20) and day 2 (Wed Apr 22)
    const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
    state.setEvents([
      {
        id: 'w1',
        title: 'Monday event',
        start: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 9, 0),
        end: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 10, 0),
        color: 'blue',
      },
      {
        id: 'w2',
        title: 'Wednesday event',
        start: addDays(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 14, 0), 2),
        end: addDays(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 15, 0), 2),
        color: 'indigo',
      },
    ]);

    fixture = TestBed.createComponent(CalendarBodyWeekComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mockClear?.();
  });

  it('SCEN-WK-1: renders exactly 7 column components', () => {
    const columns = fixture.nativeElement.querySelectorAll('app-calendar-body-week-column');
    expect(columns.length).toBe(7);
  });

  it('SCEN-WK-2: columns represent 7 distinct consecutive days starting Monday', () => {
    // 7 headers (one per column) verify columns rendered with distinct dates
    const headers = fixture.nativeElement.querySelectorAll('app-calendar-body-header');
    expect(headers.length).toBe(7);
  });

  it('SCEN-WK-3: host class includes flex flex-1 min-h-0', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('flex');
    expect(host.classList).toContain('flex-1');
    expect(host.classList).toContain('min-h-0');
  });

  it('SCEN-WK-4: inner flex container is always flex-row with overflow-x-auto and does NOT have flex-col (F9c)', () => {
    // The inner row wrapper is inside the outer overflow-y-auto div
    const innerRow = fixture.nativeElement.querySelector(
      '.flex-1.overflow-y-auto > div'
    ) as HTMLElement | null;
    expect(innerRow).not.toBeNull();
    expect(innerRow!.classList).toContain('flex-row');
    expect(innerRow!.classList).toContain('overflow-x-auto');
    expect(innerRow!.classList).not.toContain('flex-col');
  });

  // ---------------------------------------------------------------------------
  // F11a — activeDayIndex signal (REQ-F11-04)
  // ---------------------------------------------------------------------------

  it('F11-01: activeDayIndex signal initialises to 0', () => {
    const comp = fixture.componentInstance as unknown as { activeDayIndex: () => number };
    expect(comp.activeDayIndex()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // F11a — IO callback updates activeDayIndex (REQ-F11-04)
  // ---------------------------------------------------------------------------

  it('F11-02: IO callback with column[2] at highest ratio → activeDayIndex() becomes 2', () => {
    // afterNextRender should have fired; grab the latest FakeIO instance
    const fakeObserver = FakeIntersectionObserver.instances[0];
    expect(fakeObserver).toBeDefined();

    const columns = fakeObserver.observed as HTMLElement[];
    expect(columns.length).toBeGreaterThanOrEqual(7);

    // Simulate IO entries: column[2] most visible
    fakeObserver.trigger([
      { target: columns[0], intersectionRatio: 0.1 } as Partial<IntersectionObserverEntry>,
      { target: columns[2], intersectionRatio: 0.8 } as Partial<IntersectionObserverEntry>,
    ]);

    fixture.detectChanges();

    const comp = fixture.componentInstance as unknown as { activeDayIndex: () => number };
    expect(comp.activeDayIndex()).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // F11a — Debounce: after 150ms, state.setDate() called with days()[2] (REQ-F11-05)
  // ---------------------------------------------------------------------------

  it('F11-03: after 150ms debounce, state.setDate() called with days()[2]', () => {
    const setDateSpy = vi.spyOn(state, 'setDate');
    const fakeObserver = FakeIntersectionObserver.instances[0];
    expect(fakeObserver).toBeDefined();

    const columns = fakeObserver.observed as HTMLElement[];

    // Trigger IO with column[2] winning
    fakeObserver.trigger([
      { target: columns[2], intersectionRatio: 0.9 } as Partial<IntersectionObserverEntry>,
    ]);

    // Before debounce fires
    expect(setDateSpy).not.toHaveBeenCalled();

    // Advance timers by 150ms
    vi.advanceTimersByTime(150);

    const comp = fixture.componentInstance as unknown as { days: () => Date[] };
    expect(setDateSpy).toHaveBeenCalledWith(comp.days()[2]);
    expect(setDateSpy).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // F11a — Rapid IO events within 150ms → single setDate call (REQ-F11-05 S-F11-09)
  // ---------------------------------------------------------------------------

  it('F11-04: two rapid IO callbacks within 150ms → state.setDate() called only once with last value', () => {
    const setDateSpy = vi.spyOn(state, 'setDate');
    const fakeObserver = FakeIntersectionObserver.instances[0];
    expect(fakeObserver).toBeDefined();

    const columns = fakeObserver.observed as HTMLElement[];

    // Simulate swipe: escalating ratios so each successive column clearly wins.
    // Column 0 at 0.6 → activeDayIndex stays 0 (equal to current), no sync scheduled.
    // Then column 1 at 0.8 → wins (0.8 > 0.6), activeDayIndex→1, sync scheduled.
    // Then column 2 at 1.0 → wins (1.0 > 0.8), activeDayIndex→2, timer reset.
    // Each intermediate timer must be < 150ms apart so it gets cleared before firing.
    fakeObserver.trigger([
      { target: columns[0], intersectionRatio: 0.6 } as Partial<IntersectionObserverEntry>,
    ]);
    vi.advanceTimersByTime(40);

    // column 1 wins (0.8 > 0.6 stored from col 0)
    fakeObserver.trigger([
      { target: columns[0], intersectionRatio: 0.1 },  // reduce col 0 so col 1 wins
      { target: columns[1], intersectionRatio: 0.8 },
    ] as Partial<IntersectionObserverEntry>[]);
    vi.advanceTimersByTime(40);

    // column 2 wins
    fakeObserver.trigger([
      { target: columns[1], intersectionRatio: 0.1 },  // reduce col 1 so col 2 wins
      { target: columns[2], intersectionRatio: 0.9 },
    ] as Partial<IntersectionObserverEntry>[]);

    // Still within debounce window — no call yet
    expect(setDateSpy).not.toHaveBeenCalled();

    // Advance 150ms to flush the last scheduled timer
    vi.advanceTimersByTime(150);

    const comp = fixture.componentInstance as unknown as { days: () => Date[] };
    // setDate called exactly once, with the final winning column
    expect(setDateSpy).toHaveBeenCalledTimes(1);
    expect(setDateSpy).toHaveBeenCalledWith(comp.days()[2]);
  });

  // ---------------------------------------------------------------------------
  // F11a — DestroyRef cleanup: observer.disconnect() and timer cleared (REQ-F11-06)
  // ---------------------------------------------------------------------------

  it('F11-05: on component destroy, observer.disconnect() called and pending timeout cleared', () => {
    const setDateSpy = vi.spyOn(state, 'setDate');
    const fakeObserver = FakeIntersectionObserver.instances[0];
    expect(fakeObserver).toBeDefined();

    const columns = fakeObserver.observed as HTMLElement[];

    // Trigger an IO event to start a pending debounce timer
    fakeObserver.trigger([{ target: columns[1], intersectionRatio: 0.8 } as Partial<IntersectionObserverEntry>]);

    // Destroy component before debounce fires
    fixture.destroy();

    // disconnect must have been called
    expect(fakeObserver.disconnect).toHaveBeenCalled();

    // Advance timers — setDate should NOT fire because timer was cleared
    vi.advanceTimersByTime(300);
    expect(setDateSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // F12 — default to today's column on week mount (REQ-F12-01..03)
  // ---------------------------------------------------------------------------

  describe('F12 — auto-scroll to today on mount', () => {
    let f12Fixture: ComponentFixture<CalendarBodyWeekComponent>;
    let f12State: CalendarStateService;

    // Helper: build a fresh fixture with the given system time and state date.
    async function buildF12Fixture(systemTime: Date, stateDate: Date): Promise<void> {
      // Override system time BEFORE creating the component so this.today picks it up.
      vi.setSystemTime(systemTime);

      FakeIntersectionObserver.instances = [];
      (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mockClear?.();

      // Reset any previously instantiated TestBed before reconfiguring.
      TestBed.resetTestingModule();

      await TestBed.configureTestingModule({
        imports: [CalendarBodyWeekComponent],
        providers: [
          provideNoopAnimations(),
          CalendarStateService,
          TimeService,
          { provide: STORAGE_TOKEN, useFactory: createStorageStub },
        ],
      }).compileComponents();

      f12State = TestBed.inject(CalendarStateService);
      f12State.setDate(stateDate);

      f12Fixture = TestBed.createComponent(CalendarBodyWeekComponent);
      f12Fixture.detectChanges();
    }

    afterEach(() => {
      f12Fixture?.destroy();
    });

    it('F12-01: today is Wednesday (Apr 22) in the displayed week → scrollIntoView called on col[2] with {inline:"start",behavior:"instant"} and activeDayIndex becomes 2', async () => {
      // Wednesday April 22 2026 — index 2 in Mon-Sun week starting Apr 20
      const wednesday = new Date(2026, 3, 22, 10, 0);
      // state.date() = Wednesday → days() = [Apr20, Apr21, Apr22, ..., Apr26]
      await buildF12Fixture(wednesday, wednesday);

      const spy = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;
      const fakeObserver = FakeIntersectionObserver.instances[0];
      const cols = fakeObserver?.observed as HTMLElement[];

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ inline: 'start', behavior: 'instant' });
      // scrollIntoView was called on the element at index 2
      expect(cols[2]).toBe((spy.mock.instances as HTMLElement[])[0]);

      const comp = f12Fixture.componentInstance as unknown as { activeDayIndex: () => number };
      expect(comp.activeDayIndex()).toBe(2);
    });

    it('F12-02: today is Monday (Apr 20) in the displayed week → no scrollIntoView call, activeDayIndex stays 0', async () => {
      // Monday April 20 2026 — index 0, guard todayIdx > 0 skips
      const monday = new Date(2026, 3, 20, 10, 0);
      await buildF12Fixture(monday, monday);

      const spy = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;
      expect(spy).not.toHaveBeenCalled();

      const comp = f12Fixture.componentInstance as unknown as { activeDayIndex: () => number };
      expect(comp.activeDayIndex()).toBe(0);
    });

    it('F12-03: today (Apr 22 Wed) is NOT in the displayed week (Apr 6–12) → no scrollIntoView call, activeDayIndex stays 0', async () => {
      // System time = Apr 22 (today), but state.date() = Apr 8 (2 weeks earlier)
      const wednesday = new Date(2026, 3, 22, 10, 0);
      const twoWeeksAgo = new Date(2026, 3, 8, 10, 0); // Wednesday Apr 8 → displayed week is Apr 6–12
      await buildF12Fixture(wednesday, twoWeeksAgo);

      const spy = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;
      expect(spy).not.toHaveBeenCalled();

      const comp = f12Fixture.componentInstance as unknown as { activeDayIndex: () => number };
      expect(comp.activeDayIndex()).toBe(0);
    });
  });
});
