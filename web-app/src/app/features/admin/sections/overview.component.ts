import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AdminService, AdminDashboard, AdminAlert, RevenueSummary, AdminAuditLog } from '../../../core/services/admin.service';
import { AdminSectionComponent } from '../ui/admin-section.component';
import { AdminStatTileComponent } from '../ui/admin-stat-tile.component';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { AdminDonutComponent, AdminBarsComponent, ChartDatum } from '../ui/admin-charts.component';
import { compactMoney, money, num } from '../state/format';

const ALERT_ROUTES: Record<string, { path: string; params?: Record<string, string> }> = {
  failedPayments: { path: 'payments', params: { status: 'FAILED' } },
  pendingPartners: { path: 'partners' },
  ragEmpty: { path: 'rag' },
};

/** Command-center overview: KPIs, actionable alerts, revenue composition, catalog spread, recent activity. */
@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [
    TranslocoModule, AdminSectionComponent, AdminStatTileComponent,
    AdminStatusBadgeComponent, AdminDonutComponent, AdminBarsComponent,
  ],
  styleUrls: ['./overview.component.scss'],
  template: `
    <admin-section eyebrow="00 / CONTROL" [title]="'admin.navOverview' | transloco" [state]="state()"
                   (retry)="load()">
      @if (alerts().length) {
        <div class="ov-alerts">
          @for (a of alerts(); track a.code) {
            <div class="ov-alert" [attr.data-sev]="a.severity">
              <span class="ad-ms">{{ a.severity === 'warning' ? 'warning' : 'info' }}</span>
              <span class="ov-alert__txt">{{ 'admin.alert_' + a.code | transloco:{ count: a.count } }}</span>
              @if (route(a.code); as r) {
                <button type="button" class="ov-alert__cta" (click)="go(r)">{{ 'admin.alertView' | transloco }} →</button>
              }
            </div>
          }
        </div>
      }

      <div class="ov-kpis">
        <admin-stat-tile class="ov-kpis__hero" [label]="'admin.statRevenue' | transloco"
          [value]="compactMoney(dashboard()?.totalRevenue)" tone="accent"
          [trend]="dashboard()?.revenueGrowth ?? null"
          [hint]="('admin.statGross' | transloco) + ' ' + money(revenue()?.grossBookingValue)" />
        <admin-stat-tile [label]="'admin.statUsers' | transloco" [value]="num(dashboard()?.totalUsers)"
          [clickable]="true" (act)="go({ path: 'users' })" />
        <admin-stat-tile [label]="'admin.statBookings' | transloco" [value]="num(dashboard()?.totalBookings)"
          [clickable]="true" (act)="go({ path: 'bookings' })"
          [hint]="num(revenue()?.confirmedBookings) + ' ' + ('admin.statConfirmed' | transloco)" />
        <admin-stat-tile [label]="'admin.statPartners' | transloco" [value]="num(dashboard()?.activePartners)"
          [clickable]="true" (act)="go({ path: 'partners' })"
          [tone]="(dashboard()?.pendingPartners ?? 0) > 0 ? 'warn' : 'default'"
          [hint]="num(dashboard()?.pendingPartners) + ' ' + ('admin.statPending' | transloco)" />
      </div>

      <div class="ov-panels">
        <section class="ov-panel">
          <header class="ov-panel__head">
            <h2 class="ov-panel__title">{{ 'admin.ovRevenueMix' | transloco }}</h2>
            <span class="ov-panel__note ad-mono">{{ 'admin.ovRevenueMixNote' | transloco }}</span>
          </header>
          <admin-donut [data]="revenueMix()" [centerLabel]="'admin.ovPlatform' | transloco"
                       [centerValue]="compactMoney(revenue()?.totalPlatformRevenue)" />
          <div class="ov-subs">
            <span class="ad-mono">{{ num(revenue()?.activeSubscriptions) }}</span>
            <span>{{ 'admin.ovActiveSubs' | transloco }}</span>
          </div>
        </section>

        <section class="ov-panel">
          <header class="ov-panel__head">
            <h2 class="ov-panel__title">{{ 'admin.ovCatalogSpread' | transloco }}</h2>
            <button type="button" class="ov-panel__link" (click)="go({ path: 'hotels' })">{{ 'admin.manageCatalog' | transloco }} →</button>
          </header>
          <admin-bars [data]="catalogSpread()" />
        </section>
      </div>

      <section class="ov-panel ov-activity">
        <header class="ov-panel__head">
          <h2 class="ov-panel__title">{{ 'admin.ovRecentActivity' | transloco }}</h2>
          <button type="button" class="ov-panel__link" (click)="go({ path: 'audit' })">{{ 'admin.navAudit' | transloco }} →</button>
        </header>
        @if (activity().length) {
          <ul class="ov-feed">
            @for (a of activity(); track a.id) {
              <li class="ov-feed__row">
                <admin-status-badge [tone]="a.statusCode < 400 ? 'ok' : 'danger'" [dot]="true">{{ a.statusCode }}</admin-status-badge>
                <span class="ov-feed__actor">{{ a.actor }}</span>
                <span class="ov-feed__action ad-mono">{{ a.action }}</span>
                <span class="ov-feed__time ad-mono">{{ time(a.createdAt) }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="ov-feed__empty">{{ 'admin.stateEmpty' | transloco }}</p>
        }
      </section>
    </admin-section>
  `,
})
export class AdminOverviewComponent {
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);

  readonly dashboard = signal<AdminDashboard | null>(null);
  readonly revenue = signal<RevenueSummary | null>(null);
  readonly alerts = signal<AdminAlert[]>([]);
  readonly activity = signal<AdminAuditLog[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');

  readonly compactMoney = compactMoney;
  readonly money = money;
  readonly num = num;

  readonly revenueMix = computed<ChartDatum[]>(() => {
    const r = this.revenue();
    if (!r) return [];
    return [
      { label: 'Service fees', value: r.serviceFeeRevenue, color: 'var(--ad-c1)' },
      { label: 'Commission', value: r.commissionRevenue, color: 'var(--ad-c2)' },
      { label: 'Ancillary', value: r.ancillaryRevenue, color: 'var(--ad-c3)' },
      { label: 'Subscriptions', value: r.subscriptionRevenue, color: 'var(--ad-c4)' },
    ];
  });

  readonly catalogSpread = computed<ChartDatum[]>(() => {
    const d = this.dashboard();
    if (!d) return [];
    return [
      { label: 'Hotels', value: d.totalHotels },
      { label: 'Flights', value: d.totalFlights },
      { label: 'Cruises', value: d.totalCruises },
      { label: 'Restaurants', value: d.totalRestaurants },
      { label: 'Destinations', value: d.totalDestinations },
      { label: 'Stories', value: d.totalStories },
    ];
  });

  constructor() { this.load(); }

  load(): void {
    this.state.set('loading');
    this.admin.dashboard().pipe(catchError(() => of(null))).subscribe(d => {
      this.dashboard.set(d);
      this.state.set(d ? 'ready' : 'error');
    });
    this.admin.revenueSummary().pipe(catchError(() => of(null))).subscribe(r => this.revenue.set(r));
    this.admin.alerts().pipe(catchError(() => of([]))).subscribe(a => this.alerts.set(a));
    this.admin.auditLogs(0, 8).pipe(catchError(() => of(null))).subscribe(res => this.activity.set(res?.content ?? []));
  }

  route(code: string): { path: string; params?: Record<string, string> } | null { return ALERT_ROUTES[code] ?? null; }
  go(r: { path: string; params?: Record<string, string> }): void {
    this.router.navigate(['/admin', r.path], r.params ? { queryParams: r.params } : {});
  }
  time(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
  }
}
