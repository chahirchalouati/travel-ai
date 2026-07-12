import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, AdminSubscription } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { UiSelectComponent, UiSelectOption } from '../../../shared/ui/ui-select.component';
import { statusTone } from '../ui/admin-status.util';
import { money } from '../state/format';
import { parseListState, buildListParams, ListState, PAGE_SIZE } from '../state/list-query';

const STATUSES = ['', 'ACTIVE', 'CANCELLED', 'EXPIRED'];

/** Travel AI Prime memberships — subscription payments, linked to their member. */
@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [
    FormsModule, TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminStatusBadgeComponent, AdminDrawerComponent, UiSelectComponent,
  ],
  styleUrls: ['./section-shared.scss'],
  template: `
    <admin-section eyebrow="03 / OPERATIONS" [title]="'admin.navPrime' | transloco" [count]="total()"
                   [state]="state()" (retry)="load()">
      <div slot="toolbar" class="sec-tools">
        <div class="sec-field">
          <app-ui-select [options]="statusOpts()" [ngModel]="s().status"
                         (ngModelChange)="setStatus($any($event))" [ariaLabel]="'admin.thStatus' | transloco" />
        </div>
        @if (s().status) {
          <button type="button" class="sec-btn sec-btn--ghost" (click)="clearFilters()">
            <span class="ad-ms">filter_alt_off</span> {{ 'admin.clearFilters' | transloco }}
          </button>
        }
      </div>

      <admin-data-table
        [columns]="columns()" [rows]="rows()" [total]="total()" [page]="s().page" [size]="pageSize"
        [loading]="loading()" [rowClickable]="true" (rowClick)="openDetail($any($event))" (pageChange)="onPage($event)">

        <ng-template adCell="userEmail" let-m>
          <button type="button" class="pay-link ad-mono" (click)="$event.stopPropagation(); goMember(m.userEmail)">
            <span class="ad-ms">person</span> {{ m.userEmail || '—' }}
          </button>
        </ng-template>
        <ng-template adCell="planName" let-m>
          <admin-status-badge tone="accent" [dot]="false">{{ m.planName || m.planCode }}</admin-status-badge>
        </ng-template>
        <ng-template adCell="status" let-m>
          <admin-status-badge [tone]="statusTone(m.status)">{{ m.status }}</admin-status-badge>
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="detailOpen()" eyebrow="PRIME" [width]="440"
                  [title]="detail() ? money(detail()!.pricePaid, detail()!.currency) : ''" (closed)="detailOpen.set(false)">
      @if (detail(); as m) {
        <div class="kv">
          <div class="kv__row"><span class="kv__k">{{ 'admin.thStatus' | transloco }}</span>
            <span class="kv__v"><admin-status-badge [tone]="statusTone(m.status)">{{ m.status }}</admin-status-badge></span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.subMember' | transloco }}</span>
            <span class="kv__v"><button type="button" class="pay-link ad-mono" (click)="goMember(m.userEmail)">
              <span class="ad-ms">person</span> {{ m.userEmail || '—' }}</button></span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.subPlan' | transloco }}</span><span class="kv__v">{{ m.planName || m.planCode }} <span class="muted ad-mono">({{ m.planCode }})</span></span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.subPrice' | transloco }}</span><span class="kv__v ad-mono">{{ money(m.pricePaid, m.currency) }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.subStarted' | transloco }}</span><span class="kv__v ad-mono">{{ dt(m.startedAt) }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.subRenews' | transloco }}</span><span class="kv__v ad-mono">{{ dt(m.renewsAt) }}</span></div>
          @if (m.cancelledAt) { <div class="kv__row"><span class="kv__k">{{ 'admin.subCancelled' | transloco }}</span><span class="kv__v ad-mono">{{ dt(m.cancelledAt) }}</span></div> }
          <div class="kv__row"><span class="kv__k">{{ 'admin.thCreated' | transloco }}</span><span class="kv__v ad-mono">{{ dt(m.createdAt) }}</span></div>
        </div>
      }
    </admin-drawer>
  `,
})
export class AdminSubscriptionsComponent {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly t = inject(TranslocoService);

  readonly pageSize = PAGE_SIZE;
  readonly statusTone = statusTone;
  readonly money = money;

  readonly rows = signal<AdminSubscription[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');
  readonly s = signal<ListState>({ page: 0, sortKey: null, sortDir: 'asc', q: '', status: '', filters: {} });
  readonly detail = signal<AdminSubscription | null>(null);
  readonly detailOpen = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(pm => { this.s.set(parseListState(pm)); this.load(); });
  }

  statusOpts(): UiSelectOption[] {
    return STATUSES.map(st => ({ value: st, label: st || this.t.translate('admin.payAllStatuses') }));
  }
  columns(): TableColumn[] {
    return [
      { key: 'userEmail', label: this.t.translate('admin.subMember'), kind: 'custom' },
      { key: 'planName', label: this.t.translate('admin.subPlan'), kind: 'custom' },
      { key: 'pricePaid', label: this.t.translate('admin.subPrice'), kind: 'currency', currencyKey: 'currency', align: 'right' },
      { key: 'status', label: this.t.translate('admin.thStatus'), kind: 'custom' },
      { key: 'startedAt', label: this.t.translate('admin.subStarted'), kind: 'date' },
      { key: 'renewsAt', label: this.t.translate('admin.subRenews'), kind: 'date' },
    ];
  }

  load(): void {
    const s = this.s();
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    this.admin.subscriptions(s.page, this.pageSize, s.status).pipe(catchError(() => of(null))).subscribe(res => {
      this.loading.set(false);
      if (!res) { this.state.set('error'); return; }
      this.rows.set(res.content ?? []);
      this.total.set(res.page?.totalElements ?? 0);
      this.state.set((res.content ?? []).length ? 'ready' : 'empty');
    });
  }

  private patch(partial: Partial<ListState>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: buildListParams({ ...this.s(), ...partial }) });
  }
  onPage(p: number): void { this.patch({ page: p }); }
  setStatus(status: string): void { this.patch({ status, page: 0 }); }
  clearFilters(): void { this.router.navigate([], { relativeTo: this.route, queryParams: {} }); }

  openDetail(m: AdminSubscription): void { this.detail.set(m); this.detailOpen.set(true); }
  goMember(email: string | null): void {
    if (email) this.router.navigate(['/admin', 'users'], { queryParams: { q: email } });
  }
  dt(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  }
}
