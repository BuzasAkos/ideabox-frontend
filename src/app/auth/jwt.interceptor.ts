import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.getToken();
  
    // Clone the request and add the Authorization header, if the token exists
    const authReq = token
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;
  
    // Pass the cloned request to the next handler (send to backend)
    return next(authReq).pipe(
        catchError((error) => {
          // Check if the error is a 401 Unauthorized
          if (error.status === 401) {
            console.warn('Unauthorized request detected. Attempting re-authentication...');
    
            // Attempt re-authentication
            const userData = authService.queryUserData();
            if (!userData.name) {
              console.error('Authentication failed: could not retrieve user data');
              router.navigateByUrl('/login');
              return throwError(() => error); // Propagate the original error
            }
    
            // Perform re-authentication and retry the request
            return authService.authenticate(userData).pipe(
              switchMap((response) => {
                const newToken = response.token;
    
                // Save the new token and retry the original request
                if (newToken) {
                  const retryReq = req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newToken}`,
                    },
                  });
                  console.log('User authentication is successful');
                  return next(retryReq);
                }
    
                // If no token is returned, propagate the original error
                console.error('Re-authentication failed: no token received');
                router.navigateByUrl('/login');
                return throwError(() => error);
              }),
              catchError((authError) => {
                // Handle errors during re-authentication
                console.error('Authentication process failed:', authError);
                router.navigateByUrl('/login');
                return throwError(() => authError); // Propagate the error
              })
            );
          }
    
          // If the error is not a 401, propagate it as is
          return throwError(() => error);
        })
      );
    };