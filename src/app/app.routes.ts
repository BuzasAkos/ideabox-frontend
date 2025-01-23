import { Routes } from '@angular/router';
import { IdeaComponent } from './idea/idea.component';

export const routes: Routes = [
    { path: 'ideabox', component: IdeaComponent, pathMatch: 'full' },
    { path: '', redirectTo: '/ideabox', pathMatch: 'full' }
];
