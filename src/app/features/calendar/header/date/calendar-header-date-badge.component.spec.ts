// calendar-spartan/src/app/features/calendar/header/date/calendar-header-date-badge.component.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CalendarHeaderDateBadgeComponent } from './calendar-header-date-badge.component';
import { CalendarStateService } from '../../calendar-state.service';
import type { CalendarEvent } from '../../calendar-types';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';

function evt(start: Date, id = crypto.randomUUID()): CalendarEvent {
  return { id, title: 't', color: 'blue', start, end: new Date(start.getTime() + 60_000) };
}

describe('CalendarHeaderDateBadgeComponent', () => {
  let service: CalendarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalendarHeaderDateBadgeComponent],
      providers: [CalendarStateService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    });
    service = TestBed.inject(CalendarStateService);
  });

  it('renders no badge element when count is 0 (REQ-DB-2, REQ-TEST-5)', () => {
    service.setDate(new Date(2026, 3, 15)); // April 2026
    // no events added
    const fixture = TestBed.createComponent(CalendarHeaderDateBadgeComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('div')).toBeNull();
  });

  it('renders "3 events" when 3 same-month events are present (REQ-TEST-5)', () => {
    service.setDate(new Date(2026, 3, 15)); // April 2026
    service.setEvents([
      evt(new Date(2026, 3, 2)),   // April
      evt(new Date(2026, 3, 10)),  // April
      evt(new Date(2026, 3, 25)),  // April
      evt(new Date(2026, 4, 1)),   // May — filtered out
      evt(new Date(2026, 4, 20)),  // May — filtered out
    ]);
    const fixture = TestBed.createComponent(CalendarHeaderDateBadgeComponent);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('div');
    expect(badge).not.toBeNull();
    expect(badge.textContent?.trim()).toBe('3 events');
  });

  it('filter is mode-invariant — day mode still filters by isSameMonth', () => {
    service.setDate(new Date(2026, 3, 15));
    service.setMode('day');
    service.setEvents([
      evt(new Date(2026, 3, 1)),
      evt(new Date(2026, 3, 5)),
      evt(new Date(2026, 3, 10)),
      evt(new Date(2026, 3, 15)),
      evt(new Date(2026, 3, 20)),
    ]);
    const fixture = TestBed.createComponent(CalendarHeaderDateBadgeComponent);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('div');
    expect(badge.textContent?.trim()).toBe('5 events');
  });
});
