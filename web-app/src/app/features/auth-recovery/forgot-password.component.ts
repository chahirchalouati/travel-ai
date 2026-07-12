import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { AUTH_RECOVERY_STYLES } from './auth-recovery.styles';
import { UiInputComponent } from '../../shared/ui/ui-input.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule, UiInputComponent],
  template: `
    <main class="rec-wrap">
      <section class="rec-card" aria-labelledby="forgot-heading">
        @if (sent()) {
          <div class="rec-icon ok"><span class="ms">mark_email_read</span></div>
          <h1 id="forgot-heading" class="rec-title">{{ 'authRecovery.sentTitle' | transloco }}</h1>
          <p class="rec-sub">{{ 'authRecovery.sentBody' | transloco }}</p>
          <p class="rec-footer"><a class="rec-link" routerLink="/">{{ 'authRecovery.backHome' | transloco }}</a></p>
        } @else {
          <div class="rec-icon"><span class="ms">lock_reset</span></div>
          <h1 id="forgot-heading" class="rec-title">{{ 'authRecovery.forgotTitle' | transloco }}</h1>
          <p class="rec-sub">{{ 'authRecovery.forgotSub' | transloco }}</p>

          <form class="rec-form" (ngSubmit)="submit()">
            <app-ui-input name="email" type="email" autocomplete="email" required
                          placeholder="you@example.com"
                          [label]="'authRecovery.emailLabel' | transloco" [(ngModel)]="email" />

            @if (error()) {
              <div class="rec-error" role="alert">
                <span class="ms">error</span> {{ error() }}
              </div>
            }

            <button class="rec-submit" type="submit" [disabled]="loading()">
              @if (loading()) { <span class="rec-spinner"></span> }
              @else { {{ 'authRecovery.sendLink' | transloco }} }
            </button>
          </form>

          <p class="rec-footer"><a class="rec-link" routerLink="/">{{ 'authRecovery.backHome' | transloco }}</a></p>
        }
      </section>
    </main>
  `,
  styles: [AUTH_RECOVERY_STYLES],
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly transloco = inject(TranslocoService);

  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  email = '';

  submit(): void {
    const email = this.email.trim();
    if (!email) {
      this.error.set(this.transloco.translate('authRecovery.errEmailRequired'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.transloco.translate('authRecovery.errGeneric'));
      },
    });
  }
}
