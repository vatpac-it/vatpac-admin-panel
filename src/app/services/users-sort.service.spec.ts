import { TestBed } from '@angular/core/testing';

import { UsersSortService } from './users-sort.service';

describe('UsersSortService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UsersSortService = TestBed.get(UsersSortService);
    expect(service).toBeTruthy();
  });
});
