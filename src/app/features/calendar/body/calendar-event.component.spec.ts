// calendar-spartan/src/app/features/calendar/body/calendar-event.component.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CalendarEventComponent } from './calendar-event.component';
import { CalendarStateService } from '../calendar-state.service';
import type { CalendarEvent } from '../calendar-types';
import { STORAGE_TOKEN, createStorageStub } from '../../../core/storage';

// Single canonical sample — avoids factories because shape is trivial.
const SAMPLE: CalendarEvent = {
  id: 'evt-1',
  title: 'Standup',
  color: 'blue',
  start: new Date(2026, 3, 15, 9, 0, 0),   // April 15 2026, 09:00
  end:   new Date(2026, 3, 15, 10, 0, 0),  // April 15 2026, 10:00
};

describe('CalendarEventComponent', () => {
  let service: CalendarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalendarEventComponent],
      providers: [CalendarStateService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    });
    service = TestBed.inject(CalendarStateService);
  });

  it('CE-CLICK-ORDER: click fires setSelectedEvent(event) THEN openManageEventDialog()', () => {
    const fixture = TestBed.createComponent(CalendarEventComponent);
    fixture.componentRef.setInput('event', SAMPLE);
    fixture.detectChanges();

    // Pre-click assertions
    expect(service.selectedEvent()).toBeNull();
    expect(service.manageEventDialogOpen()).toBe(false);

    (fixture.nativeElement as HTMLElement).click();

    expect(service.selectedEvent()).toBe(SAMPLE);
    expect(service.manageEventDialogOpen()).toBe(true);
  });

  it('CE-TIME-FORMAT: renders time range as "h:mm a" (e.g. "9:00 AM - 10:00 AM")', () => {
    const fixture = TestBed.createComponent(CalendarEventComponent);
    fixture.componentRef.setInput('event', SAMPLE);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('9:00 AM');
    expect(text).toContain('10:00 AM');
    expect(text).toContain('-');
  });

  it('CE-COLOR: applies surface tokens to host and text token to inner content div', () => {
    const fixture = TestBed.createComponent(CalendarEventComponent);
    fixture.componentRef.setInput('event', SAMPLE);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    // Host has surface tokens (10% tint, border, hover) — NOT solid bg-blue-500, NOT text-blue-700.
    expect(host.className).toContain('bg-blue-500/10');
    expect(host.className).toContain('border-blue-500');
    expect(host.className).not.toContain('text-blue-700');

    // Inner content div has text-blue-700 (dark:text-blue-300) only.
    const inner = host.querySelector('div') as HTMLElement;
    expect(inner).not.toBeNull();
    expect(inner.className).toContain('text-blue-700');
  });

  it('CE-TITLE: renders event title verbatim', () => {
    const fixture = TestBed.createComponent(CalendarEventComponent);
    fixture.componentRef.setInput('event', SAMPLE);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Standup');
  });

  it('CE-MONTH: month=true shows start time only (no end time, no separator in layout)', () => {
    const fixture = TestBed.createComponent(CalendarEventComponent);
    fixture.componentRef.setInput('event', SAMPLE);
    fixture.componentRef.setInput('month', true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('9:00 AM');
    expect(text).not.toContain('10:00 AM');
  });

  it('SCEN-1-KBD: Enter key opens manage dialog (REQ-A11Y-EVENT-KBD)', () => {
    const fixture = TestBed.createComponent(CalendarEventComponent);
    fixture.componentRef.setInput('event', SAMPLE);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(service.selectedEvent()).toBeNull();
    expect(service.manageEventDialogOpen()).toBe(false);

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(service.selectedEvent()).toBe(SAMPLE);
    expect(service.manageEventDialogOpen()).toBe(true);
  });

  it('SCEN-2-KBD: Space key opens manage dialog and suppresses scroll (REQ-A11Y-EVENT-KBD)', () => {
    const fixture = TestBed.createComponent(CalendarEventComponent);
    fixture.componentRef.setInput('event', SAMPLE);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    host.dispatchEvent(spaceEvent);

    expect(service.selectedEvent()).toBe(SAMPLE);
    expect(service.manageEventDialogOpen()).toBe(true);
    expect(spaceEvent.defaultPrevented).toBe(true);
  });

  it('REQ-F14-08: host class includes focus-visible:ring-2', () => {
    const fixture = TestBed.createComponent(CalendarEventComponent);
    fixture.componentRef.setInput('event', SAMPLE);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).className).toContain('focus-visible:ring-2');
  });

});
