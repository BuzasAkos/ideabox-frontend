import { Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { IdeaBackendService } from './services/idea-backend.service';
import { IdeaSignalService } from './services/idea-signal.service';
import { Idea, Comment } from './models/idea.entity';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateIdeaDto } from './models/create-idea.dto';
import { UpdateIdeaDto } from './models/update-idea.dto';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

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
  selectedIdea?: Idea;
  selectedComment?: Comment;
  selectedItems: string[] = [];
  
  isLoading = signal<boolean>(false);
  popupState = signal<number>(0);
  tabState = signal<number>(0);
  errorMessage = signal<string | undefined>(undefined);

  @ViewChild('statusDropdown') statusDropdown?: ElementRef;

  constructor(
    private ideaBackendService: IdeaBackendService,
    protected ideaSignalService: IdeaSignalService,
    protected authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
  ) {}
  
  ngOnInit(): void {
    this.initForms();
    this.loadList();
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

  // refreshes the list of ideas depending on the active tab
  loadList() {
    if (this.tabState() === 0) this.loadAllIdeas();
    if (this.tabState() === 1) this.loadFavouriteIdeas();
  }

  // load full list of ideas
  loadAllIdeas() {
    this.tabState.set(0);
    this.isLoading.set(true);
    this.ideaBackendService.getAllIdeas().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        console.log(err);
        this.displayError(err.error.message);
        this.isLoading.set(false);
      }
    });
  }

  // load list of ideas that the user has voted for
  loadFavouriteIdeas() {
    this.tabState.set(1);
    this.isLoading.set(true);
    this.ideaBackendService.getFavouriteIdeas().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        console.log(err);
        this.displayError(err.error.message);
        this.isLoading.set(false);
      }
    });
  }

  // switches to a selected tab (idea list)
  changeTab(index: number) {
    this.tabState.set(index);
    this.loadList();
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
    this.ideaBackendService.createIdea(idea).subscribe({
      next: () => {
        this.loadList();
      },
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
    this.selectedIdea = idea;
    this.newIdeaForm.get('title')?.disable();
    this.popupState.set(2);
  }

  // saves the updated idea in the database
  onSaveEditedIdea() {
    if (this.newIdeaForm.invalid || !this.selectedIdea) return;
    this.popupState.set(0);
    this.isLoading.set(true);
    const idea: UpdateIdeaDto = {
      description: this.newIdeaForm.value.description,
    }
    this.ideaBackendService.updateIdea(this.selectedIdea._id, idea).subscribe({
      next: () => {
        this.selectedIdea = undefined;
        this.loadList();
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
    this.selectedIdea = idea;
    this.popupState.set(3);
  }

  // removes an idea from the database
  removeIdea() {
    if (!this.selectedIdea) return;
    this.popupState.set(0);
    this.isLoading.set(true);
    this.ideaBackendService.removeIdea(this.selectedIdea._id).subscribe({
      next: () => {
        this.selectedIdea = undefined;
        this.loadList();
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
    this.ideaBackendService.getIdea(ideaId).subscribe({
      next: (response) => {
        const idea = response;
        idea.comments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.selectedIdea = idea;
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
    if (this.commentForm.invalid || !this.selectedIdea) return;
    const text = this.commentForm.value.text;
    this.isLoading.set(true);
    this.ideaBackendService.addComment(this.selectedIdea._id, { text }).subscribe({
      next: (response) => {
        response.comments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.selectedIdea = response;
        this.commentForm.reset();
        this.loadList();
        this.isLoading.set(false);
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
    this.selectedComment = comment;
    this.popupState.set(5);
  }

  // removes a comment from the database
  removeComment() {
    if (!this.selectedComment || !this.selectedIdea) return;
    this.isLoading.set(true);
    this.ideaBackendService.removeComment(this.selectedIdea._id, this.selectedComment.id).subscribe({
      next: (response) => {
        const index = this.selectedIdea!.comments.findIndex(i => i.id === this.selectedComment!.id);
        this.selectedIdea?.comments.splice(index, 1);
        this.selectedComment = undefined;
        this.popupState.set(4);
        this.loadList();
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
    this.selectedComment = undefined;
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
    this.ideaBackendService.statusUpdate(this.selectedItems, status).subscribe({
      next: () => {
        this.selectedItems = []
        this.popupState.set(0);
        this.loadList();
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
    this.ideaBackendService.addVote(ideaId).subscribe({
      next: () => {
        this.loadList()
      },
      error: (err) => {
        console.log(err);
        this.displayError(err.error.message);
      }
    })
  }

  // removes the vote of the user from a specific idea
  unvote(ideaId: string) {
    this.ideaBackendService.removeVote(ideaId).subscribe({
      next: () => {
        this.loadList();
      },
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
