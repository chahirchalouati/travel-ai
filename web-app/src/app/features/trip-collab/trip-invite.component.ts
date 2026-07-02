import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { TripCollabService } from '../../core/services/trip-collab.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Landing page for /trips/invite?token=... — accepts the invite for the
 * authenticated user then redirects to the trip's live itinerary. If the user
 * is not logged in, they are sent to login and returned here afterwards.
 */
@Component({
  selector: 'app-trip-invite',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
      <div class="ti">
        @if (state() === 'working') {
          <span class="ti-spinner"></span>
          <p class="ti-msg">{{ t('tripCollab.accept.working') }}</p>
        } @else if (state() === 'login') {
          <span class="ms ti-icon">lock</span>
          <h1 class="ti-title">{{ t('tripCollab.accept.loginTitle') }}</h1>
          <p class="ti-msg">{{ t('tripCollab.accept.loginBody') }}</p>
          <button class="ti-btn" (click)="goHome()">{{ t('tripCollab.accept.goHome') }}</button>
        } @else if (state() === 'error') {
          <span class="ms ti-icon">link_off</span>
          <h1 class="ti-title">{{ t('tripCollab.accept.errorTitle') }}</h1>
          <p class="ti-msg">{{ t('tripCollab.accept.errorBody') }}</p>
          <button class="ti-btn" (click)="goTrips()">{{ t('tripCollab.accept.goTrips') }}</button>
        }
      </div>
    </ng-container>
  `,
  styles: [`
    .ti { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; text-align: center; padding: 2rem; }
    .ti-spinner { width: 42px; height: 42px; border: 4px solid var(--line, #e5e7eb); border-top-color: var(--accent, #2563eb); border-radius: 50%; animation: ti-spin 0.8s linear infinite; }
    @keyframes ti-spin { to { transform: rotate(360deg) } }
    .ti-icon { font-size: 46px; color: var(--muted, #6b7280); }
    .ti-title { margin: 0; font-size: 1.4rem; font-weight: 800; }
    .ti-msg { margin: 0; color: var(--muted, #6b7280); }
    .ti-btn { margin-top: 0.5rem; background: var(--accent, #2563eb); color: #fff; border: none; border-radius: 10px; padding: 0.7rem 1.4rem; font-weight: 700; cursor: pointer; }
  `],
})
export class TripInviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly collab = inject(TripCollabService);
  private readonly auth = inject(AuthService);

  readonly state = signal<'working' | 'login' | 'error'>('working');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }
    if (!this.auth.getToken()) {
      // Auth is a home-page modal in this app; ask the user to sign in and reopen.
      this.state.set('login');
      return;
    }
    this.collab
      .accept(token)
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (res?.tripId) {
          this.router.navigate(['/trips', res.tripId, 'live']);
        } else {
          this.state.set('error');
        }
      });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goTrips(): void {
    this.router.navigate(['/trips']);
  }
}
