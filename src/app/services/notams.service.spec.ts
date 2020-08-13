import { TestBed } from '@angular/core/testing';

import { NotamsService } from './notams.service';

describe('NotamsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NotamsService = TestBed.get(NotamsService);
    expect(service).toBeTruthy();
  });
});
