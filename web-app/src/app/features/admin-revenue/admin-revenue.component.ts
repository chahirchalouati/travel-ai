import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { RevenueService } from '../../core/services/revenue.service';
import type { RevenueSummaryResponse } from '../../core/models/api.models';

interface RevenueStream {
  readonly key: string;
  readonly amount: number;
  readonly color: string;
}

/**
 * Admin revenue dashboard: shows the platform's take split across its income
 * streams (service fees, commission markup, ancillary sales, subscriptions),
 * with a proportional mix bar. Gross booking value is shown for context but is
 * customer spend, not platform revenue.
 */
@Component({
  selector: 'app-admin-revenue',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, TranslocoModule],
  templateUrl: './admin-revenue.component.html',
  styleUrl: './admin-revenue.component.scss',
})
export class AdminRevenueComponent {
  private readonly revenue = inject(RevenueService);

  protected readonly summary = signal<RevenueSummaryResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  /** The four platform-revenue streams, ordered, with a colour for the mix bar. */
  protected readonly streams = computed<RevenueStream[]>(() => {
    const s = this.summary();
    if (!s) {
      return [];
    }
    return [
      { key: 'commission', amount: s.commissionRevenue, color: '#E5352B' },
      { key: 'serviceFee', amount: s.serviceFeeRevenue, color: '#f0a935' },
      { key: 'ancillary', amount: s.ancillaryRevenue, color: '#00856a' },
      { key: 'subscription', amount: s.subscriptionRevenue, color: '#4a6fe0' },
    ];
  });

  /** Percentage of total platform revenue for a stream (0 when total is 0). */
  protected share(amount: number): number {
    const total = this.summary()?.totalPlatformRevenue ?? 0;
    return total > 0 ? (amount / total) * 100 : 0;
  }

  constructor() {
    this.revenue.summary().pipe(catchError(() => of(null))).subscribe(res => {
      this.loading.set(false);
      if (res) {
        this.summary.set(res);
      } else {
        this.failed.set(true);
      }
    });
  }
}
