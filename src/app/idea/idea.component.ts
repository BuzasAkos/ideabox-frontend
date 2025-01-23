import { Component } from '@angular/core';
import { IdeaBackendService } from './services/idea-backend.service';
import { IdeaSignalService } from './services/idea-signal.service';

@Component({
  selector: 'app-idea',
  standalone: true,
  imports: [],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss'
})
export class IdeaComponent {

  constructor(
    private ideaBackendService: IdeaBackendService,
    protected ideaSignalService: IdeaSignalService,
  ) {}
  
}
