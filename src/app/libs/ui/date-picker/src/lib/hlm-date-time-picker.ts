import type { BooleanInput } from '@angular/cdk/coercion';
import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	forwardRef,
	input,
	linkedSignal,
	output,
	signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideChevronDown } from '@ng-icons/lucide';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import type { ChangeFn, TouchFn } from '@spartan-ng/brain/forms';
import { HlmCalendar } from '@spartan-ng/helm/calendar';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { hlm } from '@spartan-ng/helm/utils';
import type { ClassValue } from 'clsx';
import { format } from 'date-fns';

export const HLM_DATE_TIME_PICKER_VALUE_ACCESSOR = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => HlmDateTimePicker),
	multi: true,
};

let nextId = 0;

@Component({
	selector: 'hlm-date-time-picker',
	imports: [HlmIconImports, HlmPopoverImports, HlmCalendar],
	providers: [HLM_DATE_TIME_PICKER_VALUE_ACCESSOR, provideIcons({ lucideCalendar, lucideChevronDown })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'block',
	},
	template: `
		<hlm-popover sideOffset="5" [state]="_popoverState()" (stateChanged)="_popoverState.set($event)">
			<button
				[id]="buttonId()"
				type="button"
				[class]="_computedClass()"
				[disabled]="_mutableDisabled()"
				hlmPopoverTrigger
			>
				<ng-icon hlm size="sm" name="lucideCalendar" class="shrink-0" />
				<span class="truncate flex-1 text-left">
					@if (_formattedDate(); as formattedDate) {
						{{ formattedDate }}
					} @else {
						<ng-content />
					}
				</span>
				<ng-icon hlm size="sm" name="lucideChevronDown" />
			</button>

			<hlm-popover-content class="w-fit p-0 max-h-[90dvh] overflow-y-auto" *hlmPopoverPortal="let ctx">
				<div class="divide-border flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x">
					<hlm-calendar
						calendarClass="border-0 rounded-none"
						[date]="_mutableDate()"
						[disabled]="_mutableDisabled()"
						(dateChange)="_handleDateChange($event)"
					/>
					<div class="divide-border flex divide-x">
						<!-- Hours column -->
						<div class="h-[298px] w-14 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
							<div class="flex flex-col gap-1 p-2">
								@for (h of _hours12(); track h) {
									<button type="button" (click)="_setHour12(h)" [class]="_hourClass(h)">
										{{ h.toString().padStart(2, '0') }}
									</button>
								}
							</div>
						</div>

						<!-- Minutes column -->
						<div class="h-[298px] w-14 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
							<div class="flex flex-col gap-1 p-2">
								@for (m of _minutes(); track m) {
									<button type="button" (click)="_setMinute(m)" [class]="_minuteClass(m)">
										{{ m.toString().padStart(2, '0') }}
									</button>
								}
							</div>
						</div>

						<!-- AM/PM column -->
						<div class="h-[298px] w-14 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
							<div class="flex flex-col gap-1 p-2">
								@for (p of _periods(); track p) {
									<button type="button" (click)="_setPeriod(p)" [class]="_periodClass(p)">
										{{ p }}
									</button>
								}
							</div>
						</div>
					</div>
				</div>
			</hlm-popover-content>
		</hlm-popover>
	`,
})
export class HlmDateTimePicker implements ControlValueAccessor {
	public readonly userClass = input<ClassValue>('', { alias: 'class' });
	protected readonly _computedClass = computed(() =>
		hlm(
			'ring-offset-background border-input bg-background hover:bg-accent dark:bg-input/30 dark:hover:bg-input/50 hover:text-accent-foreground inline-flex h-9 w-full md:w-[280px] cursor-default items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm font-normal whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50',
			'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
			'disabled:pointer-events-none disabled:opacity-50',
			'[&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0',
			this.userClass(),
		),
	);

	public readonly buttonId = input<string>(`hlm-date-time-picker-${++nextId}`);

	public readonly disabled = input<boolean, BooleanInput>(false, {
		transform: booleanAttribute,
	});

	public readonly date = input<Date | undefined>();

	protected readonly _mutableDate = linkedSignal(this.date);
	protected readonly _mutableDisabled = linkedSignal(this.disabled);
	protected readonly _popoverState = signal<BrnDialogState | null>(null);

	protected readonly _selectedHour12 = computed(() => {
		const d = this._mutableDate();
		if (!d) return 12;
		const h = d.getHours();
		return h === 0 ? 12 : h > 12 ? h - 12 : h;
	});

	protected readonly _selectedMinute = computed(() => {
		const d = this._mutableDate();
		return d ? d.getMinutes() : 0;
	});

	protected readonly _selectedPeriod = computed<'AM' | 'PM'>(() => {
		const d = this._mutableDate();
		if (!d) return 'AM';
		return d.getHours() < 12 ? 'AM' : 'PM';
	});

	protected readonly _formattedDate = computed(() => {
		const d = this._mutableDate();
		return d ? format(d, 'MM/dd/yyyy hh:mm aa') : undefined;
	});

	protected readonly _hours12 = signal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
	protected readonly _minutes = signal(Array.from({ length: 12 }, (_, i) => i * 5));
	protected readonly _periods = signal<readonly ['AM', 'PM']>(['AM', 'PM'] as const);

	public readonly dateChange = output<Date>();

	protected _onChange?: ChangeFn<Date>;
	protected _onTouched?: TouchFn;

	protected _hourClass(h: number): string {
		return this._cellClass(this._selectedHour12() === h);
	}

	protected _minuteClass(m: number): string {
		return this._cellClass(this._selectedMinute() === m);
	}

	protected _periodClass(p: 'AM' | 'PM'): string {
		return this._cellClass(this._selectedPeriod() === p);
	}

	private _cellClass(isSelected: boolean): string {
		return hlm(
			'w-full cursor-pointer rounded-md px-2 py-1.5 text-center text-sm transition-colors',
			isSelected ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted',
		);
	}

	protected _handleDateChange(value: Date): void {
		if (this._mutableDisabled()) return;
		const current = this._mutableDate() ?? new Date();
		const next = new Date(value);
		next.setHours(current.getHours(), current.getMinutes(), 0, 0);
		this._mutableDate.set(next);
		this._emitChange(next);
	}

	protected _setHour12(h: number): void {
		if (this._mutableDisabled()) return;
		const current = this._mutableDate() ?? new Date();
		const next = new Date(current);
		const period = this._selectedPeriod();
		let hour24 = h;
		if (period === 'AM') {
			hour24 = h === 12 ? 0 : h;
		} else {
			hour24 = h === 12 ? 12 : h + 12;
		}
		next.setHours(hour24);
		this._mutableDate.set(next);
		this._emitChange(next);
	}

	protected _setMinute(m: number): void {
		if (this._mutableDisabled()) return;
		const current = this._mutableDate() ?? new Date();
		const next = new Date(current);
		next.setMinutes(m);
		this._mutableDate.set(next);
		this._emitChange(next);
	}

	protected _setPeriod(p: 'AM' | 'PM'): void {
		if (this._mutableDisabled()) return;
		const current = this._mutableDate() ?? new Date();
		const next = new Date(current);
		const h = next.getHours();
		if (p === 'AM' && h >= 12) {
			next.setHours(h - 12);
		} else if (p === 'PM' && h < 12) {
			next.setHours(h + 12);
		}
		this._mutableDate.set(next);
		this._emitChange(next);
	}

	private _emitChange(value: Date): void {
		this._onChange?.(value);
		this.dateChange.emit(value);
	}

	public writeValue(value: Date | null): void {
		this._mutableDate.set(value ?? undefined);
	}

	public registerOnChange(fn: ChangeFn<Date>): void {
		this._onChange = fn;
	}

	public registerOnTouched(fn: TouchFn): void {
		this._onTouched = fn;
	}

	public setDisabledState(isDisabled: boolean): void {
		this._mutableDisabled.set(isDisabled);
	}

	public open(): void {
		this._popoverState.set('open');
	}

	public close(): void {
		this._popoverState.set('closed');
	}
}
