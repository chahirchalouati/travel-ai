import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { AUTH_RECOVERY_STYLES } from './auth-recovery.styles';

type VerifyState = 'verifying' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  template: `
    <main class="rec-wrap">
      <section class="rec-card rec-status" aria-labelledby="verify-heading">
        @switch (state()) {
          @case ('verifying') {
            <div class="rec-icon"><span class="rec-spinner dark"></span></div>
            <h1 id="verify-heading" class="rec-title">{{ 'authRecovery.verifyTitle' | transloco }}</h1>
            <p class="rec-sub">{{ 'authRecovery.verifying' | transloco }}</p>
          }
          @case ('success') {
            <div class="rec-icon ok"><span class="ms">verified</span></div>
            <h1 id="verify-heading" class="rec-title">{{ 'authRecovery.verifySuccessTitle' | transloco }}</h1>
            <p class="rec-sub">{{ 'authRecovery.verifySuccessBody' | transloco }}</p>
            <p class="rec-footer"><a class="rec-link" routerLink="/">{{ 'authRecovery.backHome' | transloco }}</a></p>
          }
          @case ('error') {
            <div class="rec-icon err"><span class="ms">error</span></div>
            <h1 id="verify-heading" class="rec-title">{{ 'authRecovery.verifyErrTitle' | transloco }}</h1>
            <p class="rec-sub">{{ 'authRecovery.verifyErrBody' | transloco }}</p>
            <p class="rec-footer"><a class="rec-link" routerLink="/">{{ 'authRecovery.backHome' | transloco }}</a></p>
          }
        }
      </section>
    </main>
  `,
  styles: [AUTH_RECOVERY_STYLES],
})
export class VerifyEmailComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly state = signal<VerifyState>('verifying');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.state.set('success');
        // Refresh the cached profile so the account page reflects the new status.
        if (this.auth.isAuthenticated()) {
          this.auth.fetchProfile().subscribe({ error: () => {} });
        }
      },
      error: () => this.state.set('error'),
    });
  }
}
