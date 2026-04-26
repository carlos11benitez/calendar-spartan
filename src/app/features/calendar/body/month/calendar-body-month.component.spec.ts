// calendar-spartan/src/app/features/calendar/body/month/calendar-body-month.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CalendarBodyMonthComponent } from './calendar-body-month.component';
import { CalendarStateService } from '../../calendar-state.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';

/**
 * Composer spec — validates grid structure, cell count, and weekday labels.
 *
 * Canonical test month: April 2026.
 *   startOfWeek(startOfMonth(Apr 1 2026), { weekStartsOn: 1 }) = Mon Mar 30
 *   endOfWeek(endOfMonth(Apr 30 2026),    { weekStartsOn: 1 }) = Sun May  3
 *   → 35 days total (5 weeks × 7 days)
 *
 * All dates hardcoded — no raw `new Date()` (REQ-TEST-MC-5).
 */
describe('CalendarBodyMonthComponent', () => {
  let fixture: ComponentFixture<CalendarBodyMonthComponent>;
  let state: CalendarStateService;

  beforeEach(async () => {
    // MotionPreferenceService uses window.matchMedia — stub it for jsdom (F8b).
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    await TestBed.configureTestingModule({
      imports: [CalendarBodyMonthComponent],
      providers: [provideNoopAnimations(), CalendarStateService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    }).compileComponents();

    state = TestBed.inject(CalendarStateService);
    // April 2026 — produces exactly 35 calendar cells (SCEN-MC-1)
    state.setDate(new Date(2026, 3, 1));

    fixture = TestBed.createComponent(CalendarBodyMonthComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('SCEN-MC-1: renders 35 cells for April 2026', () => {
    const cells = fixture.debugElement.queryAll(
      By.css('app-calendar-body-month-cell'),
    );
    expect(cells.length).toBe(35);
  });

  it('SCEN-MC-2: renders 28 cells for February 2021 (starts Mon, ends Sun)', () => {
    state.setDate(new Date(2021, 1, 1));
    fixture.detectChanges();
    const cells = fixture.debugElement.queryAll(
      By.css('app-calendar-body-month-cell'),
    );
    expect(cells.length).toBe(28);
  });

  it('SCEN-MC-3: weekday header contains Mon..Sun in order', () => {
    // The header div is always in the DOM; md:grid hides it visually on mobile.
    const headerDiv = fixture.debugElement.query(
      By.css('.grid-cols-7.border-border'),
    );
    expect(headerDiv).not.toBeNull();

    const labels = headerDiv.nativeElement.querySelectorAll('div');
    const texts = Array.from(labels).map((el: any) => el.textContent?.trim());
    expect(texts).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('SCEN-MC-3b: first label is Mon, last label is Sun', () => {
    const headerDiv = fixture.debugElement.query(
      By.css('.grid-cols-7.border-border'),
    );
    const labels = Array.from(
      headerDiv.nativeElement.querySelectorAll('div'),
    ) as HTMLElement[];
    expect(labels[0].textContent?.trim()).toBe('Mon');
    expect(labels[6].textContent?.trim()).toBe('Sun');
  });

  it('SCEN-MC-4: host element carries required flex-chain classes', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('flex')).toBe(true);
    expect(host.classList.contains('flex-col')).toBe(true);
    expect(host.classList.contains('flex-1')).toBe(true);
    expect(host.classList.contains('min-h-0')).toBe(true);
    expect(host.classList.contains('overflow-hidden')).toBe(true);
  });

  it('SCEN-MC-5: cell grid has md:grid-cols-7 class', () => {
    // The cell grid is the parent of the rendered <app-calendar-body-month-cell> elements.
    const firstCell = fixture.debugElement.query(
      By.css('app-calendar-body-month-cell'),
    );
    expect(firstCell).not.toBeNull();
    const cellGrid = firstCell.nativeElement.parentElement as HTMLElement;
    // Angular renders 'md:grid-cols-7' as a literal class token
    expect(cellGrid.classList.toString()).toContain('grid-cols-7');
  });

  // ────────────────────────────────────────────────────────────────────────
  // F13b — Roving tabindex: composer logic
  // Canonical setup: April 2026.
  //   days()[0] = Mon Mar 30 2026 (out-of-month)
  //   Apr 15 2026 (Wednesday) = index 16 in days() (Mar30=0..Apr1=2, Apr15=16)
  //   Apr 1 = index 2 (Mon Mar 30=0, Tue Mar 31=1, Wed Apr 1=2)
  // ────────────────────────────────────────────────────────────────────────

  describe('F13b — roving tabindex: activeCellIndex', () => {

    it('F13b-T1: activeCellIndex initialized to today\'s index when today is in April 2026', async () => {
      // April 15 2026 is a Wednesday; index in April 2026 grid = 16
      // Mar30=0, Mar31=1, Apr1=2, Apr2=3 ... Apr15=2+14=16
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));

      // Re-create fixture after setting system time so `today = new Date()` captures the fake date
      fixture.destroy();
      fixture = TestBed.createComponent(CalendarBodyMonthComponent);
      fixture.detectChanges();

      const comp = fixture.componentInstance as any;
      expect(comp.activeCellIndex()).toBe(16);
    });

    it('F13b-T2: ArrowRight increments activeCellIndex within bounds', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));
      fixture.destroy();
      fixture = TestBed.createComponent(CalendarBodyMonthComponent);
      fixture.detectChanges();

      const comp = fixture.componentInstance as any;
      const initialIdx = comp.activeCellIndex();

      const grid = fixture.debugElement.query(By.css('.grid.md\\:grid-cols-7'));
      grid.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(comp.activeCellIndex()).toBe(initialIdx + 1);
    });

    it('F13b-T3: ArrowLeft decrements activeCellIndex within bounds', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));
      fixture.destroy();
      fixture = TestBed.createComponent(CalendarBodyMonthComponent);
      fixture.detectChanges();

      const comp = fixture.componentInstance as any;
      const initialIdx = comp.activeCellIndex();

      const grid = fixture.debugElement.query(By.css('.grid.md\\:grid-cols-7'));
      grid.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();

      expect(comp.activeCellIndex()).toBe(initialIdx - 1);
    });

    it('F13b-T4: ArrowDown adds 7 (clamps to bounds)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));
      fixture.destroy();
      fixture = TestBed.createComponent(CalendarBodyMonthComponent);
      fixture.detectChanges();

      const comp = fixture.componentInstance as any;
      const initialIdx = comp.activeCellIndex(); // 16

      const grid = fixture.debugElement.query(By.css('.grid.md\\:grid-cols-7'));
      grid.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();

      expect(comp.activeCellIndex()).toBe(Math.min(initialIdx + 7, 34)); // 35 cells → max idx 34
    });

    it('F13b-T5: ArrowUp subtracts 7 (clamps to bounds)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));
      fixture.destroy();
      fixture = TestBed.createComponent(CalendarBodyMonthComponent);
      fixture.detectChanges();

      const comp = fixture.componentInstance as any;
      const initialIdx = comp.activeCellIndex(); // 16

      const grid = fixture.debugElement.query(By.css('.grid.md\\:grid-cols-7'));
      grid.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      fixture.detectChanges();

      expect(comp.activeCellIndex()).toBe(Math.max(initialIdx - 7, 0)); // 9
    });

    it('F13b-T6: Home jumps to row start', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));
      fixture.destroy();
      fixture = TestBed.createComponent(CalendarBodyMonthComponent);
      fixture.detectChanges();

      const comp = fixture.componentInstance as any;
      // idx=16 → row start = 16 - (16 % 7) = 16 - 2 = 14
      const initialIdx = comp.activeCellIndex(); // 16
      const expectedRowStart = initialIdx - (initialIdx % 7); // 14

      const grid = fixture.debugElement.query(By.css('.grid.md\\:grid-cols-7'));
      grid.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      fixture.detectChanges();

      expect(comp.activeCellIndex()).toBe(expectedRowStart);
    });

    it('F13b-T7: End jumps to row end', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));
      fixture.destroy();
      fixture = TestBed.createComponent(CalendarBodyMonthComponent);
      fixture.detectChanges();

      const comp = fixture.componentInstance as any;
      // idx=16 → row end = 16 - (16 % 7) + 6 = 14 + 6 = 20, clamped to 34
      const initialIdx = comp.activeCellIndex(); // 16
      const expectedRowEnd = Math.min(initialIdx - (initialIdx % 7) + 6, 34); // 20

      const grid = fixture.debugElement.query(By.css('.grid.md\\:grid-cols-7'));
      grid.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      fixture.detectChanges();

      expect(comp.activeCellIndex()).toBe(expectedRowEnd);
    });

    it('F13b-T8: boundary clamp — ArrowLeft on idx=0 stays 0; ArrowDown on last row stays', async () => {
      const comp = fixture.componentInstance as any;

      const grid = fixture.debugElement.query(By.css('.grid.md\\:grid-cols-7'));

      // Force activeCellIndex to 0
      comp.activeCellIndex.set(0);
      fixture.detectChanges();

      grid.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(comp.activeCellIndex()).toBe(0);

      // Force activeCellIndex to last cell (34 for April 2026)
      comp.activeCellIndex.set(34);
      fixture.detectChanges();

      grid.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      expect(comp.activeCellIndex()).toBe(34); // clamped, stays at 34
    });

    it('F13b-T9: click on cell N updates activeCellIndex to N', async () => {
      const comp = fixture.componentInstance as any;

      // Click on the 5th cell (index 4)
      const cells = fixture.debugElement.queryAll(By.css('app-calendar-body-month-cell'));
      const targetCell = cells[4];
      targetCell.nativeElement.click();
      fixture.detectChanges();

      expect(comp.activeCellIndex()).toBe(4);
    });

    it('F13b-T10: after arrow keypress, HTMLElement.prototype.focus was called', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));
      fixture.destroy();
      fixture = TestBed.createComponent(CalendarBodyMonthComponent);
      fixture.detectChanges();

      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

      const grid = fixture.debugElement.query(By.css('.grid.md\\:grid-cols-7'));
      grid.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      // Flush microtasks (queueMicrotask)
      await Promise.resolve();

      expect(focusSpy).toHaveBeenCalled();
      focusSpy.mockRestore();
    });

    it('F13b-T11: when state.date() advances to next month, activeCellIndex resets to today index in new days or 0 if today not present', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0)); // today = Apr 15 2026
      fixture.destroy();
      fixture = TestBed.createComponent(CalendarBodyMonthComponent);
      fixture.detectChanges();

      const comp = fixture.componentInstance as any;
      // Initially April → today index = 16
      expect(comp.activeCellIndex()).toBe(16);

      // Navigate to May 2026 — today (Apr 15) not in May grid
      state.setDate(new Date(2026, 4, 1)); // May 2026
      fixture.detectChanges();

      // Today not in May → reset to 0
      expect(comp.activeCellIndex()).toBe(0);
    });
  });
});
