import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  styleUrls: ['../../shared/styles/dashboard.scss'],
  template: `
    <div class="dash-container">
      <header class="dash-head">
        <div>
          <h1 class="dash-title">{{ 'account.title' | transloco }}</h1>
          <p class="dash-sub">{{ 'account.subtitle' | transloco }}</p>
        </div>
      </header>

      @if (toast()) { <div class="toast">{{ toast() }}</div> }

      @if (user() && !user()!.emailVerified) {
        <div class="verify-banner" role="status">
          <span class="ms">mark_email_unread</span>
          <div class="verify-banner-text">
            <strong>{{ 'authRecovery.bannerTitle' | transloco }}</strong>
            <span>{{ 'authRecovery.bannerBody' | transloco }}</span>
          </div>
          <button type="button" class="verify-banner-btn" (click)="resendVerification()" [disabled]="resending()">
            {{ (resending() ? 'authRecovery.resending' : 'authRecovery.resend') | transloco }}
          </button>
        </div>
      }

      <div class="account-grid">
        <!-- Identity card -->
        <section class="card pad">
          <div class="identity">
            <span class="identity-avatar">{{ initials() }}</span>
            <div>
              <h2 class="identity-name">{{ fullName() }}</h2>
              <span class="identity-email">{{ user()?.email }}</span>
            </div>
            <span class="role-badge" [class.admin]="isAdmin()">
              <span class="ms">{{ isAdmin() ? 'shield_person' : 'verified_user' }}</span>
              {{ user()?.role || 'TRAVELER' }}
            </span>
          </div>

          <form class="form" (ngSubmit)="save()">
            <div class="field-row">
              <label class="field">
                <span>{{ 'auth.firstName' | transloco }}</span>
                <input [(ngModel)]="firstName" name="firstName" required maxlength="100" />
              </label>
              <label class="field">
                <span>{{ 'auth.lastName' | transloco }}</span>
                <input [(ngModel)]="lastName" name="lastName" required maxlength="100" />
              </label>
            </div>
            <label class="field">
              <span>{{ 'account.phone' | transloco }}</span>
              <input [(ngModel)]="phone" name="phone" maxlength="30" [placeholder]="'account.phonePlaceholder' | transloco" />
            </label>
            <label class="field">
              <span>{{ 'auth.email' | transloco }} <small>{{ 'account.readonly' | transloco }}</small></span>
              <input [value]="user()?.email" disabled />
            </label>
            <div class="form-actions">
              <button type="button" class="dash-cta dash-cta--ghost" (click)="reset()" [disabled]="!dirty()">{{ 'account.reset' | transloco }}</button>
              <button type="submit" class="dash-cta" [disabled]="!dirty() || saving()">
                {{ (saving() ? 'account.saving' : 'account.save') | transloco }}
              </button>
            </div>
          </form>
        </section>

        <!-- Side rail -->
        <aside class="side">
          <section class="card pad">
            <h3 class="side-h">{{ 'account.quickLinks' | transloco }}</h3>
            <button class="side-link" (click)="go('/profile')"><span class="ms">person</span> {{ 'account.publicProfile' | transloco }}</button>
            <button class="side-link" (click)="go('/trips')"><span class="ms">luggage</span> {{ 'userMenu.myTrips' | transloco }}</button>
            <button class="side-link" (click)="go('/bookings')"><span class="ms">confirmation_number</span> {{ 'userMenu.bookings' | transloco }}</button>
            <button class="side-link" (click)="go('/messages')"><span class="ms">chat_bubble_outline</span> {{ 'userMenu.messages' | transloco }}</button>
            @if (isAdmin()) {
              <button class="side-link admin" (click)="go('/admin')"><span class="ms">admin_panel_settings</span> {{ 'userMenu.adminPanel' | transloco }}</button>
            }
          </section>

          <section class="card pad">
            <h3 class="side-h">{{ 'account.status' | transloco }}</h3>
            <div class="status-line"><span class="ms" [class.ok]="user()?.emailVerified">{{ user()?.emailVerified ? 'check_circle' : 'pending' }}</span> {{ (user()?.emailVerified ? 'account.emailVerified' : 'account.emailUnverified') | transloco }}</div>
            <div class="status-line"><span class="ms ok">lock</span> {{ 'account.passwordProtected' | transloco }}</div>
          </section>

          <button class="danger" (click)="signOut()"><span class="ms">logout</span> {{ 'userMenu.signOut' | transloco }}</button>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .account-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.25rem; align-items: start; }
    .pad { padding: 1.6rem; }
    .identity { display: flex; align-items: center; gap: 1rem; padding-bottom: 1.4rem; margin-bottom: 1.4rem; border-bottom: 1px solid var(--line); }
    .identity-avatar { width: 60px; height: 60px; flex: none; border-radius: 50%; background: linear-gradient(135deg, #E04A2F, #ff7a5a); color: #fff; font-weight: 800; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; }
    .identity-name { margin: 0; font-size: 1.3rem; font-weight: 800; }
    .identity-email { color: var(--muted); font-size: 0.9rem; }
    .role-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; background: #eef0ff; color: #3a4ad0; font-weight: 800; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 11px; border-radius: 999px; }
    .role-badge .ms { font-size: 15px; }
    .role-badge.admin { background: #ffe9e4; color: var(--accent); }
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field span { font-size: 0.82rem; font-weight: 700; color: #555; }
    .field small { color: var(--muted); font-weight: 500; }
    .field input { border: 1px solid var(--line); border-radius: 10px; padding: 0.65rem 0.85rem; font-family: inherit; font-size: 0.95rem; outline: none; transition: border-color 120ms ease; }
    .field input:focus { border-color: var(--accent); }
    .field input:disabled { background: #f6f6f4; color: var(--muted); }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.7rem; margin-top: 0.5rem; }
    .side { display: flex; flex-direction: column; gap: 1.25rem; }
    .side-h { margin: 0 0 0.9rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
    .side-link { display: flex; align-items: center; gap: 10px; width: 100%; background: none; border: none; padding: 0.65rem 0; font-family: inherit; font-size: 0.95rem; font-weight: 600; color: var(--ink); cursor: pointer; border-radius: 8px; transition: color 120ms ease; }
    .side-link:hover { color: var(--accent); }
    .side-link .ms { font-size: 19px; color: var(--muted); }
    .side-link:hover .ms { color: var(--accent); }
    .side-link.admin { color: var(--accent); font-weight: 800; }
    .status-line { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; padding: 0.3rem 0; color: #444; }
    .status-line .ms { font-size: 18px; color: var(--muted); }
    .status-line .ms.ok { color: #1a7f43; }
    .danger { display: flex; align-items: center; justify-content: center; gap: 8px; background: #fff; border: 1px solid var(--line); color: var(--accent); border-radius: 12px; padding: 0.85rem; font-family: inherit; font-weight: 700; cursor: pointer; transition: background 120ms ease; }
    .danger:hover { background: var(--accent-soft); }
    .toast { background: var(--ink); color: #fff; padding: 0.7rem 1.1rem; border-radius: 12px; margin-bottom: 1.2rem; font-weight: 600; font-size: 0.9rem; }
    .verify-banner { display: flex; align-items: center; gap: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 0.8rem 1.1rem; margin-bottom: 1.2rem; }
    .verify-banner .ms { color: #c2620a; font-size: 22px; flex: none; }
    .verify-banner-text { display: flex; flex-direction: column; gap: 2px; font-size: 0.88rem; color: #7c4a10; }
    .verify-banner-text strong { font-size: 0.92rem; color: #6b3c07; }
    .verify-banner-btn { margin-left: auto; flex: none; background: #c2620a; color: #fff; border: none; border-radius: 999px; padding: 0.5rem 1rem; font-family: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 120ms ease; }
    .verify-banner-btn:hover:not(:disabled) { background: #a5520a; }
    .verify-banner-btn:disabled { opacity: 0.7; cursor: default; }
    @media (max-width: 560px) { .verify-banner { flex-wrap: wrap; } .verify-banner-btn { margin-left: 0; } }
    @media (max-width: 820px) { .account-grid { grid-template-columns: 1fr; } .field-row { grid-template-columns: 1fr; } }
  `],
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly user = this.auth.currentUser;
  readonly saving = signal(false);
  readonly resending = signal(false);
  readonly toast = signal('');

  firstName = this.user()?.firstName ?? '';
  lastName = this.user()?.lastName ?? '';
  phone = this.user()?.phone ?? '';

  readonly fullName = computed(() => `${this.user()?.firstName ?? ''} ${this.user()?.lastName ?? ''}`.trim() || this.transloco.translate('account.travelerFallback'));
  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || u.email[0].toUpperCase();
  });
  isAdmin(): boolean { return this.auth.isAdmin(); }

  dirty(): boolean {
    const u = this.user();
    return !!u && (this.firstName !== u.firstName || this.lastName !== u.lastName || (this.phone || '') !== (u.phone || ''));
  }

  save(): void {
    if (!this.dirty()) return;
    this.saving.set(true);
    this.auth.updateProfile({ firstName: this.firstName.trim(), lastName: this.lastName.trim(), phone: this.phone?.trim() || undefined })
      .pipe(catchError(() => of(null)))
      .subscribe(updated => {
        this.saving.set(false);
        this.flash(this.transloco.translate(updated ? 'account.profileUpdated' : 'account.saveError'));
      });
  }

  reset(): void {
    const u = this.user();
    this.firstName = u?.firstName ?? '';
    this.lastName = u?.lastName ?? '';
    this.phone = u?.phone ?? '';
  }

  resendVerification(): void {
    if (this.resending()) return;
    this.resending.set(true);
    this.auth.resendVerification().subscribe({
      next: () => {
        this.resending.set(false);
        this.flash(this.transloco.translate('authRecovery.resendDone'));
      },
      error: () => {
        this.resending.set(false);
        this.flash(this.transloco.translate('authRecovery.resendErr'));
      },
    });
  }

  go(route: string): void { this.router.navigate([route]); }

  signOut(): void {
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/']) });
  }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
