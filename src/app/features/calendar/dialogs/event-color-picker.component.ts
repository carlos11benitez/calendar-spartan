import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { COLOR_OPTIONS, EVENT_COLOR_CLASSES, type EventColor } from '../calendar-tailwind-classes';

@Component({
  selector: 'app-event-color-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EventColorPickerComponent),
      multi: true,
    },
  ],
  host: { class: 'flex flex-row gap-2', role: 'radiogroup' },
  template: `
    @for (opt of options; track opt.value) {
      <button
        type="button"
        [class]="swatchClass(opt.value) + ' ' + ringClass(opt.value) + ' w-8 h-8 rounded-full cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'"
        [disabled]="disabled()"
        (click)="select(opt.value)"
        [attr.aria-label]="opt.label"
        [attr.aria-checked]="selected() === opt.value"
        role="radio"
      ></button>
    }
  `,
})
export class EventColorPickerComponent implements ControlValueAccessor {
  protected readonly options = COLOR_OPTIONS;

  readonly selected = signal<EventColor>('blue');
  readonly disabled = signal<boolean>(false);

  private _onChange: (value: EventColor) => void = () => {};
  private _onTouched: () => void = () => {};

  protected swatchClass(color: EventColor): string {
    return EVENT_COLOR_CLASSES[color].swatch;
  }

  protected ringClass(color: EventColor): string {
    return this.selected() === color ? 'ring-2 ring-offset-2 ring-primary' : '';
  }

  select(color: EventColor): void {
    if (this.disabled()) return;
    this.selected.set(color);
    this._onChange(color);
    this._onTouched();
  }

  writeValue(color: EventColor | null): void {
    if (color) this.selected.set(color);
  }

  registerOnChange(fn: (value: EventColor) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
