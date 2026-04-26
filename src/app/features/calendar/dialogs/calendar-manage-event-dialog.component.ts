import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
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

@Component({
  selector: 'app-calendar-manage-event-dialog',
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
      [state]="state.manageEventDialogOpen() ? 'open' : 'closed'"
      (stateChanged)="onOpenChange($event)"
    >
      <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-[640px] data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 duration-[250ms]">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>Manage event</h2>
        </hlm-dialog-header>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4 mt-4">
          <hlm-form-field>
            <label hlmLabel for="manage-title">Title</label>
            <input hlmInput id="manage-title" formControlName="title" placeholder="Event title" class="w-full" />
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

          <hlm-dialog-footer class="flex justify-between gap-2">
            <!-- Delete button + nested confirm dialog -->
            <hlm-dialog [state]="confirmOpen() ? 'open' : 'closed'" (stateChanged)="onConfirmChange($event)">
              <button hlmBtn variant="destructive" type="button" (click)="openConfirm()">Delete</button>
              <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-[420px] data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 duration-[250ms]">
                <hlm-dialog-header>
                  <h2 hlmDialogTitle>Delete event</h2>
                  <p hlmDialogDescription>
                    Are you sure you want to delete this event? This action cannot be undone.
                  </p>
                </hlm-dialog-header>
                <hlm-dialog-footer>
                  <button hlmBtn variant="outline" type="button" (click)="cancelDelete()">Cancel</button>
                  <button hlmBtn variant="destructive" type="button" (click)="confirmDelete()">Delete</button>
                </hlm-dialog-footer>
              </hlm-dialog-content>
            </hlm-dialog>

            <div class="flex gap-2">
              <button hlmBtn variant="outline" type="button" (click)="cancel()">Cancel</button>
              <button hlmBtn type="submit" class="aria-disabled:opacity-50 aria-disabled:cursor-not-allowed" [attr.aria-disabled]="form.invalid || null">Update event</button>
            </div>
          </hlm-dialog-footer>
        </form>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class CalendarManageEventDialogComponent {
  protected readonly state = inject(CalendarStateService);
  private readonly fb = inject(FormBuilder);

  form = buildEventForm(this.fb);
  readonly confirmOpen = signal<boolean>(false);

  constructor() {
    // Sync selectedEvent → form when manage dialog opens
    effect(() => {
      const ev = this.state.selectedEvent();
      if (ev) {
        this.form.patchValue(
          { title: ev.title, start: ev.start, end: ev.end, color: ev.color },
          { emitEvent: false },
        );
        this.form.markAsPristine();
        this.form.markAsUntouched();
      }
    });

    // Auto-close if manage dialog is open but selectedEvent is null
    effect(() => {
      if (this.state.manageEventDialogOpen() && !this.state.selectedEvent()) {
        this.state.closeManageEventDialog();
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value as EventFormValue;
    const id = this.state.selectedEvent()!.id;
    this.state.updateEvent({ id, title: v.title, start: v.start, end: v.end, color: v.color });
    this.state.closeManageEventDialog();
    this.state.setSelectedEvent(null);
  }

  protected cancel(): void {
    this.state.closeManageEventDialog();
    this.state.setSelectedEvent(null);
  }

  protected openConfirm(): void {
    this.confirmOpen.set(true);
  }

  protected cancelDelete(): void {
    this.confirmOpen.set(false);
  }

  protected confirmDelete(): void {
    const id = this.state.selectedEvent()?.id;
    if (id) this.state.deleteEvent(id);
    this.confirmOpen.set(false);
    this.state.closeManageEventDialog();
    this.state.setSelectedEvent(null);
  }

  protected onOpenChange(newState: string): void {
    if (newState === 'closed') {
      this.state.closeManageEventDialog();
      this.state.setSelectedEvent(null);
    }
  }

  protected onConfirmChange(newState: string): void {
    if (newState === 'closed') {
      this.confirmOpen.set(false);
    }
  }
}
