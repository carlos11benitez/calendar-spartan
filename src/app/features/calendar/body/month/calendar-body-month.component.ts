// calendar-spartan/src/app/features/calendar/body/month/calendar-body-month.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  linkedSignal,
  viewChildren,
} from '@angular/core';
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from 'date-fns';
import { CalendarStateService } from '../../calendar-state.service';
import { CalendarBodyMonthCellComponent } from './calendar-body-month-cell.component';

/**
 * Composer: renders the month grid.
 *
 * Weekday header row: hidden on mobile (< md), 7-column grid on md+.
 * Day cells grid: 7-column on md+; single-column stack on mobile
 *   (out-of-month cells carry `hidden md:flex` so they collapse on mobile).
 *
 * Host class note: 'flex flex-col flex-1 min-h-0 overflow-hidden' ensures
 * this component participates correctly in the CalendarBodyComponent flex-col
 * chain. Without `flex flex-col flex-1` the host stays `display:inline` and
 * the grid cannot expand.
 *
 * Event data: cells inject CalendarStateService directly and self-filter,
 * keeping this composer thin and avoiding an events input prop.
 *
 * weekStartsOn: 1 (Monday) everywhere.
 *
 * Roving tabindex:
 *   activeCellIndex: linkedSignal resets to today's index in days() on month change,
 *   or 0 if today is not in the new grid.
 *   today: captured once at construction so isSameDay comparisons are stable.
 *   cellEls: viewChildren signal of host ElementRefs for imperative focus.
 *   onGridKeydown: Arrow/Home/End navigation with boundary clamping.
 *   onGridClick: syncs activeCellIndex to clicked cell index.
 */
@Component({
  selector: 'app-calendar-body-month',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarBodyMonthCellComponent],
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' },
  template: `
    <!-- Single scroll container so the scrollbar spans both the weekday header and the cell grid. -->
    <div class="flex-1 overflow-y-auto">
      <!-- Weekday header: sticky-top so it stays pinned while cells scroll under it. -->
      <div class="hidden md:grid grid-cols-7 sticky top-0 z-20 bg-background border-border divide-x divide-border">
        @for (label of weekdayLabels; track label) {
          <div class="py-2 text-center text-sm font-medium text-muted-foreground border-b border-border">
            {{ label }}
          </div>
        }
      </div>

      <!-- Day cell grid — event delegation for roving tabindex keyboard navigation -->
      <div
        class="grid md:grid-cols-7 relative"
        tabindex="-1"
        (keydown)="onGridKeydown($event)"
        (click)="onGridClick($event)"
      >
        @for (day of days(); track day.toISOString(); let i = $index) {
          <app-calendar-body-month-cell [date]="day" [active]="i === activeCellIndex()" />
        }
      </div>
    </div>
  `,
})
export class CalendarBodyMonthComponent {
  protected readonly state = inject(CalendarStateService);

  /** Fixed Monday-to-Sunday label array. Rendered once; not reactive. */
  protected readonly weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

  /**
   * All days in the calendar grid for the current month.
   * Extends backwards to the Monday on or before the first of the month,
   * and forwards to the Sunday on or after the last of the month.
   * Length: 28, 35, or 42 depending on the month.
   * April 2026 → 35 days (Mon Mar 30 … Sun May 3).
   */
  protected readonly days = computed(() => {
    const d = this.state.date();
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(d), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(d), { weekStartsOn: 1 }),
    });
  });

  /**
   * Today's date — captured once at construction so it is stable for isSameDay
   * comparisons inside linkedSignal. Test fixtures that use vi.setSystemTime
   * re-create the component to get a fresh `today` value.
   */
  private readonly today = new Date();

  /**
   * The roving-tabindex active cell index.
   * Auto-resets to today's index when days() changes (month navigation).
   * Falls back to 0 when today is not in the new grid.
   * Can be set directly by key/click handlers.
   */
  protected readonly activeCellIndex = linkedSignal({
    source: () => this.days(),
    computation: (days) => {
      const idx = days.findIndex((d) => isSameDay(d, this.today));
      return idx >= 0 ? idx : 0;
    },
  });

  /**
   * Signal of host ElementRefs for all CalendarBodyMonthCellComponent instances.
   * Populated after view init; used for imperative focus after key navigation.
   */
  private readonly cellEls = viewChildren(CalendarBodyMonthCellComponent, { read: ElementRef });

  /**
   * Keyboard event delegation handler for the grid container.
   * Handles Arrow/Home/End keys with boundary clamping.
   * Schedules imperative focus via queueMicrotask so Angular flushes
   * signal changes (tabindex re-render) before focus is called.
   */
  protected onGridKeydown(e: KeyboardEvent): void {
    const len = this.days().length;
    const current = this.activeCellIndex();
    let next: number;

    switch (e.key) {
      case 'ArrowRight':
        next = Math.min(current + 1, len - 1);
        break;
      case 'ArrowLeft':
        next = Math.max(current - 1, 0);
        break;
      case 'ArrowDown':
        next = Math.min(current + 7, len - 1);
        break;
      case 'ArrowUp':
        next = Math.max(current - 7, 0);
        break;
      case 'Home':
        next = current - (current % 7);
        break;
      case 'End':
        next = Math.min(current - (current % 7) + 6, len - 1);
        break;
      default:
        return; // Do not preventDefault for unhandled keys (Tab, Enter, Space, etc.)
    }

    e.preventDefault();
    this.activeCellIndex.set(next);
    queueMicrotask(() => {
      this.cellEls()[next]?.nativeElement?.focus();
    });
  }

  /**
   * Click event delegation handler for the grid container.
   * Walks the event target up to find the nearest app-calendar-body-month-cell host,
   * then syncs activeCellIndex to its index in cellEls.
   * Does NOT preventDefault — existing cell (click)="navigate()" host binding
   * fires independently and continues to work.
   */
  protected onGridClick(e: Event): void {
    const target = e.target as HTMLElement;
    const cellHost = target.closest('app-calendar-body-month-cell') as HTMLElement | null;
    if (!cellHost) return;

    const els = this.cellEls();
    const idx = els.findIndex((ref) => ref.nativeElement === cellHost);
    if (idx >= 0) {
      this.activeCellIndex.set(idx);
    }
  }
}
