import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private jwt = signal<string | null>(null);
  public user = signal<string | null>(this.queryUserData().name);

  baseUrl: string = `${environment.backend_url}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  // Signal to get the token in-memory
  getJwt() {
    return this.jwt;
  }

  // Authenticate user (send userData to backend, receive jwt token) and store token
  authenticate(userData: {name: string}) {
    const url = `${this.baseUrl}/login`
    return this.http.post<{ token: string }>(`${this.baseUrl}/login`, userData)
    .pipe(
      tap(response => {
        const token = response.token;
        localStorage.setItem('ideaBox_token', token);
        this.jwt.set(token);
        this.setUserFromToken(token);
      })
    );
  }

  // retrieve user data from locasStorage (mocking keyCloak query)
  queryUserData() {
    const name = localStorage.getItem('ideaBox_user') || '';
    return { name }
  }

  // Get the token from memory or localStorage
  getToken(): string | null {
    const token = this.jwt();
    if (token) return token;

    const storedToken = localStorage.getItem('ideaBox_token');
    if (storedToken) {
      this.jwt.set(storedToken);
      this.setUserFromToken(storedToken);
      return storedToken;
    }
    return null;
  }

  // Check if the token is valid
  isTokenValid(token: string): boolean {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      return Date.now() < decoded.exp * 1000; // Check expiration
    } catch (error) {
      console.error('Invalid token', error);
      return false;
    }
  }

  // logs out user
  logout() {
    this.jwt.set(null);
    this.user.set(null);
    localStorage.removeItem('ideaBox_token');
  }

  // Decode JWT and set user signal
  setUserFromToken(token: string | null): void {
    if (!token) {
      this.user.set(null);
      return;
    }

    try {
      const decoded: { name: string } = jwtDecode(token);
      this.user.set(decoded.name); 
    } catch (error) {
      console.error('Failed to decode token', error);
      this.user.set(null); 
    }
  }

}

