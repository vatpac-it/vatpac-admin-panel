import { TestBed } from '@angular/core/testing';

import { PermsService } from './perms.service';

describe('PermsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PermsService = TestBed.get(PermsService);
    expect(service).toBeTruthy();
  });
});
