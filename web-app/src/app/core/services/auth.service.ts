import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiWrapper, AuthResponse, LoginRequest, RegisterRequest, UserProfileResponse } from '../models/api.models';

const TOKEN_KEY = 'ai_access_token';
const REFRESH_KEY = 'ai_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  isAuthenticated = signal(!!localStorage.getItem(TOKEN_KEY));
  currentUser = signal<UserProfileResponse | null>(null);

  constructor() {
    if (localStorage.getItem(TOKEN_KEY)) {
      this.fetchProfile().subscribe({ error: () => {} });
    }
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiWrapper<AuthResponse>>(`${environment.apiUrl}/auth/login`, req).pipe(
      map(res => res.data),
      tap(auth => this.storeTokens(auth)),
      switchMap(auth => this.fetchProfile().pipe(map(() => auth), catchError(() => of(auth))))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiWrapper<AuthResponse>>(`${environment.apiUrl}/auth/register`, req).pipe(
      map(res => res.data),
      tap(auth => this.storeTokens(auth)),
      switchMap(auth => this.fetchProfile().pipe(map(() => auth), catchError(() => of(auth))))
    );
  }

  /**
   * Signs in with a Google ID token (from Google Identity Services). Mirrors
   * login(): stores tokens, then fetches the profile so currentUser and the
   * verify-email banner logic populate identically to email/password sign-in.
   */
  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http.post<ApiWrapper<AuthResponse>>(`${environment.apiUrl}/auth/social/google`, { idToken }).pipe(
      map(res => res.data),
      tap(auth => this.storeTokens(auth)),
      switchMap(auth => this.fetchProfile().pipe(map(() => auth), catchError(() => of(auth))))
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

  refreshTokens(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return throwError(() => new Error('No refresh token available'));
    return this.http.post<ApiWrapper<AuthResponse>>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      map(res => res.data),
      tap(auth => this.storeTokens(auth))
    );
  }

  fetchProfile(): Observable<UserProfileResponse> {
    return this.http.get<ApiWrapper<UserProfileResponse>>(`${environment.apiUrl}/users/me`).pipe(
      map(res => res.data),
      tap(profile => this.currentUser.set(profile))
    );
  }

  /** Updates the current user's basic profile and refreshes the cached signal. */
  updateProfile(req: { firstName: string; lastName: string; phone?: string }): Observable<UserProfileResponse> {
    return this.http.put<ApiWrapper<UserProfileResponse>>(`${environment.apiUrl}/users/me`, req).pipe(
      map(res => res.data),
      tap(profile => this.currentUser.set(profile))
    );
  }

  /** Requests a password reset email. Backend always answers 200 (no enumeration). */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<ApiWrapper<void>>(`${environment.apiUrl}/auth/forgot-password`, { email }).pipe(
      map(() => undefined as void)
    );
  }

  /** Sets a new password using a single-use reset token. */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<ApiWrapper<void>>(`${environment.apiUrl}/auth/reset-password`, { token, newPassword }).pipe(
      map(() => undefined as void)
    );
  }

  /** Confirms the email address matching the verification token. */
  verifyEmail(token: string): Observable<void> {
    return this.http.post<ApiWrapper<void>>(`${environment.apiUrl}/auth/verify-email`, { token }).pipe(
      map(() => undefined as void)
    );
  }

  /** Re-sends the verification email for the signed-in user. */
  resendVerification(): Observable<void> {
    return this.http.post<ApiWrapper<void>>(`${environment.apiUrl}/auth/resend-verification`, {}).pipe(
      map(() => undefined as void)
    );
  }

  /** True when the signed-in user has the ADMIN role. */
  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
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
    this.currentUser.set(null);
  }
}
