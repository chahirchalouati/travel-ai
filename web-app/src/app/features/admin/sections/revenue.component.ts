import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AdminService, RevenueSummary } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminStatTileComponent } from '../ui/admin-stat-tile.component';
import { AdminDonutComponent, AdminBarsComponent, ChartDatum } from '../ui/admin-charts.component';
import { compactMoney, money, num } from '../state/format';

/** Revenue: platform take, composition and volume — all from /admin/revenue/summary. */
@Component({
  selector: 'app-admin-revenue',
  standalone: true,
  imports: [TranslocoModule, AdminSectionComponent, AdminStatTileComponent, AdminDonutComponent, AdminBarsComponent],
  styleUrls: ['./section-shared.scss'],
  styles: [`
    .rv-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--ad-sp-4); margin-bottom: var(--ad-sp-6); }
    .rv-panels { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ad-sp-4); }
    .rv-panel { background: var(--ad-surface); border: 1px solid var(--ad-line); border-radius: var(--ad-r-md); padding: var(--ad-sp-5); }
    .rv-panel__h { font-size: var(--ad-fx-h2); font-weight: 700; margin: 0 0 var(--ad-sp-5); }
    @media (max-width: 1100px) { .rv-kpis { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 900px) { .rv-panels { grid-template-columns: 1fr; } }
    @media (max-width: 560px) { .rv-kpis { grid-template-columns: 1fr; } }
  `],
  template: `
    <admin-section eyebrow="00 / REVENUE" [title]="'admin.navRevenue' | transloco" [state]="state()" (retry)="load()">
      <div class="rv-kpis">
        <admin-stat-tile [label]="'admin.rvPlatform' | transloco" [value]="compactMoney(r()?.totalPlatformRevenue)" tone="accent" />
        <admin-stat-tile [label]="'admin.statGross' | transloco" [value]="compactMoney(r()?.grossBookingValue)" />
        <admin-stat-tile [label]="'admin.statConfirmed' | transloco" [value]="num(r()?.confirmedBookings)" />
        <admin-stat-tile [label]="'admin.ovActiveSubs' | transloco" [value]="num(r()?.activeSubscriptions)"
          [hint]="money(r()?.subscriptionRevenue) + ' MRR'" />
      </div>

      <div class="rv-panels">
        <section class="rv-panel">
          <h2 class="rv-panel__h">{{ 'admin.ovRevenueMix' | transloco }}</h2>
          <admin-donut [data]="mix()" [centerLabel]="'admin.ovPlatform' | transloco" [centerValue]="compactMoney(r()?.totalPlatformRevenue)" />
        </section>
        <section class="rv-panel">
          <h2 class="rv-panel__h">{{ 'admin.rvStreams' | transloco }}</h2>
          <admin-bars [data]="mix()" prefix="€" />
        </section>
      </div>
    </admin-section>
  `,
})
export class AdminRevenueComponent {
  private readonly admin = inject(AdminService);
  readonly r = signal<RevenueSummary | null>(null);
  readonly state = signal<SectionState>('loading');
  readonly compactMoney = compactMoney;
  readonly money = money;
  readonly num = num;

  readonly mix = computed<ChartDatum[]>(() => {
    const r = this.r();
    if (!r) return [];
    return [
      { label: 'Service fees', value: r.serviceFeeRevenue, color: 'var(--ad-c1)' },
      { label: 'Commission', value: r.commissionRevenue, color: 'var(--ad-c2)' },
      { label: 'Ancillary', value: r.ancillaryRevenue, color: 'var(--ad-c3)' },
      { label: 'Subscriptions', value: r.subscriptionRevenue, color: 'var(--ad-c4)' },
    ];
  });

  constructor() { this.load(); }
  load(): void {
    this.state.set('loading');
    this.admin.revenueSummary().pipe(catchError(() => of(null))).subscribe(r => { this.r.set(r); this.state.set(r ? 'ready' : 'error'); });
  }
}
