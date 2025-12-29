import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { LoginRequest, LoginResponse, User, AuthState } from '../core/models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = environment.jwtTokenKey;

  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadAuthStateFromStorage();
  }

  private loadAuthStateFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (token && !this.isTokenExpired(token)) {
        try {
          const user = this.decodeToken(token);
          this.authStateSubject.next({
            isAuthenticated: true,
            user,
            token
          });
        } catch (error) {
          console.error('Failed to decode token:', error);
          this.clearAuthState();
        }
      } else {
        this.clearAuthState();
      }
    }
  }

  get token(): string | null {
    return this.authStateSubject.value.token;
  }

  get isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  get currentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, request).pipe(
      tap(response => {
        this.setAuthState({
          isAuthenticated: true,
          user: response.user,
          token: response.access_token
        });
        this.saveTokenToStorage(response.access_token);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearAuthState();
    this.removeTokenFromStorage();
  }

  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.token;
    if (!tokenToCheck) {
      return true;
    }

    try {
      const payload = this.getTokenPayload(tokenToCheck);
      if (!payload || !payload.exp) {
        return true;
      }

      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      return expirationDate <= now;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  private decodeToken(token: string): User {
    const payload = this.getTokenPayload(token);
    return {
      employee_id: payload.sub,
      first_name: payload.first_name || '',
      last_name: payload.last_name || '',
      email: payload.email || '',
      username: payload.username || payload.email || '',
      role_id: payload.role_id || 0,
      role: payload.role || { role_id: 0, role_name: 'employee' }
    };
  }

  private getTokenPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw error;
    }
  }

  private setAuthState(state: AuthState): void {
    this.authStateSubject.next(state);
  }

  private clearAuthState(): void {
    this.authStateSubject.next({
      isAuthenticated: false,
      user: null,
      token: null
    });
  }

  private saveTokenToStorage(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private removeTokenFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  getAuthState(): AuthState {
    return this.authStateSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/forgot-password`, { email }).pipe(
      catchError(error => {
        console.error('Forgot password error:', error);
        return throwError(() => error);
      })
    );
  }
}


