import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { CalendarStateService } from '../calendar-state.service';
import { CalendarManageEventDialogComponent } from './calendar-manage-event-dialog.component';
import type { CalendarEvent } from '../calendar-types';
import { STORAGE_TOKEN, createStorageStub } from '../../../core/storage';

const MOCK_EVENT: CalendarEvent = {
  id: 'test-id-1',
  title: 'Existing Meeting',
  start: new Date(2024, 0, 10, 14, 0),
  end: new Date(2024, 0, 10, 15, 0),
  color: 'indigo',
};

describe('CalendarManageEventDialogComponent', () => {
  let comp: CalendarManageEventDialogComponent;
  let state: CalendarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalendarStateService, FormBuilder, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    });
    state = TestBed.inject(CalendarStateService);
    // Instantiate component in the injection context — avoids CDK overlay DI requirements
    // since we never render the template (no createComponent / detectChanges)
    comp = TestBed.runInInjectionContext(() => new CalendarManageEventDialogComponent());
  });

  it('creates', () => {
    expect(comp).toBeTruthy();
  });

  it('form is pre-filled when selectedEvent is set', () => {
    state.setSelectedEvent(MOCK_EVENT);
    TestBed.tick();
    expect(comp.form.get('title')?.value).toBe('Existing Meeting');
    expect(comp.form.get('color')?.value).toBe('indigo');
  });

  it('submit() calls updateEvent with correct id and closes dialog', () => {
    state.setEvents([MOCK_EVENT]);
    state.setSelectedEvent(MOCK_EVENT);
    state.openManageEventDialog();
    const updateSpy = vi.spyOn(state, 'updateEvent');
    const closeSpy = vi.spyOn(state, 'closeManageEventDialog');
    comp.form.patchValue({
      title: 'Updated Meeting',
      start: MOCK_EVENT.start,
      end: MOCK_EVENT.end,
      color: 'red',
    });
    (comp as any).submit();
    expect(updateSpy).toHaveBeenCalledOnce();
    expect(updateSpy.mock.calls[0][0].id).toBe('test-id-1');
    expect(updateSpy.mock.calls[0][0].title).toBe('Updated Meeting');
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('submit() is no-op when form is invalid', () => {
    state.setSelectedEvent(MOCK_EVENT);
    const spy = vi.spyOn(state, 'updateEvent');
    comp.form.get('title')?.setValue('');
    (comp as any).submit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('confirmDelete() calls deleteEvent and closes both dialogs', () => {
    state.setEvents([MOCK_EVENT]);
    state.setSelectedEvent(MOCK_EVENT);
    state.openManageEventDialog();
    const deleteSpy = vi.spyOn(state, 'deleteEvent');
    const closeSpy = vi.spyOn(state, 'closeManageEventDialog');
    (comp as any).openConfirm();
    expect(comp.confirmOpen()).toBe(true);
    (comp as any).confirmDelete();
    expect(deleteSpy).toHaveBeenCalledWith('test-id-1');
    expect(comp.confirmOpen()).toBe(false);
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('cancelDelete() closes confirm without deleting', () => {
    state.setSelectedEvent(MOCK_EVENT);
    const spy = vi.spyOn(state, 'deleteEvent');
    (comp as any).openConfirm();
    (comp as any).cancelDelete();
    expect(spy).not.toHaveBeenCalled();
    expect(comp.confirmOpen()).toBe(false);
  });
});
