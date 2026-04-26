// calendar-spartan/src/app/features/calendar/header/actions/calendar-header-actions-add.component.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CalendarHeaderActionsAddComponent } from './calendar-header-actions-add.component';
import { CalendarStateService } from '../../calendar-state.service';
import { STORAGE_TOKEN, createStorageStub } from '../../../../core/storage';

describe('CalendarHeaderActionsAddComponent', () => {
  let service: CalendarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalendarHeaderActionsAddComponent],
      providers: [CalendarStateService, { provide: STORAGE_TOKEN, useFactory: createStorageStub }],
    });
    service = TestBed.inject(CalendarStateService);
  });

  it('renders a single button with text "Add Event" and a plus icon', () => {
    const fixture = TestBed.createComponent(CalendarHeaderActionsAddComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).not.toBeNull();
    expect(button.textContent).toContain('Add Event');
    const icon = button.querySelector('ng-icon');
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('name')).toBe('lucidePlus');
  });

  it('click opens the new-event dialog flag', () => {
    expect(service.newEventDialogOpen()).toBe(false);
    const fixture = TestBed.createComponent(CalendarHeaderActionsAddComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(service.newEventDialogOpen()).toBe(true);
  });
});
