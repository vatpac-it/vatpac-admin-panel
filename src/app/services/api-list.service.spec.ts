import { TestBed } from '@angular/core/testing';

import { ApiListService } from './api-list.service';

describe('ApiListService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ApiListService = TestBed.get(ApiListService);
    expect(service).toBeTruthy();
  });
});
