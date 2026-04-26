import type { BooleanInput } from '@angular/cdk/coercion';
import { NgComponentOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { classes } from '@spartan-ng/helm/utils';
import { HlmDialogClose } from './hlm-dialog-close';

@Component({
  selector: 'hlm-dialog-content',
  imports: [NgComponentOutlet, HlmIconImports, HlmButton, HlmDialogClose],
  providers: [provideIcons({ lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'dialog-content',
    '[attr.data-state]': 'state()',
  },
  template: `
    @if (component) {
      <ng-container [ngComponentOutlet]="component" />
    } @else {
      <ng-content />
    }

    @if (showCloseButton()) {
      <button hlmBtn variant="ghost" size="icon-sm" class="absolute end-4 top-4" hlmDialogClose>
        <span class="sr-only">close</span>
        <ng-icon hlm size="sm" name="lucideX" />
      </button>
    }
  `,
})
export class HlmDialogContent {
  private readonly _dialogRef = inject(BrnDialogRef);
  private readonly _dialogContext = injectBrnDialogContext({ optional: true });

  public readonly showCloseButton = input<boolean, BooleanInput>(true, {
    transform: booleanAttribute,
  });

  public readonly state = computed(() => this._dialogRef?.state() ?? 'closed');

  public readonly component = this._dialogContext?.$component;
  private readonly _dynamicComponentClass = this._dialogContext?.$dynamicComponentClass;

  constructor() {
    // grid-cols-[minmax(0,1fr)] forces the implicit grid track to fit the
    // container's content area instead of expanding to children's min-content.
    // Without it, a wide-content child (e.g. the date-time-picker trigger
    // displaying "MM/DD/YYYY HH:MM AM") was forcing the column to ~272 px,
    // overflowing the dialog padding on narrow viewports.
    // p-4 sm:p-6 reduces side padding on mobile (16 px) while keeping 24 px on
    // desktop — gives the form more usable width on phones.
    classes(() => [
      'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 mx-auto grid grid-cols-[minmax(0,1fr)] w-full max-w-[calc(100%-1rem)] gap-4 rounded-lg border p-4 sm:p-6 shadow-lg data-[state=closed]:duration-200 data-[state=open]:duration-200 sm:mx-0 sm:max-w-lg',
      this._dynamicComponentClass,
    ]);
  }
}
