import { Component, OnDestroy, OnInit } from '@angular/core';
import { IdeaBackendService } from './services/idea-backend.service';
import { IdeaSignalService } from './services/idea-signal.service';
import { Idea, Comment } from './models/idea.entity';
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
  commentForm!: FormGroup;
  selectedIdea?: Idea;
  selectedComment?: Comment;

  constructor(
    private ideaBackendService: IdeaBackendService,
    protected ideaSignalService: IdeaSignalService,
    private formBuilder: FormBuilder,
  ) {}
  
  ngOnInit(): void {
    this.initForms()
    this.loadAllIdeas()
  }

  // initializes forms with validators and default values
  initForms() {
    this.newIdeaForm = this.formBuilder.group({
      title: ["", [Validators.required, Validators.minLength(4), Validators.maxLength(40)]],
      description: ["", [Validators.maxLength(200)]],
    });
    this.commentForm = this.formBuilder.group({
      text: ["", [Validators.required, Validators.maxLength(200)]],
    });
  }

  // load full list of ideas
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

  // load list of ideas that the user has voted for
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

  // checks if the current user has voted for this idea
  votedFor(idea: Idea) {
    return !!idea.votes.find(i => i.createdBy === this.ideaSignalService.user());
  }

  // switches to a selected tab (idea list)
  changeTab(index: number) {
    if (index === 0) this.loadAllIdeas();
    if (index === 1) this.loadFavouriteIdeas();
  }

  // handled click on Post new idea button
  onPostClicked() {
    this.newIdeaForm.reset();
    this.newIdeaForm.enable();
    this.popupState = 1;
  }

  // saves a new idea in the database
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

  // handles click on edit icon for an idea
  onEditClicked(idea: Idea) {
    this.newIdeaForm.reset();
    this.newIdeaForm.patchValue({
      title: idea.title,
      description: idea.description
    });
    this.selectedIdea = idea;
    this.newIdeaForm.get('title')?.disable();
    this.popupState = 2;
  }

  // saves the updated idea in the database
  onSaveEditedIdea() {
    if (this.newIdeaForm.invalid || !this.selectedIdea) return;
    this.popupState = 0;
    this.isLoading = true;
    const idea: UpdateIdeaDto = {
      description: this.newIdeaForm.value.description,
    }
    this.ideaBackendService.updateIdea(this.selectedIdea._id, idea).subscribe({
      next: (response) => {
        this.selectedIdea = undefined;
        if (this.tabState === 0) this.loadAllIdeas();
        if (this.tabState === 1) this.loadFavouriteIdeas();
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    })
  }

  // handles click on remove icon for an idea
  onRemoveClicked(idea: Idea) {
    this.selectedIdea = idea;
    this.popupState = 3;
  }

  // removes an idea from the database
  removeIdea() {
    if (!this.selectedIdea) return;
    this.popupState = 0;
    this.isLoading = true;
    this.ideaBackendService.removeIdea(this.selectedIdea._id).subscribe({
      next: (response) => {
        this.selectedIdea = undefined;
        if (this.tabState === 0) this.loadAllIdeas();
        if (this.tabState === 1) this.loadFavouriteIdeas();
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    })
  }

  // handles click on comments button or on vote/comment counter
  onDetailsClicked(idea: Idea) {
    this.selectedIdea = idea;
    this.commentForm.reset();
    this.popupState = 4;
  }

  // saves a new comment for the selected idea to database
  onSendComment() {
    if (this.commentForm.invalid || !this.selectedIdea) return;
    const text = this.commentForm.value.text;
    this.isLoading = true;
    this.ideaBackendService.addComment(this.selectedIdea._id, { text }).subscribe({
      next: (response) => {
        this.selectedIdea = response;
        this.commentForm.reset();
        if (this.tabState === 0) this.loadAllIdeas();
        if (this.tabState === 1) this.loadFavouriteIdeas();
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    });
  }

  // handles click on remove icon next to a comment for an idea
  onRemoveCommentClicked(comment: Comment) {
    console.log(comment);
    this.selectedComment = comment;
    this.popupState = 5;
  }

  // removes a comment from the database
  removeComment() {
    if (!this.selectedComment || !this.selectedIdea) return;
    this.isLoading = true;
    this.ideaBackendService.removeComment(this.selectedIdea._id, this.selectedComment.id).subscribe({
      next: (response) => {
        this.selectedComment = undefined;
        this.selectedIdea = undefined;
        this.popupState = 0;
        if (this.tabState === 0) this.loadAllIdeas();
        if (this.tabState === 1) this.loadFavouriteIdeas();
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }
    })
  }

  // handles cancel button in a popup: closes the window
  onCancelClicked() {
    this.popupState = 0;
  }

  // handles keep button in a popup: returns to the details window
  onKeepClicked() {
    this.selectedComment = undefined;
    this.popupState = 4;
  }

  // submits a vote for an idea and saves to the database
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

  // removes the vote of the user from a specific idea
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
