import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmFormFieldImports } from '@spartan-ng/helm/form-field';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDateTimePicker } from '@spartan-ng/helm/date-picker';
import { CalendarStateService } from '../calendar-state.service';
import { EventColorPickerComponent } from './event-color-picker.component';
import { buildEventForm } from './event-form.helper';
import type { EventFormValue } from './event-form.helper';
import type { CalendarEvent } from '../calendar-types';

@Component({
  selector: 'app-calendar-new-event-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [
    ReactiveFormsModule,
    ...HlmDialogImports,
    ...HlmInputImports,
    ...HlmFormFieldImports,
    ...HlmLabelImports,
    ...HlmButtonImports,
    HlmDateTimePicker,
    EventColorPickerComponent,
  ],
  template: `
    <hlm-dialog
      [state]="state.newEventDialogOpen() ? 'open' : 'closed'"
      (stateChanged)="onOpenChange($event)"
    >
      <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-[640px] data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 duration-[250ms]">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>Create event</h2>
        </hlm-dialog-header>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4 mt-4">
          <hlm-form-field>
            <label hlmLabel for="new-title">Title</label>
            <input hlmInput id="new-title" formControlName="title" placeholder="Event title" class="w-full" />
            @if (form.get('title')?.invalid && form.get('title')?.touched) {
              <hlm-error>Title is required</hlm-error>
            }
          </hlm-form-field>

          <div class="space-y-2">
            <label hlmLabel>Start</label>
            <hlm-date-time-picker formControlName="start" [attr.aria-label]="'Start time'" />
          </div>

          <div class="space-y-2">
            <label hlmLabel>End</label>
            <hlm-date-time-picker formControlName="end" [attr.aria-label]="'End time'" />
            @if (form.errors?.['endBeforeStart'] && (form.get('end')?.touched || form.touched)) {
              <p class="text-destructive text-sm font-medium">End must be after start</p>
            }
          </div>

          <div class="space-y-2">
            <label hlmLabel>Color</label>
            <app-event-color-picker formControlName="color" [attr.aria-label]="'Color'" />
          </div>

          <hlm-dialog-footer>
            <button hlmBtn variant="outline" type="button" (click)="cancel()">Cancel</button>
            <button hlmBtn type="submit" class="aria-disabled:opacity-50 aria-disabled:cursor-not-allowed" [attr.aria-disabled]="form.invalid || null">Create event</button>
          </hlm-dialog-footer>
        </form>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class CalendarNewEventDialogComponent {
  protected readonly state = inject(CalendarStateService);
  private readonly fb = inject(FormBuilder);

  form = buildEventForm(this.fb);

  constructor() {
    // Re-build form with fresh defaults each time the dialog opens
    effect(() => {
      if (this.state.newEventDialogOpen()) {
        this.form = buildEventForm(this.fb);
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value as EventFormValue;
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title: v.title,
      start: v.start,
      end: v.end,
      color: v.color,
    };
    this.state.addEvent(event);
    this.state.closeNewEventDialog();
  }

  protected cancel(): void {
    this.state.closeNewEventDialog();
  }

  protected onOpenChange(newState: string): void {
    if (newState === 'closed') {
      this.state.closeNewEventDialog();
    }
  }
}
