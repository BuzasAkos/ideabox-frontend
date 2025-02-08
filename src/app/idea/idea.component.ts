import { Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { IdeaHttpService } from './services/idea-http.service';
import { IdeaSignalService } from './services/idea-signal.service';
import { Idea, Comment } from './models/idea.entity';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateIdeaDto } from './models/create-idea.dto';
import { UpdateIdeaDto } from './models/update-idea.dto';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { finalize, Observable, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-idea',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss'
})
export class IdeaComponent implements OnInit, OnDestroy {

  tabs: string[] = [
    'All Ideas',
    'Favourite Ideas'
  ]
  statusChoice: string[] = [
    'new',
    'shortlist',
    'selected',
    'rejected'
  ]
  newIdeaForm!: FormGroup;
  commentForm!: FormGroup;
  
  selectedItems: string[] = [];
  
  selectedIdea = signal<Idea | undefined>(undefined);
  selectedComment = signal<Comment | undefined>(undefined);
  isLoading = signal<boolean>(false);
  popupState = signal<number>(0);
  tabState = signal<number>(0);
  errorMessage = signal<string | undefined>(undefined);

  @ViewChild('statusDropdown') statusDropdown?: ElementRef;

  constructor(
    private ideaHttpService: IdeaHttpService,
    protected ideaSignalService: IdeaSignalService,
    protected authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
  ) {}
  
  ngOnInit(): void {
    this.initForms();
    this.loadIdeas();
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

  // load list of ideas on initialization
  loadIdeas() {
    this.isLoading.set(true);
    this.getIdeasQuery().subscribe({
      next: () => { },
      error: (err) => {
        console.log(err);
        this.displayError(err.error.message);
      }
    });
  }

  // returns the appropriate http request for list of ideas depending on the active tab
  getIdeasQuery(): Observable<{ideas: Idea[]}> {
    if (this.tabState() === 1) {
      return this.ideaHttpService.getFavouriteIdeas().pipe(
        tap((response) => this.ideaSignalService.ideas.set(response.ideas)),
        finalize(() => this.isLoading.set(false))
    )} else {
      return this.ideaHttpService.getAllIdeas().pipe(
        tap((response) => this.ideaSignalService.ideas.set(response.ideas)),
        finalize(() => this.isLoading.set(false))
      );
    }
  }

  // switches to a selected tab (idea list) and initiates reload
  changeTab(index: number) {
    this.tabState.set(index);
    this.loadIdeas();
  }

  // handled click on Post new idea button
  onPostClicked() {
    this.newIdeaForm.reset();
    this.newIdeaForm.enable();
    this.popupState.set(1);
  }

  // saves a new idea in the database
  onSaveNewIdea() {
    if (this.newIdeaForm.invalid) return;
    this.popupState.set(0);
    this.isLoading.set(true);
    const idea: CreateIdeaDto = {
      title: this.newIdeaForm.value.title,
      description: this.newIdeaForm.value.description,
    }
    this.ideaHttpService.createIdea(idea)
    .pipe(
      switchMap(() => this.getIdeasQuery())
    )
    .subscribe({
      next: () => { },
      error: (err) => {
        console.log(err);
        this.isLoading.set(false);
        this.displayError(err.error.message);
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
    this.selectedIdea.set(idea);
    this.newIdeaForm.get('title')?.disable();
    this.popupState.set(2);
  }

  // saves the updated idea in the database
  onSaveEditedIdea() {
    if (this.newIdeaForm.invalid || !this.selectedIdea()) return;
    this.popupState.set(0);
    this.isLoading.set(true);
    const idea: UpdateIdeaDto = {
      description: this.newIdeaForm.value.description,
    }
    this.ideaHttpService.updateIdea(this.selectedIdea()!._id, idea)
    .pipe(
      switchMap(() => this.getIdeasQuery())
    )
    .subscribe({
      next: () => {
        this.selectedIdea.set(undefined);
      },
      error: (err) => {
        console.log(err);
        this.isLoading.set(false);
        this.displayError(err.error.message);
      }
    })
  }

  // handles click on remove icon for an idea
  onRemoveClicked(idea: Idea) {
    this.selectedIdea.set(idea);
    this.popupState.set(3);
  }

  // removes an idea from the database
  removeIdea() {
    if (!this.selectedIdea()) return;
    this.popupState.set(0);
    this.isLoading.set(true);
    this.ideaHttpService.removeIdea(this.selectedIdea()!._id)
    .pipe(
      switchMap(() => this.getIdeasQuery())
    )
    .subscribe({
      next: () => {
        this.selectedIdea.set(undefined);
      },
      error: (err) => {
        console.log(err);
        this.isLoading.set(false);
        this.displayError(err.error.message);
      }
    })
  }

  // handles click on comments button or on vote/comment counter
  onDetailsClicked(ideaId: string) {
    this.ideaHttpService.getIdea(ideaId)
    .pipe(
      tap((response) => {
        response.comments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.selectedIdea.set(response);
      })
    )
    .subscribe({
      next: () => {
        this.commentForm.reset();
        this.popupState.set(4);
      },
      error: (err) => {
        console.log(err);
        this.displayError(err.error.message);
      }
    })
  }

  // saves a new comment for the selected idea to database
  onSendComment() {
    if (this.commentForm.invalid || !this.selectedIdea()) return;
    const text = this.commentForm.value.text;
    this.isLoading.set(true);
    this.ideaHttpService.addComment(this.selectedIdea()!._id, { text })
    .pipe(
      tap( (response) => {
        response.comments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.selectedIdea.set(response);
      }),
      switchMap(() => this.getIdeasQuery())
    )
    .subscribe({
      next: () => {
        this.commentForm.reset();
      },
      error: (err) => {
        console.log(err);
        this.isLoading.set(false);
        this.displayError(err.error.message);
      }
    });
  }

  // handles click on remove icon next to a comment for an idea
  onRemoveCommentClicked(comment: Comment) {
    console.log(comment);
    this.selectedComment.set(comment);
    this.popupState.set(5);
  }

  // removes a comment from the database
  removeComment() {
    if (!this.selectedComment() || !this.selectedIdea()) return;
    this.isLoading.set(true);
    this.ideaHttpService.removeComment(this.selectedIdea()!._id, this.selectedComment()!.id)
    .pipe(
      tap(() => {
        const index = this.selectedIdea()!.comments.findIndex(i => i.id === this.selectedComment()!.id);
        this.selectedIdea()!.comments.splice(index, 1);
        this.selectedComment.set(undefined);
        
      }),
      switchMap(() => this.getIdeasQuery())
    )
    .subscribe({
      next: () => {
        this.popupState.set(4);
      },
      error: (err) => {
        console.log(err);
        this.isLoading.set(false);
        this.displayError(err.error.message);
      }
    })
  }

  // handles cancel button in a popup: closes the window
  onCancelClicked() {
    this.popupState.set(0);
  }

  // handles keep button in a popup: returns to the details window
  onKeepClicked() {
    this.selectedComment.set(undefined);
    this.popupState.set(4);
  }

  // modifies selectedItems on change of a checkbox state
  onCheckboxChanged(event: Event, id: string) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedItems.push(id);
    } else {
      this.selectedItems = this.selectedItems.filter(i => i !== id);
    }
  }

  // clears all items from the selection
  clearSelection() {
    this.selectedItems = []
  }

  // opens popup to change status for selected items
  onChStatusClicked() {
    this.popupState.set(6);
  }

  // changes status in the database for selected items
  changeStatus() {
    this.isLoading.set(true);
    const status = this.statusDropdown?.nativeElement.value;
    if (!status) return;
    this.ideaHttpService.statusUpdate(this.selectedItems, status)
    .pipe(
      switchMap(() => this.getIdeasQuery())
    )
    .subscribe({
      next: () => {
        this.selectedItems = []
        this.popupState.set(0);
      },
      error: (err) => {
        console.log(err);
        this.isLoading.set(false);
        this.displayError(err.error.message);
      }
    })
  }

  // submits a vote for an idea and saves to the database
  vote(ideaId: string) {
    this.ideaHttpService.addVote(ideaId)
    .pipe(
      switchMap(() => this.getIdeasQuery())
    )
    .subscribe({
      next: () => { },
      error: (err) => {
        console.log(err);
        this.displayError(err.error.message);
      }
    })
  }

  // removes the vote of the user from a specific idea
  unvote(ideaId: string) {
    this.ideaHttpService.removeVote(ideaId)
    .pipe(
      switchMap(() => this.getIdeasQuery())
    )
    .subscribe({
      next: () => { },
      error: (err) => {
        console.log(err);
        this.displayError(err.error.message);
      }
    })
  }

  // displays the error message in a popup
  displayError(msg: string) {
    this.errorMessage.set(msg);
    this.popupState.set(99);
  }

  // navigates to login screen where ideaBox_user is reset
  logoutClicked() {
    this.router.navigateByUrl('login');
  }

  ngOnDestroy(): void {
    
  }

}
