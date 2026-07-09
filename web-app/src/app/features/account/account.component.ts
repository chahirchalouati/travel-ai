import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import type { LoyaltySummaryResponse, TwoFactorSetupResponse } from '../../core/models/api.models';

type MfaView = 'idle' | 'setup' | 'recovery' | 'disable';

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

        <!-- Two-factor authentication -->
        <section class="card pad security">
          <div class="security-head">
            <span class="security-icon" [class.on]="user()?.mfaEnabled"><span class="ms">{{ user()?.mfaEnabled ? 'verified_user' : 'shield' }}</span></span>
            <div>
              <h3 class="security-title">{{ 'twoFactor.title' | transloco }}</h3>
              <p class="security-sub">{{ 'twoFactor.subtitle' | transloco }}</p>
            </div>
            <span class="security-badge" [class.on]="user()?.mfaEnabled">
              {{ (user()?.mfaEnabled ? 'twoFactor.statusOn' : 'twoFactor.statusOff') | transloco }}
            </span>
          </div>

          @if (user()?.mfaEnabled) {
            @if (mfaView() === 'idle') {
              <p class="security-body">{{ 'twoFactor.enabledBody' | transloco }}</p>
              <button type="button" class="dash-cta dash-cta--ghost security-danger" (click)="beginDisable()">
                {{ 'twoFactor.disable' | transloco }}
              </button>
            } @else if (mfaView() === 'disable') {
              <p class="security-body">{{ 'twoFactor.disablePrompt' | transloco }}</p>
              <label class="field">
                <span>{{ 'twoFactor.codeLabel' | transloco }}</span>
                <input [(ngModel)]="mfaCode" name="disableCode" inputmode="text" autocomplete="one-time-code"
                       [placeholder]="'twoFactor.codePlaceholder' | transloco" />
              </label>
              @if (mfaError()) { <p class="security-err">{{ mfaError() }}</p> }
              <div class="form-actions">
                <button type="button" class="dash-cta dash-cta--ghost" (click)="cancelMfa()">{{ 'account.reset' | transloco }}</button>
                <button type="button" class="dash-cta security-danger" (click)="confirmDisable()" [disabled]="mfaBusy()">
                  {{ (mfaBusy() ? 'twoFactor.working' : 'twoFactor.disable') | transloco }}
                </button>
              </div>
            }
          } @else {
            @if (mfaView() === 'idle') {
              <p class="security-body">{{ 'twoFactor.disabledBody' | transloco }}</p>
              <button type="button" class="dash-cta" (click)="beginSetup()" [disabled]="mfaBusy()">
                {{ (mfaBusy() ? 'twoFactor.working' : 'twoFactor.enable') | transloco }}
              </button>
            } @else if (mfaView() === 'setup') {
              @if (setupData(); as s) {
              <p class="security-body">{{ 'twoFactor.setupStep1' | transloco }}</p>
              @if (s.qrDataUri) {
                <img class="security-qr" [src]="s.qrDataUri" [alt]="'twoFactor.qrAlt' | transloco" width="180" height="180" />
              }
              <p class="security-secret-label">{{ 'twoFactor.manualEntry' | transloco }}</p>
              <code class="security-secret">{{ s.secret }}</code>

              <label class="field security-code-field">
                <span>{{ 'twoFactor.setupStep2' | transloco }}</span>
                <input [(ngModel)]="mfaCode" name="enableCode" inputmode="text" autocomplete="one-time-code"
                       [placeholder]="'twoFactor.codePlaceholder' | transloco" />
              </label>
              @if (mfaError()) { <p class="security-err">{{ mfaError() }}</p> }
              <div class="form-actions">
                <button type="button" class="dash-cta dash-cta--ghost" (click)="cancelMfa()">{{ 'account.reset' | transloco }}</button>
                <button type="button" class="dash-cta" (click)="confirmEnable()" [disabled]="mfaBusy()">
                  {{ (mfaBusy() ? 'twoFactor.working' : 'twoFactor.confirmEnable') | transloco }}
                </button>
              </div>
              }
            } @else if (mfaView() === 'recovery') {
              <div class="security-recovery-head">
                <span class="ms">check_circle</span>
                <strong>{{ 'twoFactor.enabledDone' | transloco }}</strong>
              </div>
              <p class="security-body">{{ 'twoFactor.recoveryIntro' | transloco }}</p>
              <ul class="security-recovery">
                @for (code of recoveryCodes(); track code) {
                  <li>{{ code }}</li>
                }
              </ul>
              <button type="button" class="dash-cta" (click)="finishRecovery()">{{ 'twoFactor.recoverySaved' | transloco }}</button>
            }
          }
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
    .identity-avatar { width: 60px; height: 60px; flex: none; border-radius: 50%; background: linear-gradient(135deg, var(--brand), var(--brand-hover)); color: #fff; font-weight: 800; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; }
    .identity-name { margin: 0; font-size: 1.3rem; font-weight: 800; }
    .identity-email { color: var(--muted); font-size: 0.9rem; }
    .role-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; background: var(--teal-light); color: var(--teal); font-weight: 800; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 11px; border-radius: 2px; }
    .role-badge .ms { font-size: 15px; }
    .role-badge.admin { background: var(--brand-light); color: var(--accent); }
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field span { font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); }
    .field small { color: var(--muted); font-weight: 500; }
    .field input { border: 1px solid var(--line); border-radius: 3px; padding: 0.65rem 0.85rem; font-family: inherit; font-size: 0.95rem; outline: none; transition: border-color 120ms ease; }
    .field input:focus { border-color: var(--accent); }
    .field input:disabled { background: var(--bg-secondary); color: var(--muted); }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.7rem; margin-top: 0.5rem; }
    .side { display: flex; flex-direction: column; gap: 1.25rem; }
    .side-h { margin: 0 0 0.9rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
    .side-link { display: flex; align-items: center; gap: 10px; width: 100%; background: none; border: none; padding: 0.65rem 0; font-family: inherit; font-size: 0.95rem; font-weight: 600; color: var(--ink); cursor: pointer; border-radius: 8px; transition: color 120ms ease; }
    .side-link:hover { color: var(--accent); }
    .side-link .ms { font-size: 19px; color: var(--muted); }
    .side-link:hover .ms { color: var(--accent); }
    .side-link.admin { color: var(--accent); font-weight: 800; }
    .status-line { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; padding: 0.3rem 0; color: var(--text-secondary); }
    .status-line .ms { font-size: 18px; color: var(--muted); }
    .status-line .ms.ok { color: var(--teal); }
    .danger { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--surface); border: 1px solid var(--line); color: var(--accent); border-radius: 3px; padding: 0.85rem; font-family: inherit; font-weight: 700; cursor: pointer; transition: background 120ms ease; }
    .danger:hover { background: var(--accent-soft); }
    .toast { background: var(--ink); color: #fff; padding: 0.7rem 1.1rem; border-radius: 3px; margin-bottom: 1.2rem; font-weight: 600; font-size: 0.9rem; }
    /* Loyalty card — occupies the main column, below the identity card. */
    .loyalty { grid-column: 1; }
    .loyalty-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding-bottom: 1.1rem; margin-bottom: 1.1rem; border-bottom: 1px solid var(--line); }
    .loyalty-tier { display: inline-flex; align-items: center; gap: 7px; font-weight: 800; font-size: 1.05rem; letter-spacing: 0.01em; padding: 6px 13px; border-radius: 2px; background: linear-gradient(135deg, #1f2733, #3a4656); color: #fff; }
    .loyalty[data-tier="VOYAGER"] .loyalty-tier { background: linear-gradient(135deg, #1d5c8f, #4aa3d6); }
    .loyalty[data-tier="ELITE"] .loyalty-tier { background: linear-gradient(135deg, #9a6a12, #e0b64a); }
    .loyalty-tier .ms { font-size: 19px; }
    .loyalty-sub { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.85rem; }
    .loyalty-balance { text-align: right; flex: none; }
    .loyalty-points { display: block; font-size: 1.9rem; font-weight: 800; line-height: 1; color: var(--ink); }
    .loyalty-points-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700; }
    .loyalty-progress { margin-bottom: 1rem; }
    .loyalty-progress__labels { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 6px; }
    .loyalty-bar { height: 8px; border-radius: 2px; background: var(--bg-tertiary); overflow: hidden; }
    .loyalty-bar__fill { display: block; height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--brand), var(--brand-hover)); transition: width var(--duration-normal) var(--ease-out-expo); }
    .loyalty-top { margin: 0 0 1rem; font-weight: 700; color: var(--gold); font-size: 0.9rem; }
    .loyalty-meta { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.82rem; color: var(--muted); font-weight: 600; padding-bottom: 1rem; margin-bottom: 0.6rem; border-bottom: 1px solid var(--line); }
    .loyalty-h { margin: 0 0 0.6rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
    .loyalty-tx { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .loyalty-tx__row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.55rem 0; border-bottom: 1px solid var(--border-light); }
    .loyalty-tx__row:last-child { border-bottom: none; }
    .loyalty-tx__desc { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-primary); }
    .loyalty-tx__desc small { color: var(--muted); font-weight: 500; margin-left: 4px; }
    .loyalty-tx__desc .ms { font-size: 18px; }
    .loyalty-tx__pts { font-weight: 800; font-size: 0.95rem; font-variant-numeric: tabular-nums; }
    .ms.earn, .loyalty-tx__pts.earn { color: var(--teal); }
    .ms.redeem, .loyalty-tx__pts.redeem { color: var(--accent); }
    .loyalty-empty { color: var(--muted); font-size: 0.88rem; margin: 0.3rem 0 0; }
    /* Two-factor security card — main column, below loyalty. */
    .security { grid-column: 1; }
    .security-head { display: flex; align-items: flex-start; gap: 1rem; padding-bottom: 1.1rem; margin-bottom: 1.1rem; border-bottom: 1px solid var(--line); }
    .security-icon { width: 44px; height: 44px; flex: none; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); color: var(--muted); }
    .security-icon.on { background: var(--teal-light); color: var(--teal); }
    .security-icon .ms { font-size: 22px; }
    .security-title { margin: 0; font-size: 1.05rem; font-weight: 800; }
    .security-sub { margin: 0.3rem 0 0; color: var(--muted); font-size: 0.85rem; }
    .security-badge { margin-left: auto; flex: none; align-self: center; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 11px; border-radius: 2px; background: var(--bg-secondary); color: var(--muted); }
    .security-badge.on { background: var(--teal-light); color: var(--teal); }
    .security-body { margin: 0 0 1rem; color: var(--text-secondary); font-size: 0.92rem; line-height: 1.5; }
    .security-qr { display: block; border: 1px solid var(--line); border-radius: 3px; padding: 8px; background: var(--surface); margin: 0 0 0.9rem; }
    .security-secret-label { margin: 0 0 0.3rem; font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); }
    .security-secret { display: inline-block; font-family: 'SF Mono', ui-monospace, monospace; font-size: 0.95rem; letter-spacing: 0.08em; background: var(--bg-secondary); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 0.5rem 0.8rem; margin-bottom: 1rem; word-break: break-all; }
    .security-code-field { margin-bottom: 0.5rem; }
    .security-err { color: var(--accent); font-size: 0.85rem; font-weight: 600; margin: 0.2rem 0 0.6rem; }
    .security-danger { color: var(--accent); border-color: var(--accent); }
    .security-recovery-head { display: flex; align-items: center; gap: 8px; font-size: 1rem; color: var(--teal); margin-bottom: 0.6rem; }
    .security-recovery-head .ms { font-size: 20px; }
    .security-recovery { list-style: none; margin: 0 0 1rem; padding: 0.9rem 1rem; background: var(--bg-secondary); border: 1px dashed var(--border); border-radius: var(--radius-sm); display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1.2rem; }
    .security-recovery li { font-family: 'SF Mono', ui-monospace, monospace; font-size: 0.95rem; letter-spacing: 0.06em; color: var(--ink); }
    @media (max-width: 480px) { .security-recovery { grid-template-columns: 1fr; } }
    .verify-banner { display: flex; align-items: center; gap: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 3px; padding: 0.8rem 1.1rem; margin-bottom: 1.2rem; }
    .verify-banner .ms { color: #c2620a; font-size: 22px; flex: none; }
    .verify-banner-text { display: flex; flex-direction: column; gap: 2px; font-size: 0.88rem; color: #7c4a10; }
    .verify-banner-text strong { font-size: 0.92rem; color: #6b3c07; }
    .verify-banner-btn { margin-left: auto; flex: none; background: #c2620a; color: #fff; border: none; border-radius: 2px; padding: 0.5rem 1rem; font-family: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 120ms ease; }
    .verify-banner-btn:hover:not(:disabled) { background: #a5520a; }
    .verify-banner-btn:disabled { opacity: 0.7; cursor: default; }
    @media (max-width: 560px) { .verify-banner { flex-wrap: wrap; } .verify-banner-btn { margin-left: 0; } }
    @media (max-width: 820px) { .account-grid { grid-template-columns: 1fr; } .field-row { grid-template-columns: 1fr; } .loyalty { grid-column: auto; } .security { grid-column: auto; } }
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

  // Two-factor auth state
  readonly mfaView = signal<MfaView>('idle');
  readonly mfaBusy = signal(false);
  readonly mfaError = signal('');
  readonly setupData = signal<TwoFactorSetupResponse | null>(null);
  readonly recoveryCodes = signal<string[]>([]);
  mfaCode = '';

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

  // ── Two-factor authentication ──────────────────────────────────────────────

  beginSetup(): void {
    this.mfaError.set('');
    this.mfaBusy.set(true);
    this.auth.setup2fa().subscribe({
      next: data => {
        this.mfaBusy.set(false);
        this.setupData.set(data);
        this.mfaCode = '';
        this.mfaView.set('setup');
      },
      error: () => {
        this.mfaBusy.set(false);
        this.flash(this.transloco.translate('twoFactor.errGeneric'));
      },
    });
  }

  confirmEnable(): void {
    const code = this.mfaCode.trim();
    if (!code) {
      this.mfaError.set(this.transloco.translate('twoFactor.errCodeRequired'));
      return;
    }
    this.mfaBusy.set(true);
    this.mfaError.set('');
    this.auth.enable2fa(code).subscribe({
      next: res => {
        this.mfaBusy.set(false);
        this.recoveryCodes.set(res.recoveryCodes);
        this.setupData.set(null);
        this.mfaCode = '';
        this.mfaView.set('recovery');
      },
      error: (err: unknown) => {
        this.mfaBusy.set(false);
        this.mfaError.set(this.transloco.translate(this.isCodeError(err) ? 'twoFactor.errCodeInvalid' : 'twoFactor.errGeneric'));
      },
    });
  }

  finishRecovery(): void {
    this.recoveryCodes.set([]);
    this.mfaView.set('idle');
    this.flash(this.transloco.translate('twoFactor.enabledDone'));
  }

  beginDisable(): void {
    this.mfaError.set('');
    this.mfaCode = '';
    this.mfaView.set('disable');
  }

  confirmDisable(): void {
    const code = this.mfaCode.trim();
    if (!code) {
      this.mfaError.set(this.transloco.translate('twoFactor.errCodeRequired'));
      return;
    }
    this.mfaBusy.set(true);
    this.mfaError.set('');
    this.auth.disable2fa(code).subscribe({
      next: () => {
        this.mfaBusy.set(false);
        this.mfaCode = '';
        this.mfaView.set('idle');
        this.flash(this.transloco.translate('twoFactor.disabledDone'));
      },
      error: (err: unknown) => {
        this.mfaBusy.set(false);
        this.mfaError.set(this.transloco.translate(this.isCodeError(err) ? 'twoFactor.errCodeInvalid' : 'twoFactor.errGeneric'));
      },
    });
  }

  cancelMfa(): void {
    this.mfaView.set('idle');
    this.setupData.set(null);
    this.mfaCode = '';
    this.mfaError.set('');
  }

  private isCodeError(err: unknown): boolean {
    const status = (err as { status?: number })?.status;
    return status === 400 || status === 401;
  }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
