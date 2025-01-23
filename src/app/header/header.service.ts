import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  appTitle = signal<string>('Idea Box');

  constructor() { }
}
