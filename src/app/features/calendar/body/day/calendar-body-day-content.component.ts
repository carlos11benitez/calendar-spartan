import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { format, isToday } from 'date-fns';
import { CalendarStateService } from '../../calendar-state.service';
import { TimeService } from '../../../../core/services/time.service';
import { MotionPreferenceService } from '../../../../core/services/motion-preference.service';
import { AnimationsReadyService } from '../../../../core/services/animations-ready.service';
import { CalendarBodyHeaderComponent } from '../calendar-body-header.component';
import { CalendarEventComponent } from '../calendar-event.component';
import { calculateEventLayout, HOUR_HEIGHT } from '../calendar-event-positioning';
import { eventCardEnter, eventCardLeave } from '../calendar-event-animations';

@Component({
  selector: 'app-calendar-body-day-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarBodyHeaderComponent, CalendarEventComponent],
  animations: [eventCardEnter(), eventCardLeave()],
  host: { class: 'flex flex-col flex-1 min-w-0 self-start' },
  template: `
    <app-calendar-body-header [date]="state.date()" [onlyDay]="false" />
    <div class="flex-1 relative" [@.disabled]="animationsDisabled()">
      @for (h of hours; track h) {
        <div class="border-b border-border/50" [style.height.px]="HOUR_HEIGHT"></div>
      }
      @for (item of layouts(); track item.event.id) {
        <div
          class="absolute px-1"
          [style.top.px]="item.top"
          [style.height.px]="item.height"
          [style.left]="item.left"
          [style.width]="item.width"
          [@eventCardEnter]="{ value: '', params: { duration: motion.duration(200) } }"
          [@eventCardLeave]="{ value: '', params: { duration: motion.duration(150) } }"
        >
          <app-calendar-event [event]="item.event" />
        </div>
      }
      @if (isCurrentDay()) {
        <div
          class="absolute -left-12 right-0 flex items-center gap-1 z-20 pointer-events-none"
          [style.top.px]="timeLinePx()"
        >
          <span class="w-12 pr-1 text-right text-xs text-primary leading-none">
            {{ currentTimeLabel() }}
          </span>
          <div class="h-2 w-2 rounded-full bg-primary shrink-0"></div>
          <div class="h-0.5 flex-1 bg-primary"></div>
        </div>
      }
    </div>
  `,
})
export class CalendarBodyDayContentComponent {
  protected readonly state = inject(CalendarStateService);
  protected readonly time = inject(TimeService);
  protected readonly motion = inject(MotionPreferenceService);
  private readonly mount = inject(AnimationsReadyService);
  protected readonly HOUR_HEIGHT = HOUR_HEIGHT;
  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);

  /**
   * Suppresses all animations during the FIRST app render so seed events do
   * not animate in on cold load. The flag lives in a shared `AnimationsReadyService`
   * so subsequent component instantiations (e.g., week/month nav re-creating
   * columns/cells) read the already-true value and DO animate on date changes.
   */
  protected readonly animationsDisabled = computed(() => !this.mount.ready());

  protected readonly layouts = computed(() =>
    calculateEventLayout(this.state.events(), this.state.date()),
  );

  protected readonly isCurrentDay = computed(() => isToday(this.state.date()));

  protected readonly timeLinePx = computed(
    () =>
      this.time.now().getHours() * HOUR_HEIGHT +
      (this.time.now().getMinutes() / 60) * HOUR_HEIGHT,
  );

  protected readonly currentTimeLabel = computed(() =>
    format(this.time.now(), 'h:mm a'),
  );
}
