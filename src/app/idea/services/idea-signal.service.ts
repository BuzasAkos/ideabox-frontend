import { computed, Injectable, signal } from '@angular/core';
import { Idea } from '../models/idea.entity';
import { AuthService } from '../../auth/auth.service';
import { Choice } from '../models/choice.entity';

@Injectable({
  providedIn: 'root'
})
export class IdeaSignalService {

  ideas = signal<Idea[]>([]);
  votedForIds = computed(() => this.ideas()
    .filter(idea => !!idea.votes.find(i => i.createdBy === this.authService.user()))
    .map(idea => idea._id))
  choices = signal<Choice[]>([]);

  constructor(private authService: AuthService) { }
}
