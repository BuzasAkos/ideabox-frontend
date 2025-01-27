import { Routes } from '@angular/router';
import { IdeaComponent } from './idea/idea.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
    { 
        path: 'ideabox', 
        component: IdeaComponent, 
        pathMatch: 'full', 
        canActivate: [authGuard] 
    },
    { 
        path: '', 
        redirectTo: '/ideabox', 
        pathMatch: 'full' 
    }
];
