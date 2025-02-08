import { TestBed } from '@angular/core/testing';

import { IdeaHttpService } from './idea-http.service';

describe('IdeaService', () => {
  let service: IdeaHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdeaHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
