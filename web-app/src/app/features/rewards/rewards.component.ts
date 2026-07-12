import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, forkJoin, of } from 'rxjs';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { AuthService } from '../../core/services/auth.service';
import type {
  LoyaltySummaryResponse,
  MemberRewardResponse,
  RewardResponse,
} from '../../core/models/api.models';

/**
 * Loyalty rewards program. Shows milestone rewards (auto-unlocked by lifetime
 * points) and the redeemable catalogue (claimed by spending the balance), plus
 * the rewards the member already owns. All thresholds/costs come from the server.
 */
@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, TranslocoModule],
  templateUrl: './rewards.component.html',
  styleUrl: './rewards.component.scss',
})
export class RewardsComponent {
  private readonly loyalty = inject(LoyaltyService);
  private readonly auth = inject(AuthService);

  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly summary = signal<LoyaltySummaryResponse | null>(null);
  protected readonly catalogue = signal<RewardResponse[]>([]);
  protected readonly mine = signal<MemberRewardResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly redeeming = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly balance = computed(() => this.summary()?.pointsBalance ?? 0);
  protected readonly lifetime = computed(() => this.summary()?.lifetimePoints ?? 0);

  /** Milestone rewards, ordered by threshold. */
  protected readonly milestones = computed(() =>
    this.catalogue().filter(r => r.unlockKind === 'MILESTONE'));
  /** Redeemable catalogue rewards. */
  protected readonly shop = computed(() =>
    this.catalogue().filter(r => r.unlockKind === 'REDEEMABLE'));
  /** Owned rewards that are still usable. */
  protected readonly activeRewards = computed(() =>
    this.mine().filter(r => r.status === 'UNLOCKED'));

  constructor() {
    if (this.isAuthenticated()) {
      this.reload();
    } else {
      this.loading.set(false);
    }
  }

  /** Progress (0–100) toward a milestone's threshold, by lifetime points. */
  protected progress(reward: RewardResponse): number {
    if (!reward.thresholdPoints) {
      return reward.unlocked ? 100 : 0;
    }
    return Math.min(100, Math.round((this.lifetime() / reward.thresholdPoints) * 100));
  }

  /** Points still needed to unlock a milestone, or 0 when already unlocked. */
  protected remaining(reward: RewardResponse): number {
    if (!reward.thresholdPoints) {
      return 0;
    }
    return Math.max(0, reward.thresholdPoints - this.lifetime());
  }

  protected redeem(reward: RewardResponse): void {
    if (!reward.redeemable || this.redeeming()) {
      return;
    }
    this.redeeming.set(reward.code);
    this.error.set(null);
    this.loyalty.redeemReward(reward.code).pipe(
      catchError(() => {
        this.error.set('rewards.error.redeem');
        return of(null);
      }),
    ).subscribe(granted => {
      this.redeeming.set(null);
      if (granted) {
        this.reload();
      }
    });
  }

  private reload(): void {
    this.loading.set(true);
    forkJoin({
      summary: this.loyalty.summary().pipe(catchError(() => of(null))),
      catalogue: this.loyalty.rewards().pipe(catchError(() => of([] as RewardResponse[]))),
      mine: this.loyalty.myRewards().pipe(catchError(() => of([] as MemberRewardResponse[]))),
    }).subscribe(({ summary, catalogue, mine }) => {
      this.summary.set(summary);
      this.catalogue.set(catalogue);
      this.mine.set(mine);
      this.loading.set(false);
    });
  }
}
