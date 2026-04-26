import { describe, it, expect, vi } from 'vitest';
import { EventColorPickerComponent } from './event-color-picker.component';

/**
 * Direct instantiation — no TestBed needed for CVA logic.
 * Template rendering is NOT tested here (no DOM); pure signal/CVA contract.
 */
function create() {
  const comp = new EventColorPickerComponent();
  return comp;
}

describe('EventColorPickerComponent (CVA)', () => {
  it('writeValue sets selected signal', () => {
    const comp = create();
    comp.writeValue('red');
    expect(comp.selected()).toBe('red');
  });

  it('select() calls onChange with new value', () => {
    const comp = create();
    const spy = vi.fn();
    comp.registerOnChange(spy);
    comp.select('emerald');
    expect(spy).toHaveBeenCalledWith('emerald');
  });

  it('select() updates selected signal', () => {
    const comp = create();
    comp.select('amber');
    expect(comp.selected()).toBe('amber');
  });

  it('setDisabledState(true) disables component', () => {
    const comp = create();
    comp.setDisabledState(true);
    expect(comp.disabled()).toBe(true);
  });

  it('select() is a no-op when disabled', () => {
    const comp = create();
    comp.writeValue('blue');
    comp.setDisabledState(true);
    comp.select('red');
    expect(comp.selected()).toBe('blue');
  });

  it('COLOR_OPTIONS has 7 entries', () => {
    const comp = create();
    expect((comp as any).options).toHaveLength(7);
  });

  it('registerOnTouched stores callback', () => {
    const comp = create();
    const spy = vi.fn();
    comp.registerOnTouched(spy);
    comp.select('indigo');
    expect(spy).toHaveBeenCalled();
  });
});
