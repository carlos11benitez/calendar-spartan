import { computed, Directive, effect, input, untracked } from '@angular/core';
import { injectCustomClassSettable } from '@spartan-ng/brain/core';
import { BrnDialogOverlay } from '@spartan-ng/brain/dialog';
import { hlm } from '@spartan-ng/helm/utils';
import { ClassValue } from 'clsx';

// Backdrop opacity bumped 50 → 80 to match shadcn-ui's React reference and to
// cover bleed-through from bright event chips on the underlying calendar
// (especially noticeable on mobile where the dialog has tighter side margins).
export const hlmDialogOverlayClass =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-black/80';

@Directive({
  selector: '[hlmDialogOverlay],hlm-dialog-overlay',
  hostDirectives: [BrnDialogOverlay],
})
export class HlmDialogOverlay {
  private readonly _classSettable = injectCustomClassSettable({ optional: true, host: true });

  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  protected readonly _computedClass = computed(() => hlm(hlmDialogOverlayClass, this.userClass()));

  constructor() {
    effect(() => {
      const newClass = this._computedClass();
      untracked(() => this._classSettable?.setClassToCustomElement(newClass));
    });
  }
}
