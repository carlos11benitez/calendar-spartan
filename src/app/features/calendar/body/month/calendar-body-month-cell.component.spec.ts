// calendar-spartan/src/app/features/calendar/body/month/calendar-body-month-cell.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CalendarBodyMonthCellComponent } from './calendar-body-month-cell.component';
import { CalendarStateService } from '../../calendar-state.service';
import type { CalendarEvent } from '../../calendar-types';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';

/** Minimal matchMedia stub for jsdom — MotionPreferenceService (F8b). */
function stubMatchMedia(matches = false) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Helper: build a minimal CalendarEvent on a given date. */
function makeEvent(id: string, date: Date): CalendarEvent {
  const start = new Date(date);
  start.setHours(9, 0, 0, 0);
  const end = new Date(date);
  end.setHours(10, 0, 0, 0);
  return { id, title: `Event ${id}`, start, end, color: 'blue' };
}

const APR_15 = new Date(2026, 3, 15);  // April 15 2026 — in-month
const MAR_30 = new Date(2026, 2, 30);  // March 30 2026 — out-of-month when anchor=Apr 2026
const APR_1  = new Date(2026, 3, 1);   // April 1 2026  — month anchor

/**
 * Cell spec — validates chip cap, overflow, click navigation, today badge,
 * and out-of-month class bindings.
 * All dates hardcoded (REQ-TEST-CC-12).
 */
describe('CalendarBodyMonthCellComponent', () => {
  let fixture: ComponentFixture<CalendarBodyMonthCellComponent>;
  let state: CalendarStateService;

  beforeEach(async () => {
    // MotionPreferenceService uses window.matchMedia — stub it for jsdom (F8b).
    stubMatchMedia(false);

    await TestBed.configureTestingModule({
      imports: [CalendarBodyMonthCellComponent],
      providers: [provideNoopAnimations(), CalendarStateService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    }).compileComponents();

    state = TestBed.inject(CalendarStateService);
    // Default anchor: April 2026
    state.setDate(APR_1);

    fixture = TestBed.createComponent(CalendarBodyMonthCellComponent);
    // Set input BEFORE first detectChanges (REQ-TEST-CC-2)
    fixture.componentRef.setInput('date', APR_15);
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // ── Chip cap & overflow ──────────────────────────────────────────────────

  it('SCEN-CC-1: renders exactly 3 chips when 4 events exist on cell date', () => {
    state.setEvents([
      makeEvent('e1', APR_15),
      makeEvent('e2', APR_15),
      makeEvent('e3', APR_15),
      makeEvent('e4', APR_15),
    ]);
    fixture.detectChanges();

    const chips = fixture.debugElement.queryAll(By.css('app-calendar-event'));
    expect(chips.length).toBe(3);
  });

  it('SCEN-CC-2: shows "+1 more" overflow indicator for 4 events', () => {
    state.setEvents([
      makeEvent('e1', APR_15),
      makeEvent('e2', APR_15),
      makeEvent('e3', APR_15),
      makeEvent('e4', APR_15),
    ]);
    fixture.detectChanges();

    const overflow = fixture.nativeElement.querySelector('.text-xs.text-muted-foreground');
    expect(overflow).not.toBeNull();
    expect(overflow.textContent?.trim()).toBe('+1 more');
  });

  it('SCEN-CC-3 / SCEN-CC-12: no overflow indicator for exactly 3 events', () => {
    state.setEvents([
      makeEvent('e1', APR_15),
      makeEvent('e2', APR_15),
      makeEvent('e3', APR_15),
    ]);
    fixture.detectChanges();

    const chips = fixture.debugElement.queryAll(By.css('app-calendar-event'));
    expect(chips.length).toBe(3);

    // The overflow div text-xs text-muted-foreground should not appear in the chip container
    // (the day-number wrapper also has text-muted-foreground but is not .text-xs)
    const overflowDivs = Array.from(
      fixture.nativeElement.querySelectorAll('div.text-xs.text-muted-foreground'),
    ) as HTMLElement[];
    expect(overflowDivs.length).toBe(0);
  });

  it('SCEN-CC-11: no chips and no overflow indicator for 0 events', () => {
    state.setEvents([]);
    fixture.detectChanges();

    const chips = fixture.debugElement.queryAll(By.css('app-calendar-event'));
    expect(chips.length).toBe(0);

    const overflowDivs = fixture.nativeElement.querySelectorAll(
      'div.text-xs.text-muted-foreground',
    );
    expect(overflowDivs.length).toBe(0);
  });

  // ── Click navigation ─────────────────────────────────────────────────────

  it('SCEN-CC-4: host click → setDate(APR_15) + setMode("day")', () => {
    fixture.nativeElement.click();
    expect(state.date().getTime()).toBe(APR_15.getTime());
    expect(state.mode()).toBe('day');
  });

  it('SCEN-CC-5: overflow click → same two mutations', () => {
    state.setEvents([
      makeEvent('e1', APR_15),
      makeEvent('e2', APR_15),
      makeEvent('e3', APR_15),
      makeEvent('e4', APR_15),
    ]);
    fixture.detectChanges();

    // Reset state to confirm the click is effective
    state.setDate(APR_1);
    state.setMode('month' as any);

    const overflow = fixture.nativeElement.querySelector(
      'div.text-xs.text-muted-foreground',
    ) as HTMLElement;
    overflow.click();

    expect(state.date().getTime()).toBe(APR_15.getTime());
    expect(state.mode()).toBe('day');
  });

  // ── Out-of-month classes ──────────────────────────────────────────────────

  it('SCEN-CC-6: out-of-month cell carries bg-muted/50, hidden, md:flex', () => {
    // Anchor = April 2026; cell date = March 30 (out of month)
    fixture.componentRef.setInput('date', MAR_30);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    // Tailwind 4: 'bg-muted/50' is a single class token with a slash
    expect(host.className).toContain('bg-muted/50');
    expect(host.classList.contains('hidden')).toBe(true);
    expect(host.className).toContain('md:flex');
  });

  it('SCEN-CC-7: in-month cell does NOT carry out-of-month classes', () => {
    // APR_15 is in April 2026 — anchor is also April 2026
    const host = fixture.nativeElement as HTMLElement;
    expect(host.className).not.toContain('bg-muted/50');
    expect(host.classList.contains('hidden')).toBe(false);
    expect(host.className).not.toContain('md:flex');
  });

  it('SCEN-CC-10: out-of-month click still navigates to that date', () => {
    fixture.componentRef.setInput('date', MAR_30);
    fixture.detectChanges();

    state.setDate(APR_1);
    state.setMode('month' as any);

    fixture.nativeElement.click();
    expect(state.date().getTime()).toBe(MAR_30.getTime());
    expect(state.mode()).toBe('day');
  });

  // ── Today badge ───────────────────────────────────────────────────────────

  it('SCEN-CC-8: today badge classes applied when cell date is today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 10, 0)); // April 15 2026 = today

    // Re-create the fixture with mocked time active
    fixture = TestBed.createComponent(CalendarBodyMonthCellComponent);
    fixture.componentRef.setInput('date', APR_15);
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();

    const dayNumberDiv = fixture.nativeElement.querySelector(
      '.rounded-full.aspect-square',
    ) as HTMLElement;
    expect(dayNumberDiv).not.toBeNull();
    expect(dayNumberDiv.classList.contains('bg-primary')).toBe(true);
    expect(dayNumberDiv.classList.contains('text-background')).toBe(true);
  });

  it('SCEN-CC-9: no today badge when cell date is not today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 10, 0)); // today = Apr 15

    fixture = TestBed.createComponent(CalendarBodyMonthCellComponent);
    fixture.componentRef.setInput('date', new Date(2026, 3, 10)); // Apr 10 — not today
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();

    const dayNumberDiv = fixture.nativeElement.querySelector(
      '.rounded-full.aspect-square',
    ) as HTMLElement;
    expect(dayNumberDiv.classList.contains('bg-primary')).toBe(false);
  });

  // ── Host class tokens ─────────────────────────────────────────────────────

  it('SCEN-CC-13: host carries all required base class tokens', () => {
    const host = fixture.nativeElement as HTMLElement;
    const required = [
      'relative', 'flex', 'flex-col',
      'border-b', 'border-r', 'p-2',
      'md:aspect-square', 'cursor-pointer', 'bg-background',
    ];
    for (const cls of required) {
      expect(host.classList.contains(cls)).toBe(true);
    }
    // bare aspect-square must NOT be on the host (REQ-F9-01/02)
    expect(host.classList.contains('aspect-square')).toBe(false);
  });

  // ── aria-current ──────────────────────────────────────────────────────────

  it('SCEN-MC-ARIA-1: today cell exposes aria-current="date" (REQ-A11Y-MONTH-CELL-CURRENT)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 10, 0)); // April 15 2026 = today

    fixture = TestBed.createComponent(CalendarBodyMonthCellComponent);
    fixture.componentRef.setInput('date', APR_15);
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-current')).toBe('date');
  });

  it('SCEN-MC-ARIA-2: non-today cell has no aria-current attribute (REQ-A11Y-MONTH-CELL-CURRENT)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 10, 0)); // today = Apr 15

    fixture = TestBed.createComponent(CalendarBodyMonthCellComponent);
    fixture.componentRef.setInput('date', new Date(2026, 3, 10)); // Apr 10 — not today
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-current')).toBeNull();
  });

  // ── Roving tabindex (F13a — REQ-F13-02) ──────────────────────────────────

  it('F13a-T1: active=true → host tabindex is "0"', () => {
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('tabindex')).toBe('0');
  });

  it('F13a-T2: active=false → host tabindex is "-1"', () => {
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('tabindex')).toBe('-1');
  });
});
