import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

type Mode = 'login' | 'register';

/** Minimal shape of the Google Identity Services credential callback response. */
interface GoogleCredentialResponse {
  credential: string;
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  template: `
    <div class="auth-overlay" (click)="onClose()" role="dialog" aria-modal="true" aria-label="Account">
      <div class="auth-card" (click)="$event.stopPropagation()">
        <button class="auth-close" (click)="onClose()" aria-label="Close" type="button">
          <span class="ms">close</span>
        </button>

        <div class="auth-brand">
          <span class="auth-logo">Travel<span class="auth-logo-accent">AI</span></span>
        </div>

        <h2 class="auth-title">{{ (mode() === 'login' ? 'auth.welcomeBack' : 'auth.createAccount') | transloco }}</h2>
        <p class="auth-sub">
          {{ (mode() === 'login' ? 'auth.subLogin' : 'auth.subRegister') | transloco }}
        </p>

        <form class="auth-form" (ngSubmit)="submit()">
          @if (mode() === 'register') {
            <div class="auth-row">
              <div class="auth-field">
                <label class="auth-label" for="auth-first">{{ 'auth.firstName' | transloco }}</label>
                <input id="auth-first" class="auth-input" type="text" name="firstName"
                       [(ngModel)]="firstName" autocomplete="given-name" required>
              </div>
              <div class="auth-field">
                <label class="auth-label" for="auth-last">{{ 'auth.lastName' | transloco }}</label>
                <input id="auth-last" class="auth-input" type="text" name="lastName"
                       [(ngModel)]="lastName" autocomplete="family-name" required>
              </div>
            </div>
          }

          <div class="auth-field">
            <label class="auth-label" for="auth-email">{{ 'auth.email' | transloco }}</label>
            <input id="auth-email" class="auth-input" type="email" name="email"
                   [(ngModel)]="email" autocomplete="email" placeholder="you@example.com" required>
          </div>

          <div class="auth-field">
            <label class="auth-label" for="auth-pass">{{ 'auth.password' | transloco }}</label>
            <input id="auth-pass" class="auth-input" type="password" name="password"
                   [(ngModel)]="password" [attr.autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
                   placeholder="••••••••" required>
          </div>

          @if (mode() === 'login') {
            <div class="auth-forgot">
              <button type="button" class="auth-link" (click)="goForgotPassword()">
                {{ 'authRecovery.forgotLink' | transloco }}
              </button>
            </div>
          }

          @if (error()) {
            <div class="auth-error" role="alert">
              <span class="ms" style="font-size:16px">error</span>
              {{ error() }}
            </div>
          }

          <button class="auth-submit" type="submit" [disabled]="loading()">
            @if (loading()) {
              <span class="auth-spinner"></span>
            } @else {
              {{ (mode() === 'login' ? 'auth.signIn' : 'auth.create') | transloco }}
            }
          </button>
        </form>

        @if (googleEnabled) {
          <div class="auth-divider" role="separator">
            <span>{{ 'socialAuth.orDivider' | transloco }}</span>
          </div>

          <button type="button" class="auth-social" (click)="signInWithGoogle()" [disabled]="loading()">
            <svg class="auth-social-icon" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"/>
            </svg>
            {{ 'socialAuth.continueWithGoogle' | transloco }}
          </button>
        }

        <p class="auth-switch">
          @if (mode() === 'login') {
            {{ 'auth.noAccount' | transloco }}
            <button type="button" class="auth-link" (click)="setMode('register')">{{ 'auth.signUp' | transloco }}</button>
          } @else {
            {{ 'auth.haveAccount' | transloco }}
            <button type="button" class="auth-link" (click)="setMode('login')">{{ 'auth.signIn' | transloco }}</button>
          }
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --brand: #E04A2F;
      --brand-hover: #c93d25;
      --text-primary: #1a1a1a;
      --text-secondary: #545454;
      --border: #e0e0e0;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
    }

    .auth-overlay {
      position: fixed;
      inset: 0;
      z-index: 3000;
      background: rgba(15, 18, 22, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: authFade 160ms ease;
    }

    @keyframes authFade { from { opacity: 0; } to { opacity: 1; } }

    .auth-card {
      position: relative;
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 18px;
      padding: 34px 32px 28px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
      animation: authPop 220ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes authPop {
      from { opacity: 0; transform: scale(0.96) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .auth-close {
      position: absolute;
      top: 16px; right: 16px;
      width: 34px; height: 34px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: #fff;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 150ms ease;
    }
    .auth-close:hover { background: #f5f5f5; color: var(--text-primary); }

    .auth-brand { margin-bottom: 14px; }
    .auth-logo { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); }
    .auth-logo-accent { color: var(--brand); }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin: 0 0 6px;
    }

    .auth-sub {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0 0 22px;
    }

    .auth-form { display: flex; flex-direction: column; gap: 14px; }

    .auth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .auth-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

    .auth-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .auth-input {
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      font-size: 0.95rem;
      color: var(--text-primary);
      background: #f7f7f7;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      padding: 11px 13px;
      outline: none;
      transition: border-color 150ms ease, background 150ms ease;
    }
    .auth-input:focus { border-color: var(--brand); background: #fff; }

    .auth-error {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #c0392b;
      background: #fdecea;
      border: 1px solid #f5c6cb;
      border-radius: 10px;
      padding: 9px 12px;
    }

    .auth-submit {
      margin-top: 4px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      background: var(--brand);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
    }
    .auth-submit:hover:not(:disabled) {
      background: var(--brand-hover);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(224, 74, 47, 0.35);
    }
    .auth-submit:disabled { opacity: 0.7; cursor: default; }

    .auth-spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: authSpin 0.7s linear infinite;
    }
    @keyframes authSpin { to { transform: rotate(360deg); } }

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 18px 0 14px;
      color: var(--text-secondary);
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    .auth-social {
      width: 100%;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      cursor: pointer;
      transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
    }
    .auth-social:hover:not(:disabled) {
      background: #f7f7f7;
      border-color: #cfcfcf;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    }
    .auth-social:disabled { opacity: 0.7; cursor: default; }
    .auth-social-icon { width: 18px; height: 18px; flex-shrink: 0; }

    .auth-switch {
      text-align: center;
      font-size: 0.88rem;
      color: var(--text-secondary);
      margin: 18px 0 0;
    }

    .auth-link {
      background: none;
      border: none;
      color: var(--brand);
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      padding: 2px 4px;
    }
    .auth-link:hover { text-decoration: underline; }

    .auth-forgot { display: flex; justify-content: flex-end; margin-top: -6px; }
    .auth-forgot .auth-link { font-size: 0.82rem; font-weight: 600; }

    @media (max-width: 420px) {
      .auth-row { grid-template-columns: 1fr; }
    }
  `],
})
export class AuthModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<void>();

  private readonly authService = inject(AuthService);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);

  readonly mode = signal<Mode>('login');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** True only when a Google client id is configured — otherwise the button is hidden. */
  readonly googleEnabled = !!environment.googleClientId;

  private gisReady = false;

  firstName = '';
  lastName = '';
  email = '';
  password = '';

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  onClose(): void {
    if (this.loading()) return;
    this.close.emit();
  }

  goForgotPassword(): void {
    this.close.emit();
    this.router.navigate(['/forgot-password']);
  }

  submit(): void {
    const email = this.email.trim();
    if (!email || !this.password) {
      this.error.set(this.transloco.translate('auth.errRequired'));
      return;
    }
    if (this.mode() === 'register' && (!this.firstName.trim() || !this.lastName.trim())) {
      this.error.set(this.transloco.translate('auth.errName'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const request$ = this.mode() === 'login'
      ? this.authService.login({ email, password: this.password })
      : this.authService.register({
          email,
          password: this.password,
          firstName: this.firstName.trim(),
          lastName: this.lastName.trim(),
        });

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.authenticated.emit();
        this.close.emit();
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  /** Loads Google Identity Services on demand and triggers the credential prompt. */
  async signInWithGoogle(): Promise<void> {
    if (!this.googleEnabled || this.loading()) return;
    this.error.set(null);
    try {
      await this.ensureGis();
      const google = (window as unknown as { google?: any }).google;
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (resp: GoogleCredentialResponse) => this.onGoogleCredential(resp),
      });
      google.accounts.id.prompt();
    } catch {
      this.error.set(this.transloco.translate('socialAuth.socialError'));
    }
  }

  private onGoogleCredential(resp: GoogleCredentialResponse): void {
    if (!resp?.credential) {
      this.error.set(this.transloco.translate('socialAuth.socialError'));
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.authService.loginWithGoogle(resp.credential).subscribe({
      next: () => {
        this.loading.set(false);
        this.authenticated.emit();
        this.close.emit();
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.transloco.translate('socialAuth.socialError'));
      },
    });
  }

  /** Injects the GIS script once; resolves when the global is available. */
  private ensureGis(): Promise<void> {
    if (this.gisReady && (window as unknown as { google?: unknown }).google) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
      if (existing) {
        if ((window as unknown as { google?: unknown }).google) {
          this.gisReady = true;
          resolve();
        } else {
          existing.addEventListener('load', () => { this.gisReady = true; resolve(); });
          existing.addEventListener('error', () => reject(new Error('GIS load failed')));
        }
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => { this.gisReady = true; resolve(); };
      script.onerror = () => reject(new Error('GIS load failed'));
      document.head.appendChild(script);
    });
  }

  private messageFor(err: unknown): string {
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 400) {
      return this.transloco.translate(this.mode() === 'login' ? 'auth.errLogin' : 'auth.errRegister');
    }
    if (status === 409) {
      return this.transloco.translate('auth.errExists');
    }
    return this.transloco.translate('auth.errGeneric');
  }
}
