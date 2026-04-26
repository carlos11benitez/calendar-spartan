// calendar-spartan/src/app/features/calendar/header/date/calendar-header-date-chevrons.component.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { addDays, addMonths, addWeeks, subDays, subMonths, subWeeks } from 'date-fns';
import { CalendarHeaderDateChevronsComponent } from './calendar-header-date-chevrons.component';
import { CalendarStateService } from '../../calendar-state.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';

const ANCHOR = new Date(2026, 3, 15, 12, 0, 0); // April 15, 2026 local

describe('CalendarHeaderDateChevronsComponent', () => {
  let service: CalendarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalendarHeaderDateChevronsComponent],
      providers: [CalendarStateService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    });
    service = TestBed.inject(CalendarStateService);
    service.setDate(ANCHOR);
  });

  it('center label reflects current date as "MMMM d, yyyy"', () => {
    const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent?.trim()).toBe('April 15, 2026');
  });

  function clickButton(fixture: ReturnType<typeof TestBed.createComponent>, index: 0 | 1): void {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[index] as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  describe('backward navigation', () => {
    it('day mode → subDays(date, 1)', () => {
      service.setMode('day');
      const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
      fixture.detectChanges();
      clickButton(fixture, 0);
      expect(service.date().getTime()).toBe(subDays(ANCHOR, 1).getTime());
    });

    it('week mode → subWeeks(date, 1)', () => {
      service.setMode('week');
      const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
      fixture.detectChanges();
      clickButton(fixture, 0);
      expect(service.date().getTime()).toBe(subWeeks(ANCHOR, 1).getTime());
    });

    it('month mode → subMonths(date, 1)', () => {
      service.setMode('month');
      const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
      fixture.detectChanges();
      clickButton(fixture, 0);
      expect(service.date().getTime()).toBe(subMonths(ANCHOR, 1).getTime());
    });
  });

  describe('forward navigation', () => {
    it('day mode → addDays(date, 1)', () => {
      service.setMode('day');
      const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
      fixture.detectChanges();
      clickButton(fixture, 1);
      expect(service.date().getTime()).toBe(addDays(ANCHOR, 1).getTime());
    });

    it('week mode → addWeeks(date, 1)', () => {
      service.setMode('week');
      const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
      fixture.detectChanges();
      clickButton(fixture, 1);
      expect(service.date().getTime()).toBe(addWeeks(ANCHOR, 1).getTime());
    });

    it('month mode → addMonths(date, 1)', () => {
      service.setMode('month');
      const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
      fixture.detectChanges();
      clickButton(fixture, 1);
      expect(service.date().getTime()).toBe(addMonths(ANCHOR, 1).getTime());
    });
  });

  describe('REQ-F14-02: chevron aria-labels per mode', () => {
    it('day mode: prev="Previous day", next="Next day"', () => {
      service.setMode('day');
      const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons[0].getAttribute('aria-label')).toBe('Previous day');
      expect(buttons[1].getAttribute('aria-label')).toBe('Next day');
    });

    it('week mode: prev="Previous week", next="Next week"', () => {
      service.setMode('week');
      const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons[0].getAttribute('aria-label')).toBe('Previous week');
      expect(buttons[1].getAttribute('aria-label')).toBe('Next week');
    });

    it('month mode: prev="Previous month", next="Next month"', () => {
      service.setMode('month');
      const fixture = TestBed.createComponent(CalendarHeaderDateChevronsComponent);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons[0].getAttribute('aria-label')).toBe('Previous month');
      expect(buttons[1].getAttribute('aria-label')).toBe('Next month');
    });
  });
});
