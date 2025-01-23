import { TestBed } from '@angular/core/testing';

import { IdeaBackendService } from './idea-backend.service';

describe('IdeaService', () => {
  let service: IdeaBackendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdeaBackendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
