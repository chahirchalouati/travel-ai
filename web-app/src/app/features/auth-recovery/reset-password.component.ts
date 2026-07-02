import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { AUTH_RECOVERY_STYLES } from './auth-recovery.styles';

const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule],
  template: `
    <main class="rec-wrap">
      <section class="rec-card" aria-labelledby="reset-heading">
        @if (done()) {
          <div class="rec-icon ok"><span class="ms">check_circle</span></div>
          <h1 id="reset-heading" class="rec-title">{{ 'authRecovery.resetSuccessTitle' | transloco }}</h1>
          <p class="rec-sub">{{ 'authRecovery.resetSuccessBody' | transloco }}</p>
          <p class="rec-footer"><a class="rec-link" routerLink="/">{{ 'authRecovery.backHome' | transloco }}</a></p>
        } @else if (!token) {
          <div class="rec-icon err"><span class="ms">link_off</span></div>
          <h1 id="reset-heading" class="rec-title">{{ 'authRecovery.resetTitle' | transloco }}</h1>
          <p class="rec-sub">{{ 'authRecovery.errMissingToken' | transloco }}</p>
          <p class="rec-footer">
            <a class="rec-link" routerLink="/forgot-password">{{ 'authRecovery.forgotTitle' | transloco }}</a>
          </p>
        } @else {
          <div class="rec-icon"><span class="ms">key</span></div>
          <h1 id="reset-heading" class="rec-title">{{ 'authRecovery.resetTitle' | transloco }}</h1>
          <p class="rec-sub">{{ 'authRecovery.resetSub' | transloco }}</p>

          <form class="rec-form" (ngSubmit)="submit()">
            <div class="rec-field">
              <label class="rec-label" for="reset-pass">{{ 'authRecovery.newPassword' | transloco }}</label>
              <input id="reset-pass" class="rec-input" type="password" name="password"
                     [(ngModel)]="password" autocomplete="new-password" placeholder="••••••••" required>
            </div>
            <div class="rec-field">
              <label class="rec-label" for="reset-confirm">{{ 'authRecovery.confirmPassword' | transloco }}</label>
              <input id="reset-confirm" class="rec-input" type="password" name="confirm"
                     [(ngModel)]="confirm" autocomplete="new-password" placeholder="••••••••" required>
            </div>

            @if (error()) {
              <div class="rec-error" role="alert">
                <span class="ms">error</span> {{ error() }}
              </div>
            }

            <button class="rec-submit" type="submit" [disabled]="loading()">
              @if (loading()) { <span class="rec-spinner"></span> }
              @else { {{ 'authRecovery.resetSubmit' | transloco }} }
            </button>
          </form>
        }
      </section>
    </main>
  `,
  styles: [AUTH_RECOVERY_STYLES],
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly transloco = inject(TranslocoService);

  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  password = '';
  confirm = '';

  submit(): void {
    if (!this.token) return;
    if (this.password.length < MIN_PASSWORD_LENGTH) {
      this.error.set(this.transloco.translate('authRecovery.errTooShort'));
      return;
    }
    if (this.password !== this.confirm) {
      this.error.set(this.transloco.translate('authRecovery.errMismatch'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const status = (err as { status?: number })?.status;
        this.error.set(this.transloco.translate(
          status === 400 ? 'authRecovery.errReset' : 'authRecovery.errGeneric'
        ));
      },
    });
  }
}
