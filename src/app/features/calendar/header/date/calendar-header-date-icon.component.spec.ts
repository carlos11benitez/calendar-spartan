// calendar-spartan/src/app/features/calendar/header/date/calendar-header-date-icon.component.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CalendarHeaderDateIconComponent } from './calendar-header-date-icon.component';
import { CalendarStateService } from '../../calendar-state.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';

describe('CalendarHeaderDateIconComponent', () => {
  let service: CalendarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalendarHeaderDateIconComponent],
      providers: [CalendarStateService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    });
    service = TestBed.inject(CalendarStateService);
  });

  it('defaults iconIsToday to true and renders today\'s month/day', () => {
    const fixture = TestBed.createComponent(CalendarHeaderDateIconComponent);
    fixture.detectChanges();
    const now = new Date();
    const tiles = fixture.nativeElement.querySelectorAll('p');
    expect(tiles[0].textContent?.trim()).toBe(
      now.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    );
    expect(tiles[1].textContent?.trim()).toBe(String(now.getDate()).padStart(2, '0'));
  });

  it('when iconIsToday=false, renders state.date() month/day (REQ-TEST-6)', () => {
    // March 10, 2026 (month index 2)
    service.setDate(new Date(2026, 2, 10, 12, 0, 0));
    const fixture = TestBed.createComponent(CalendarHeaderDateIconComponent);
    fixture.componentRef.setInput('iconIsToday', false);
    fixture.detectChanges();
    const tiles = fixture.nativeElement.querySelectorAll('p');
    expect(tiles[0].textContent?.trim()).toBe('MAR');
    expect(tiles[1].textContent?.trim()).toBe('10');
  });
});
