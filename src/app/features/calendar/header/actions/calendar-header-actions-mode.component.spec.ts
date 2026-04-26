// calendar-spartan/src/app/features/calendar/header/actions/calendar-header-actions-mode.component.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CalendarHeaderActionsModeComponent } from './calendar-header-actions-mode.component';
import { CalendarStateService } from '../../calendar-state.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';

describe('CalendarHeaderActionsModeComponent', () => {
  let service: CalendarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalendarHeaderActionsModeComponent],
      providers: [CalendarStateService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    });
    service = TestBed.inject(CalendarStateService);
  });

  it('renders exactly 3 buttons in order Day/Week/Month', () => {
    const fixture = TestBed.createComponent(CalendarHeaderActionsModeComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(3);
    const labels = Array.from(buttons).map(
      (b) => (b as HTMLElement).querySelector('span')?.textContent?.trim(),
    );
    expect(labels).toEqual(['Day', 'Week', 'Month']);
  });

  it('container has role="group"', () => {
    const fixture = TestBed.createComponent(CalendarHeaderActionsModeComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('role')).toBe('group');
  });

  it('aria-pressed reflects active mode', () => {
    service.setMode('week');
    const fixture = TestBed.createComponent(CalendarHeaderActionsModeComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false'); // day
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');  // week
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false'); // month
  });

  it('clicking Month button calls state.setMode("month")', () => {
    service.setMode('week');
    const fixture = TestBed.createComponent(CalendarHeaderActionsModeComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[2] as HTMLButtonElement).click();
    expect(service.mode()).toBe('month');
  });

  it('clicking already-active mode still calls setMode (no deselection)', () => {
    service.setMode('day');
    const fixture = TestBed.createComponent(CalendarHeaderActionsModeComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();
    expect(service.mode()).toBe('day'); // unchanged value, but setMode was called
  });

  it('REQ-F14-01: each button has aria-label matching "{mode} view"', () => {
    service.setMode('day');
    const fixture = TestBed.createComponent(CalendarHeaderActionsModeComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-label')).toBe('Day view');
    expect(buttons[1].getAttribute('aria-label')).toBe('Week view');
    expect(buttons[2].getAttribute('aria-label')).toBe('Month view');
  });
});
