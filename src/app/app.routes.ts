import { Routes } from '@angular/router';
import { IdeaComponent } from './idea/idea.component';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    { 
        path: 'ideabox', 
        component: IdeaComponent, 
        pathMatch: 'full', 
        canActivate: [authGuard] 
    },
    { 
        path: 'login', 
        component: LoginComponent, 
        pathMatch: 'full'
    },
    { 
        path: '', 
        redirectTo: '/ideabox', 
        pathMatch: 'full' 
    }
];
