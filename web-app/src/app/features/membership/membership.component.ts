import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';
import type { MembershipResponse, SubscriptionPlanResponse } from '../../core/models/api.models';

/**
 * Travel AI Prime landing + management page. Shows the plan and its benefits to
 * everyone; signed-in members see their active status and can cancel. The plan
 * catalogue is public; subscribe/cancel require authentication.
 */
@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, TranslocoModule],
  templateUrl: './membership.component.html',
  styleUrl: './membership.component.scss',
})
export class MembershipComponent {
  private readonly subscriptions = inject(SubscriptionService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly plan = signal<SubscriptionPlanResponse | null>(null);
  protected readonly membership = signal<MembershipResponse | null>(null);
  protected readonly working = signal(false);

  protected readonly isMember = computed(() => this.membership()?.active === true);
  /** The seven concrete benefit rows, driven by i18n keys. */
  protected readonly benefitKeys = ['fee', 'discount', 'priority', 'watch', 'concierge'] as const;

  constructor() {
    this.subscriptions.plans().pipe(catchError(() => of([]))).subscribe(plans => {
      this.plan.set(plans.find(p => p.code === 'PRIME') ?? plans[0] ?? null);
    });
    if (this.isAuthenticated()) {
      this.subscriptions.me().pipe(catchError(() => of(null))).subscribe(m => this.membership.set(m));
    }
  }

  protected subscribe(): void {
    const code = this.plan()?.code;
    if (!code) {
      return;
    }
    if (!this.isAuthenticated()) {
      this.router.navigate(['/'], { queryParams: { auth: 'login', next: '/membership' } });
      return;
    }
    this.working.set(true);
    this.subscriptions.subscribe(code).pipe(catchError(() => of(null))).subscribe(m => {
      this.working.set(false);
      if (m) {
        this.membership.set(m);
      }
    });
  }

  protected cancel(): void {
    this.working.set(true);
    this.subscriptions.cancel().pipe(catchError(() => of(null))).subscribe(m => {
      this.working.set(false);
      this.membership.set(m ?? { ...this.membership()!, active: false });
    });
  }
}
