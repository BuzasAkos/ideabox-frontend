import { TestBed } from '@angular/core/testing';

import { IdeaSignalService } from './idea-signal.service';

describe('IdeaSignalService', () => {
  let service: IdeaSignalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdeaSignalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
