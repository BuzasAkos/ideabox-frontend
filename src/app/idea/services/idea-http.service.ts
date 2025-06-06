import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Idea } from '../models/idea.entity';
import { CreateIdeaDto } from '../models/create-idea.dto';
import { UpdateIdeaDto } from '../models/update-idea.dto';
import { forkJoin, Observable, tap } from 'rxjs';
import { Choice } from '../models/choice.entity';
import { ChatResponseDto } from '../models/chat-response.dto';

@Injectable({
  providedIn: 'root'
})
export class IdeaHttpService {

  baseUrl: string = `${environment.backend_url}/ideabox`;

  constructor(private http: HttpClient) { }

  createIdea( payload: CreateIdeaDto): Observable<Idea> {
    const url = `${this.baseUrl}/idea`;
    return this.http.post<Idea>(url, payload);
  }

  getAllIdeas(searchText?: string): Observable<{ideas: Idea[]}> {
    const url = `${this.baseUrl}/ideas`;
    let params = new HttpParams();
    if (searchText) params = params.set('search', searchText);
    return this.http.get<{ideas: Idea[]}>(url, { params });
  }
  
  getIdea( id: string ): Observable<Idea> {
    const url = `${this.baseUrl}/idea/${id}`;
    return this.http.get<Idea>(url);
  }

  updateIdea( id: string, payload: UpdateIdeaDto ): Observable<Idea>  {
    const url = `${this.baseUrl}/idea/${id}`;
    return this.http.patch<Idea>(url, payload);
  }

  removeIdea( id: string ): Observable<{message: string}> {
    const url = `${this.baseUrl}/idea/${id}`;
    return this.http.delete<{message: string}>(url);
 }

  addVote( id: string ): Observable<Idea> {
    const url = `${this.baseUrl}/idea/${id}/vote`;
    return this.http.patch<Idea>(url, null);
  }

  removeVote( id: string ): Observable<Idea> {
    const url = `${this.baseUrl}/idea/${id}/unvote`;
    return this.http.patch<Idea>(url, null);
  }

  addComment( id: string, payload: {text: string} ): Observable<Idea> {
    const url = `${this.baseUrl}/idea/${id}/comment`;
    return this.http.post<Idea>(url, payload);
  }

  removeComment( id: string, commentId: string ): Observable<{message: string}> {
    const url = `${this.baseUrl}/idea/${id}/comment/${commentId}`;
    return this.http.delete<{message: string}>(url);
  }

  getFavouriteIdeas(searchText?: string): Observable<{ideas: Idea[]}> {
    const url = `${this.baseUrl}/ideas`;
    let params = new HttpParams().set('favourite', true);
    if (searchText) params = params.set('search', searchText);
    return this.http.get<{ideas: Idea[]}>(url, { params });
  }

  statusUpdate(ideaIds: string[], status: string): Observable<{message: string}> {
    const url = `${this.baseUrl}/ideas/status`;
    const payload = { ideaIds, status }
    return this.http.patch<{message: string}>(url, payload);
  }

  getChoices() {
    const url = `${this.baseUrl}/choices`;
    return this.http.get<Choice[]>(url);
  }

  // Feladatok

  getLastComments() {
    const url = `${this.baseUrl}/lastcomments`;
    return this.http.get<{title: string, text: string, createdBy: string, createdAt: Date}[]>(url);
  }

  countVotes(user: string) {
    const url = `${this.baseUrl}/votes/${user}`;
    return this.http.get<{sumVotes: number}>(url);
  }

  getMyComments() {
    const url = `${this.baseUrl}/mycomments`;
    return this.http.get<Idea[]>(url);
  }


  // AI feladat
  createAiChat(type: string, message: string) {
    const url = `${this.baseUrl}/ai/new`;
    const payload = { type, message }
    return this.http.post<ChatResponseDto>(url, payload);
  }


  // test
  joinTest() {
    const url1 = `${this.baseUrl}/ideas`;
    const url2 = `${this.baseUrl}/ideas/favourite`;
    return forkJoin({
      ideas: this.http.get<{ideas: Idea[]}>(url1),
      favourites: this.http.get<{ideas: Idea[]}>(url2)
    })
    .pipe(
      tap((response) => console.log(response))
    )
  }

}
