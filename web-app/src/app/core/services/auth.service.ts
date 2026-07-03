import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiWrapper,
  AuthResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  TwoFactorEnableResponse,
  TwoFactorSetupResponse,
  UserProfileResponse,
} from '../models/api.models';

const TOKEN_KEY = 'ai_access_token';
const REFRESH_KEY = 'ai_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  isAuthenticated = signal(!!localStorage.getItem(TOKEN_KEY));
  currentUser = signal<UserProfileResponse | null>(null);

  constructor() {
    // Deferred to a microtask: calling http.get() synchronously here would run
    // authInterceptor's inject(AuthService) while this constructor is still on
    // the call stack, which Angular's injector rejects as a circular dependency
    // (NG0200) — silently swallowed by the error handler below, leaving
    // currentUser permanently null after every fresh page load.
    if (localStorage.getItem(TOKEN_KEY)) {
      queueMicrotask(() => this.fetchProfile().subscribe({ error: () => {} }));
    }
  }

  /**
   * Password login. Resolves to a {@link LoginResponse}: when `mfaRequired` is
   * true, no tokens are stored — the caller must collect a 6-digit code and call
   * {@link verify2fa}. Otherwise tokens are stored and the profile fetched, as before.
   */
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiWrapper<LoginResponse>>(`${environment.apiUrl}/auth/login`, req).pipe(
      map(res => res.data),
      switchMap(res => this.completeLogin(res))
    );
  }

  /** Completes a 2FA login challenge with a TOTP or recovery code. */
  verify2fa(mfaToken: string, code: string): Observable<LoginResponse> {
    return this.http.post<ApiWrapper<LoginResponse>>(`${environment.apiUrl}/auth/2fa/verify`, { mfaToken, code }).pipe(
      map(res => res.data),
      switchMap(res => this.completeLogin(res))
    );
  }

  /** Begins 2FA enrolment: returns the secret + QR (does not enable yet). */
  setup2fa(): Observable<TwoFactorSetupResponse> {
    return this.http.post<ApiWrapper<TwoFactorSetupResponse>>(`${environment.apiUrl}/auth/2fa/setup`, {}).pipe(
      map(res => res.data)
    );
  }

  /** Verifies the first code and enables 2FA, returning one-time recovery codes. */
  enable2fa(code: string): Observable<TwoFactorEnableResponse> {
    return this.http.post<ApiWrapper<TwoFactorEnableResponse>>(`${environment.apiUrl}/auth/2fa/enable`, { code }).pipe(
      map(res => res.data),
      switchMap(res => this.fetchProfile().pipe(map(() => res), catchError(() => of(res))))
    );
  }

  /** Disables 2FA after verifying a TOTP or recovery code. */
  disable2fa(code: string): Observable<void> {
    return this.http.post<ApiWrapper<void>>(`${environment.apiUrl}/auth/2fa/disable`, { code }).pipe(
      switchMap(() => this.fetchProfile().pipe(map(() => undefined as void), catchError(() => of(undefined as void))))
    );
  }

  /**
   * Finalises a login result. When a challenge is pending, returns it untouched
   * so the UI can prompt for a code; otherwise stores tokens and loads the profile.
   */
  private completeLogin(res: LoginResponse): Observable<LoginResponse> {
    if (res.mfaRequired) {
      return of(res);
    }
    this.storeLoginTokens(res);
    return this.fetchProfile().pipe(map(() => res), catchError(() => of(res)));
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

  /** Stores tokens from a completed (non-challenge) login result. */
  private storeLoginTokens(res: LoginResponse): void {
    if (res.accessToken && res.refreshToken) {
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      localStorage.setItem(REFRESH_KEY, res.refreshToken);
      this.isAuthenticated.set(true);
    }
  }

  private clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }
}
