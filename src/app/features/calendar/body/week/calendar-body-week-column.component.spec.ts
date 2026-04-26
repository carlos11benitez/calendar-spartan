// calendar-spartan/src/app/features/calendar/body/week/calendar-body-week-column.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CalendarBodyWeekColumnComponent } from './calendar-body-week-column.component';
import { CalendarStateService } from '../../calendar-state.service';
import { TimeService } from '../../../../core/services/time.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';

describe('CalendarBodyWeekColumnComponent', () => {
  let fixture: ComponentFixture<CalendarBodyWeekColumnComponent>;
  let state: CalendarStateService;

  // Today: 2026-04-24 (Friday) — pin with fake timers
  const TODAY = new Date(2026, 3, 24);
  const TOMORROW = new Date(2026, 3, 25);

  const todayEvent = {
    id: 'e1',
    title: 'Today event',
    start: new Date(2026, 3, 24, 9, 0),
    end: new Date(2026, 3, 24, 10, 0),
    color: 'blue' as const,
  };

  const tomorrowEvent = {
    id: 'e2',
    title: 'Tomorrow event',
    start: new Date(2026, 3, 25, 14, 0),
    end: new Date(2026, 3, 25, 15, 0),
    color: 'indigo' as const,
  };

  beforeEach(async () => {
    // Pin "now" to 2026-04-24 10:00 so isToday() returns true for TODAY deterministically
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 24, 10, 0));

    // MotionPreferenceService uses window.matchMedia — stub it for jsdom (F8b).
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    await TestBed.configureTestingModule({
      imports: [CalendarBodyWeekColumnComponent],
      providers: [provideNoopAnimations(), CalendarStateService, TimeService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    }).compileComponents();

    state = TestBed.inject(CalendarStateService);
    state.setEvents([todayEvent, tomorrowEvent]);

    fixture = TestBed.createComponent(CalendarBodyWeekColumnComponent);
    fixture.componentRef.setInput('date', TODAY);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('SCEN-WC-1: host class includes responsive min-width classes (min-w-[80vw] md:min-w-0) and NOT bare min-w-0', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('flex');
    expect(host.classList).toContain('flex-col');
    expect(host.classList).toContain('flex-1');
    // F9c: responsive min-width — 80vw on mobile, 0 at md+
    expect(host.classList).toContain('min-w-[80vw]');
    expect(host.classList).toContain('md:min-w-0');
    // bare min-w-0 (unconditional) must NOT be present; only md:min-w-0 is allowed
    expect(host.classList).not.toContain('min-w-0');
  });

  it('SCEN-WC-2: renders only the today event (not tomorrow)', () => {
    const events = fixture.nativeElement.querySelectorAll('app-calendar-event');
    expect(events.length).toBe(1);
  });

  it('SCEN-WC-3: today event time label uses h:mm a format', () => {
    const eventEl = fixture.nativeElement.querySelector('app-calendar-event');
    const timeText = eventEl.textContent as string;
    // 'Today event' + '9:00 AM' + '-' + '10:00 AM'
    expect(timeText).toContain('9:00 AM');
    expect(timeText).toContain('10:00 AM');
  });

  it('SCEN-WC-4: current-time line present when date is today', () => {
    // vi.setSystemTime pins "now" to 2026-04-24 so isToday(TODAY) === true
    const line = fixture.nativeElement.querySelector('.bg-primary.h-0\\.5');
    expect(line).not.toBeNull();
  });

  it('SCEN-WC-5: current-time line absent when date is not today', () => {
    fixture.componentRef.setInput('date', TOMORROW);
    fixture.detectChanges();
    const line = fixture.nativeElement.querySelector('.bg-primary.h-0\\.5');
    expect(line).toBeNull();
  });

  it('SCEN-WC-6: renders 24 hour rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('.border-b.border-border\\/50');
    expect(rows.length).toBe(24);
  });
});
