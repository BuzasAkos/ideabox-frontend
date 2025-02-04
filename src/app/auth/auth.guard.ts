import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state): Observable<boolean> | boolean => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // If the token is valid, allow access immediately
  if (token && authService.isTokenValid(token)) {
    return true;
  }

  // If the token is missing or invalid, attempt authentication
  console.log('Token invalid or expired. Re-authenticating...');

  const userData = authService.queryUserData(); // Synchronous call
  if (!userData || !userData.name) {
    console.error('Authentication failed: could not retrieve user data');
    return false; // Deny access
  }

  // Authenticate the user (asynchronous)
  return authService.authenticate(userData).pipe(
    map(() => {
      console.log('User authentication successful');
      return true; // Allow access
    }),
    catchError(error => {
      console.error('Authentication failed:', error.error?.message || error);
      return of(false); // Deny access on authentication failure
    })
  );
};