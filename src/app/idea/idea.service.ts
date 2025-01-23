import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Idea } from './models/idea.entity';
import { CreateIdeaDto } from './models/create-idea.dto';
import { UpdateIdeaDto } from './models/update-idea.dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IdeaService {

  baseUrl: string = `${environment.backend_url}/ideabox`;

  constructor(private http: HttpClient) { }

  createIdea( payload: CreateIdeaDto): Observable<Idea> {
    const url = `${this.baseUrl}/ideabox/idea`;
    return this.http.post<Idea>(url, payload);
  }

  getAllIdeas(): Observable<Idea[]> {
    const url = `${this.baseUrl}/ideabox/ideas`;
    return this.http.get<Idea[]>(url);
  }
  
  getIdea( id: string ): Observable<Idea> {
    const url = `${this.baseUrl}/ideabox/idea/${id}`;
    return this.http.get<Idea>(url);
  }

  updateIdea( id: string, payload: UpdateIdeaDto ): Observable<Idea>  {
    const url = `${this.baseUrl}/ideabox/idea/${id}`;
    return this.http.put<Idea>(url, payload);
  }

  removeIdea( id: string ): Observable<{message: string}> {
    const url = `${this.baseUrl}/ideabox/idea/${id}`;
    return this.http.delete<{message: string}>(url);
 }

}
