import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, AuthResponse, LoginRequest, RegisterRequest } from '../models/api.models';

const TOKEN_KEY = 'ai_access_token';
const REFRESH_KEY = 'ai_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  isAuthenticated = signal(!!localStorage.getItem(TOKEN_KEY));

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiWrapper<AuthResponse>>(`${environment.apiUrl}/auth/login`, req).pipe(
      map(res => res.data),
      tap(auth => this.storeTokens(auth))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiWrapper<AuthResponse>>(`${environment.apiUrl}/auth/register`, req).pipe(
      map(res => res.data),
      tap(auth => this.storeTokens(auth))
    );
  }

  logout(): Observable<void> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    return this.http.post<ApiWrapper<void>>(`${environment.apiUrl}/auth/logout`, { refreshToken }).pipe(
      tap(() => this.clearTokens()),
      catchError(() => { this.clearTokens(); return of(undefined as void); }),
      map(() => undefined as void)
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  clearAuth(): void {
    this.clearTokens();
  }

  private storeTokens(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_KEY, auth.refreshToken);
    this.isAuthenticated.set(true);
  }

  private clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.isAuthenticated.set(false);
  }
}
