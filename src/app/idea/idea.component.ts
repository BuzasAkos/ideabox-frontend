import { Component, OnDestroy, OnInit } from '@angular/core';
import { IdeaBackendService } from './services/idea-backend.service';
import { IdeaSignalService } from './services/idea-signal.service';
import { Idea } from './models/idea.entity';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateIdeaDto } from './models/create-idea.dto';
import { UpdateIdeaDto } from './models/update-idea.dto';

@Component({
  selector: 'app-idea',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss'
})
export class IdeaComponent implements OnInit, OnDestroy {

  ideas: Idea[] = [];
  tabs: string[] = [
    'All Ideas',
    'Favourite Ideas'
  ]
  tabState: number = 0;
  popupState: number = 0;
  isLoading: boolean = false;
  newIdeaForm!: FormGroup;
  selectedIdeaId?: string;

  constructor(
    private ideaBackendService: IdeaBackendService,
    protected ideaSignalService: IdeaSignalService,
    private formBuilder: FormBuilder,
  ) {}
  
  ngOnInit(): void {
    this.initForms()
    this.loadAllIdeas()
  }

  initForms() {
    this.newIdeaForm = this.formBuilder.group({
      title: ["", [Validators.required, Validators.minLength(4), Validators.maxLength(40)]],
      description: ["", [Validators.maxLength(200)]],
    });
  }

  // load list of ideas
  loadAllIdeas() {
    this.tabState = 0;
    this.isLoading = true;
    this.ideaBackendService.getAllIdeas().subscribe({
      next: (response) => {
        this.ideas = response.ideas;
        console.log(this.ideas);
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    });
  }

  loadFavouriteIdeas() {
    this.tabState = 1;
    this.isLoading = true;
    this.ideaBackendService.getFavouriteIdeas().subscribe({
      next: (response) => {
        this.ideas = response.ideas;
        console.log(this.ideas);
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    });
  }

  votedFor(idea: Idea) {
    return !!idea.votes.find(i => i.createdBy === this.ideaSignalService.user());
  }

  changeTab(index: number) {
    if (index === 0) this.loadAllIdeas();
    if (index === 1) this.loadFavouriteIdeas();
  }

  onPostClicked() {
    this.newIdeaForm.reset();
    this.newIdeaForm.enable();
    this.popupState = 1;
  }

  onSaveNewIdea() {
    if (this.newIdeaForm.invalid) return;
    this.popupState = 0;
    this.isLoading = true;
    const idea: CreateIdeaDto = {
      title: this.newIdeaForm.value.title,
      description: this.newIdeaForm.value.description,
    }
    this.ideaBackendService.createIdea(idea).subscribe({
      next: (response) => {
        if (this.tabState === 0) this.loadAllIdeas();
        if (this.tabState === 1) this.loadFavouriteIdeas();
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    })
  }

  onEditClicked(idea: Idea) {
    this.newIdeaForm.reset();
    this.newIdeaForm.patchValue({
      title: idea.title,
      description: idea.description
    });
    this.selectedIdeaId = idea._id;
    this.newIdeaForm.get('title')?.disable();
    this.popupState = 2;
  }

  onSaveEditedIdea() {
    if (this.newIdeaForm.invalid || !this.selectedIdeaId) return;
    console.log(this.selectedIdeaId);
    this.popupState = 0;
    this.isLoading = true;
    const idea: UpdateIdeaDto = {
      description: this.newIdeaForm.value.description,
    }
    this.ideaBackendService.updateIdea(this.selectedIdeaId, idea).subscribe({
      next: (response) => {
        if (this.tabState === 0) this.loadAllIdeas();
        if (this.tabState === 1) this.loadFavouriteIdeas();
        this.selectedIdeaId = undefined;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    })
  }

  onRemoveClicked(id: string) {
    this.selectedIdeaId = id;
    this.popupState = 3;
  }

  removeIdea() {
    if (!this.selectedIdeaId) return;
    this.popupState = 0;
    this.isLoading = true;
    this.ideaBackendService.removeIdea(this.selectedIdeaId).subscribe({
      next: (response) => {
        if (this.tabState === 0) this.loadAllIdeas();
        if (this.tabState === 1) this.loadFavouriteIdeas();
        this.selectedIdeaId = undefined;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    })
  }

  onCancelClicked() {
    this.popupState = 0;
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
        if (this.tabState === 1) {
          return this.loadFavouriteIdeas();
        }
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
