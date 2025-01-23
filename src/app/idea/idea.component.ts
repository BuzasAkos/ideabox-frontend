import { Component, OnDestroy, OnInit } from '@angular/core';
import { IdeaBackendService } from './services/idea-backend.service';
import { IdeaSignalService } from './services/idea-signal.service';
import { Idea } from './models/idea.entity';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-idea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss'
})
export class IdeaComponent implements OnInit, OnDestroy {

  ideas: Idea[] = [];

  constructor(
    private ideaBackendService: IdeaBackendService,
    protected ideaSignalService: IdeaSignalService,
  ) {}
  
  ngOnInit(): void {
    this.loadAllIdeas()
  }

  // load list of ideas
  loadAllIdeas() {
    this.ideaBackendService.getAllIdeas().subscribe({
      next: (response) => {
        this.ideas = response.ideas;
        console.log(this.ideas);
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  votedFor(idea: Idea) {
    return !!idea.votes.find(i => i.createdBy === this.ideaSignalService.user());
  }

  vote(ideaId: string) {
    this.ideaBackendService.addVote(ideaId).subscribe({
      next: (response) => {
        const index = this.ideas.findIndex(item => item._id === response._id);
        if (index >= 0) this.ideas[index] = response;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  unvote(ideaId: string) {
    this.ideaBackendService.removeVote(ideaId).subscribe({
      next: (response) => {
        const index = this.ideas.findIndex(item => item._id === response._id);
        if (index >= 0) this.ideas[index] = response;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  ngOnDestroy(): void {
    
  }

}
