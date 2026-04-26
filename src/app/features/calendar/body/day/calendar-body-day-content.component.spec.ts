import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CalendarBodyDayContentComponent } from './calendar-body-day-content.component';
import { CalendarStateService } from '../../calendar-state.service';
import { TimeService } from '../../../../core/services/time.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';
import { calculateEventLayout } from '../calendar-event-positioning';
import { addHours, startOfDay } from 'date-fns';

describe('CalendarBodyDayContentComponent', () => {
  let fixture: ComponentFixture<CalendarBodyDayContentComponent>;
  let state: CalendarStateService;

  // Use a deterministic fixed date to avoid midnight/DST flake
  const today = new Date(2026, 0, 15); // January 15, 2026

  const makeEvent = (id: string, startH: number, endH: number) => ({
    id,
    title: `Event ${id}`,
    start: addHours(startOfDay(today), startH),
    end: addHours(startOfDay(today), endH),
    color: 'blue' as const,
  });

  beforeEach(async () => {
    // MotionPreferenceService uses window.matchMedia — stub it for jsdom (F8b).
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    await TestBed.configureTestingModule({
      imports: [CalendarBodyDayContentComponent],
      providers: [provideNoopAnimations(), CalendarStateService, TimeService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    }).compileComponents();
    state = TestBed.inject(CalendarStateService);
    state.setDate(today);
    fixture = TestBed.createComponent(CalendarBodyDayContentComponent);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SCEN-DC-1 — renders 3 event wrappers with correct inline styles', () => {
    const events = [
      makeEvent('a', 9, 10),
      makeEvent('b', 9, 11),
      makeEvent('c', 14, 15),
    ];
    state.setEvents(events);
    fixture.detectChanges();

    const wrappers = fixture.nativeElement.querySelectorAll('.absolute.px-1[style]');
    const layouts = calculateEventLayout(events, today);

    expect(wrappers.length).toBe(3);
    layouts.forEach((l, i) => {
      const el = wrappers[i] as HTMLElement;
      expect(el.style.top).toBe(`${l.top}px`);
      expect(el.style.height).toBe(`${l.height}px`);
    });
  });

  it('SCEN-DC-4 — current-time indicator absent on non-today', () => {
    const yesterday = new Date(2026, 0, 14); // January 14, 2026
    state.setDate(yesterday);
    state.setEvents([]);
    fixture.detectChanges();

    const indicator = fixture.nativeElement.querySelector('[class*="bg-primary"]');
    expect(indicator).toBeNull();
  });
});
