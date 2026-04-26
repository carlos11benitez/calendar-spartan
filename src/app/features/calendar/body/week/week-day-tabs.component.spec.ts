// calendar-spartan/src/app/features/calendar/body/week/week-day-tabs.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { addDays } from 'date-fns';
import { WeekDayTabsComponent } from './week-day-tabs.component';

// ---------------------------------------------------------------------------
// Fixed week: Mon 2025-04-21 … Sun 2025-04-27
// ---------------------------------------------------------------------------
const WEEK_START = new Date(2025, 3, 21); // Mon April 21, 2025
const WEEK_DAYS: Date[] = Array.from({ length: 7 }, (_, i) => addDays(WEEK_START, i));
// Indices: 0=Mon21, 1=Tue22, 2=Wed23, 3=Thu24, 4=Fri25, 5=Sat26, 6=Sun27

describe('WeekDayTabsComponent', () => {
  let fixture: ComponentFixture<WeekDayTabsComponent>;
  let comp: WeekDayTabsComponent;

  function createFixture(opts: {
    today: Date;
    activeIndex: number;
  }): ComponentFixture<WeekDayTabsComponent> {
    const f = TestBed.createComponent(WeekDayTabsComponent);
    f.componentRef.setInput('days', WEEK_DAYS);
    f.componentRef.setInput('activeIndex', opts.activeIndex);
    f.componentRef.setInput('today', opts.today);
    f.detectChanges();
    return f;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekDayTabsComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  // -------------------------------------------------------------------------
  // Test 1: 7 button pills rendered
  // -------------------------------------------------------------------------
  it('F11b-T1: renders exactly 7 button pills', () => {
    fixture = createFixture({ today: new Date(2025, 3, 23), activeIndex: 2 });
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(7);
  });

  // -------------------------------------------------------------------------
  // Test 2: aria-label format "EEEE MMMM d"
  // -------------------------------------------------------------------------
  it('F11b-T2: each pill has aria-label matching "EEEE MMMM d" format', () => {
    fixture = createFixture({ today: new Date(2025, 3, 23), activeIndex: 0 });
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const expectedLabels = [
      'Monday April 21',
      'Tuesday April 22',
      'Wednesday April 23',
      'Thursday April 24',
      'Friday April 25',
      'Saturday April 26',
      'Sunday April 27',
    ];
    buttons.forEach((btn, i) => {
      expect(btn.getAttribute('aria-label')).toBe(expectedLabels[i]);
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: pill at activeIndex=2 has ring-2 active highlight class
  // -------------------------------------------------------------------------
  it('F11b-T3: pill at activeIndex=2 has ring-2 active highlight', () => {
    fixture = createFixture({ today: new Date(2025, 3, 21), activeIndex: 2 }); // today=Mon, active=Wed
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    // pill at index 2 (Wed) should have ring-2
    expect(buttons[2].classList).toContain('ring-2');
    // other non-today pills should not have ring-2
    expect(buttons[0].classList).not.toContain('ring-2');
    expect(buttons[1].classList).not.toContain('ring-2');
    expect(buttons[3].classList).not.toContain('ring-2');
  });

  // -------------------------------------------------------------------------
  // Test 4: pill matching today input has today highlight (bg-primary)
  // -------------------------------------------------------------------------
  it('F11b-T4: today pill has bg-primary class; other pills do not', () => {
    // today = Wed April 23 (index 2), activeIndex = 0 (different from today)
    fixture = createFixture({ today: new Date(2025, 3, 23), activeIndex: 0 });
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    // Wed (index 2) should have bg-primary
    expect(buttons[2].classList).toContain('bg-primary');
    // others (not today) should not
    expect(buttons[0].classList).not.toContain('bg-primary');
    expect(buttons[1].classList).not.toContain('bg-primary');
    expect(buttons[3].classList).not.toContain('bg-primary');
  });

  // -------------------------------------------------------------------------
  // Test 5: clicking a pill emits pillClick with the correct index
  // -------------------------------------------------------------------------
  it('F11b-T5: clicking pill at index 3 emits pillClick(3)', () => {
    fixture = createFixture({ today: new Date(2025, 3, 23), activeIndex: 0 });
    comp = fixture.componentInstance;
    const emitted: number[] = [];
    comp.pillClick.subscribe((idx: number) => emitted.push(idx));

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[3].click();
    fixture.detectChanges();

    expect(emitted).toEqual([3]);
  });

  // -------------------------------------------------------------------------
  // Test 6 (optional): Enter keypress also emits pillClick
  // -------------------------------------------------------------------------
  it('F11b-T6: Enter keydown on pill at index 5 emits pillClick(5)', () => {
    fixture = createFixture({ today: new Date(2025, 3, 23), activeIndex: 0 });
    comp = fixture.componentInstance;
    const emitted: number[] = [];
    comp.pillClick.subscribe((idx: number) => emitted.push(idx));

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    buttons[5].dispatchEvent(enterEvent);
    fixture.detectChanges();

    expect(emitted).toEqual([5]);
  });

  // -------------------------------------------------------------------------
  // Test 7: Space keypress also emits pillClick
  // -------------------------------------------------------------------------
  it('F11b-T7: Space keydown on pill at index 1 emits pillClick(1)', () => {
    fixture = createFixture({ today: new Date(2025, 3, 23), activeIndex: 0 });
    comp = fixture.componentInstance;
    const emitted: number[] = [];
    comp.pillClick.subscribe((idx: number) => emitted.push(idx));

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    buttons[1].dispatchEvent(spaceEvent);
    fixture.detectChanges();

    expect(emitted).toEqual([1]);
  });

  // -------------------------------------------------------------------------
  // Test 8: each pill shows 3-letter day name and numeric date
  // -------------------------------------------------------------------------
  it('F11b-T8: each pill displays short day name (e.g. Mon) and numeric date', () => {
    fixture = createFixture({ today: new Date(2025, 3, 23), activeIndex: 0 });
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    // First pill: Mon 21
    expect(buttons[0].textContent).toContain('Mon');
    expect(buttons[0].textContent).toContain('21');
    // Third pill: Wed 23
    expect(buttons[2].textContent).toContain('Wed');
    expect(buttons[2].textContent).toContain('23');
  });
});
