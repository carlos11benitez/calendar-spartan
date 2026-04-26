import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarBodyDayEventsComponent } from './calendar-body-day-events.component';
import { CalendarStateService } from '../../calendar-state.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';
import { addHours, startOfDay, addDays } from 'date-fns';

describe('CalendarBodyDayEventsComponent', () => {
  let fixture: ComponentFixture<CalendarBodyDayEventsComponent>;
  let state: CalendarStateService;

  // Deterministic fixed dates to avoid DST/midnight flake
  const today = new Date(2026, 0, 15); // January 15, 2026
  const tomorrow = addDays(today, 1);   // January 16, 2026

  const makeEvent = (id: string, day: Date, startH: number) => ({
    id,
    title: `Event ${id}`,
    start: addHours(startOfDay(day), startH),
    end: addHours(startOfDay(day), startH + 1),
    color: 'blue' as const,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarBodyDayEventsComponent],
      providers: [CalendarStateService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    }).compileComponents();
    state = TestBed.inject(CalendarStateService);
    state.setDate(today);
    fixture = TestBed.createComponent(CalendarBodyDayEventsComponent);
  });

  it('SCEN-DE-1 — shows only events for selected day', () => {
    state.setEvents([
      makeEvent('a', today, 9),
      makeEvent('b', today, 10),
      makeEvent('c', today, 11),
      makeEvent('d', tomorrow, 9),
      makeEvent('e', tomorrow, 10),
    ]);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.cursor-pointer');
    expect(rows.length).toBe(3);
  });

  it('SCEN-DE-2 — events sorted ascending by start time', () => {
    state.setEvents([
      makeEvent('late', today, 14),
      makeEvent('early', today, 9),
      makeEvent('mid', today, 11),
    ]);
    fixture.detectChanges();
    // Use text-muted-foreground to select only event title paragraphs (not the "Events" heading)
    const rows = fixture.nativeElement.querySelectorAll('p.text-muted-foreground.font-medium');
    expect(rows[0].textContent).toContain('Event early');
    expect(rows[1].textContent).toContain('Event mid');
    expect(rows[2].textContent).toContain('Event late');
  });

  it('SCEN-DE-3 — empty state shows "No events today..."', () => {
    state.setEvents([]);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.text-muted-foreground');
    expect(el?.textContent?.trim()).toBe('No events today...');
  });

  it('SCEN-DE-4 — click calls setSelectedEvent then openManageEventDialog', () => {
    const event = makeEvent('x', today, 9);
    state.setEvents([event]);
    fixture.detectChanges();
    const setSpy = vi.spyOn(state, 'setSelectedEvent');
    const openSpy = vi.spyOn(state, 'openManageEventDialog');
    fixture.nativeElement.querySelector('.cursor-pointer').click();
    expect(setSpy).toHaveBeenCalledWith(event);
    expect(openSpy).toHaveBeenCalled();
    expect(setSpy.mock.invocationCallOrder[0]).toBeLessThan(
      openSpy.mock.invocationCallOrder[0],
    );
  });
});
