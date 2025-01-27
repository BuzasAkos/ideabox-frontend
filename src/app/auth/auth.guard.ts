import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // If no token or invalid token, authenticate the user
  if (!token || !authService.isTokenValid(token)) {
    console.log('Token invalid or expired. Re-authenticating...');
    const userData = authService.queryUserData()
    if (!userData.name) {
        console.error('Authentication failed: could not retrieve user data');
        return false;
    }
    authService.authenticate(userData).subscribe({
        next: () => {
            console.log('User authentication is successful');
            return true;
        },
        error: (err) => {
            console.error('Authentication failed:', err.error.message);
            return false;
        }
    });
  }

  // If token is valid
  return true;
};