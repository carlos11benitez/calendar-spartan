import { TestBed } from '@angular/core/testing';
import { TimeService } from './time.service';

describe('TimeService', () => {
  let service: TimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeService);
  });

  it('SCEN-TS-1 — now() returns a Date close to Date.now()', () => {
    const result = service.now();
    expect(result).toBeInstanceOf(Date);
    const diff = Math.abs(result.getTime() - Date.now());
    expect(diff).toBeLessThan(1000); // within 1 second of construction
  });
});
