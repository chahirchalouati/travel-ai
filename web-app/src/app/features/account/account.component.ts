import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import type { LoyaltySummaryResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, DatePipe],
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

        <!-- Loyalty card -->
        @if (loyalty(); as l) {
          <section class="card pad loyalty" [attr.data-tier]="l.tier">
            <div class="loyalty-head">
              <div>
                <span class="loyalty-tier">
                  <span class="ms">workspace_premium</span>
                  {{ 'loyalty.tier.' + l.tier | transloco }}
                </span>
                <p class="loyalty-sub">{{ 'loyalty.card.subtitle' | transloco }}</p>
              </div>
              <div class="loyalty-balance">
                <span class="loyalty-points">{{ l.pointsBalance | number }}</span>
                <span class="loyalty-points-label">{{ 'loyalty.card.points' | transloco }}</span>
              </div>
            </div>

            @if (l.nextTier && l.pointsToNextTier !== null) {
              <div class="loyalty-progress">
                <div class="loyalty-progress__labels">
                  <span>{{ 'loyalty.card.progressTo' | transloco: { tier: (('loyalty.tier.' + l.nextTier) | transloco) } }}</span>
                  <span>{{ 'loyalty.card.pointsToGo' | transloco: { points: l.pointsToNextTier } }}</span>
                </div>
                <div class="loyalty-bar"><span class="loyalty-bar__fill" [style.width.%]="progressPct(l)"></span></div>
              </div>
            } @else {
              <p class="loyalty-top">{{ 'loyalty.card.topTier' | transloco }}</p>
            }

            <div class="loyalty-meta">
              <span>{{ 'loyalty.card.lifetime' | transloco: { points: (l.lifetimePoints | number) } }}</span>
              <span>{{ 'loyalty.card.earnRate' | transloco: { rate: l.earnRate } }}</span>
            </div>

            <h3 class="loyalty-h">{{ 'loyalty.card.activity' | transloco }}</h3>
            @if (l.recentTransactions.length > 0) {
              <ul class="loyalty-tx">
                @for (tx of l.recentTransactions; track tx.id) {
                  <li class="loyalty-tx__row">
                    <span class="loyalty-tx__desc">
                      <span class="ms" [class.earn]="tx.points > 0" [class.redeem]="tx.points < 0">
                        {{ tx.points > 0 ? 'add_circle' : 'remove_circle' }}
                      </span>
                      {{ tx.description || ('loyalty.type.' + tx.type | transloco) }}
                      <small>{{ tx.createdAt | date:'dd MMM yyyy' }}</small>
                    </span>
                    <span class="loyalty-tx__pts" [class.earn]="tx.points > 0" [class.redeem]="tx.points < 0">
                      {{ tx.points > 0 ? '+' : '' }}{{ tx.points | number }}
                    </span>
                  </li>
                }
              </ul>
            } @else {
              <p class="loyalty-empty">{{ 'loyalty.card.empty' | transloco }}</p>
            }
          </section>
        }

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
    /* Loyalty card — occupies the main column, below the identity card. */
    .loyalty { grid-column: 1; }
    .loyalty-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding-bottom: 1.1rem; margin-bottom: 1.1rem; border-bottom: 1px solid var(--line); }
    .loyalty-tier { display: inline-flex; align-items: center; gap: 7px; font-weight: 800; font-size: 1.05rem; letter-spacing: 0.01em; padding: 6px 13px; border-radius: 999px; background: linear-gradient(135deg, #1f2733, #3a4656); color: #fff; }
    .loyalty[data-tier="VOYAGER"] .loyalty-tier { background: linear-gradient(135deg, #1d5c8f, #4aa3d6); }
    .loyalty[data-tier="ELITE"] .loyalty-tier { background: linear-gradient(135deg, #9a6a12, #e0b64a); }
    .loyalty-tier .ms { font-size: 19px; }
    .loyalty-sub { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.85rem; }
    .loyalty-balance { text-align: right; flex: none; }
    .loyalty-points { display: block; font-size: 1.9rem; font-weight: 800; line-height: 1; color: var(--ink); }
    .loyalty-points-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700; }
    .loyalty-progress { margin-bottom: 1rem; }
    .loyalty-progress__labels { display: flex; justify-content: space-between; font-size: 0.8rem; color: #555; font-weight: 600; margin-bottom: 6px; }
    .loyalty-bar { height: 8px; border-radius: 999px; background: #ececea; overflow: hidden; }
    .loyalty-bar__fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #E04A2F, #ff7a5a); transition: width 300ms cubic-bezier(0.16,1,0.3,1); }
    .loyalty-top { margin: 0 0 1rem; font-weight: 700; color: #9a6a12; font-size: 0.9rem; }
    .loyalty-meta { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.82rem; color: var(--muted); font-weight: 600; padding-bottom: 1rem; margin-bottom: 0.6rem; border-bottom: 1px solid var(--line); }
    .loyalty-h { margin: 0 0 0.6rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
    .loyalty-tx { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .loyalty-tx__row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.55rem 0; border-bottom: 1px solid #f2f2f0; }
    .loyalty-tx__row:last-child { border-bottom: none; }
    .loyalty-tx__desc { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #333; }
    .loyalty-tx__desc small { color: var(--muted); font-weight: 500; margin-left: 4px; }
    .loyalty-tx__desc .ms { font-size: 18px; }
    .loyalty-tx__pts { font-weight: 800; font-size: 0.95rem; font-variant-numeric: tabular-nums; }
    .ms.earn, .loyalty-tx__pts.earn { color: #1a7f43; }
    .ms.redeem, .loyalty-tx__pts.redeem { color: var(--accent); }
    .loyalty-empty { color: var(--muted); font-size: 0.88rem; margin: 0.3rem 0 0; }
    .verify-banner { display: flex; align-items: center; gap: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 0.8rem 1.1rem; margin-bottom: 1.2rem; }
    .verify-banner .ms { color: #c2620a; font-size: 22px; flex: none; }
    .verify-banner-text { display: flex; flex-direction: column; gap: 2px; font-size: 0.88rem; color: #7c4a10; }
    .verify-banner-text strong { font-size: 0.92rem; color: #6b3c07; }
    .verify-banner-btn { margin-left: auto; flex: none; background: #c2620a; color: #fff; border: none; border-radius: 999px; padding: 0.5rem 1rem; font-family: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 120ms ease; }
    .verify-banner-btn:hover:not(:disabled) { background: #a5520a; }
    .verify-banner-btn:disabled { opacity: 0.7; cursor: default; }
    @media (max-width: 560px) { .verify-banner { flex-wrap: wrap; } .verify-banner-btn { margin-left: 0; } }
    @media (max-width: 820px) { .account-grid { grid-template-columns: 1fr; } .field-row { grid-template-columns: 1fr; } .loyalty { grid-column: auto; } }
  `],
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly loyaltyService = inject(LoyaltyService);

  readonly user = this.auth.currentUser;
  readonly saving = signal(false);
  readonly resending = signal(false);
  readonly toast = signal('');
  readonly loyalty = signal<LoyaltySummaryResponse | null>(null);

  constructor() {
    this.loyaltyService.summary().pipe(catchError(() => of(null))).subscribe(res => this.loyalty.set(res));
  }

  /** Percentage progress from the current tier's floor toward the next tier. */
  protected progressPct(l: LoyaltySummaryResponse): number {
    if (l.nextTier === null || l.pointsToNextTier === null) {
      return 100;
    }
    const nextFloor = l.lifetimePoints + l.pointsToNextTier;
    const currentFloor = nextFloor - this.tierSpan(l);
    const span = nextFloor - currentFloor;
    if (span <= 0) {
      return 0;
    }
    const done = ((l.lifetimePoints - currentFloor) / span) * 100;
    return Math.max(0, Math.min(100, Math.round(done)));
  }

  /** Points between the member's current tier floor and the next tier floor. */
  private tierSpan(l: LoyaltySummaryResponse): number {
    const nextFloor = l.lifetimePoints + l.pointsToNextTier!;
    // Tier floors mirror the backend LoyaltyTier thresholds.
    const floors = [0, 1000, 5000];
    const currentFloor = floors.filter(f => f < nextFloor).pop() ?? 0;
    return nextFloor - currentFloor;
  }

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
