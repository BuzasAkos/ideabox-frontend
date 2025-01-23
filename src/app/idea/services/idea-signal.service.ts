import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IdeaSignalService {

  user = signal<string>('Ákos');

  constructor() { }
}
