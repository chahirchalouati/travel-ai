import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, AdminAuditLog } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { parseListState, buildListParams, ListState, PAGE_SIZE } from '../state/list-query';

/** Audit trail: server-filtered by actor/action, read-only. */
@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [
    TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminStatusBadgeComponent, AdminDrawerComponent,
  ],
  styleUrls: ['./section-shared.scss'],
  template: `
    <admin-section eyebrow="05 / SYSTEM" [title]="'admin.navAudit' | transloco" [count]="total()"
                   [state]="state()" (retry)="load()">
      @if (hasActiveFilters()) {
        <div slot="toolbar" class="sec-tools">
          <button type="button" class="sec-btn sec-btn--ghost" (click)="clearFilters()">
            <span class="ad-ms">filter_alt_off</span> {{ 'admin.clearFilters' | transloco }}
          </button>
        </div>
      }
      <admin-data-table
        [columns]="columns()" [rows]="rows()" [total]="total()" [page]="s().page" [size]="pageSize"
        [loading]="loading()" [filterable]="true" [filters]="s().filters"
        [rowClickable]="true" (rowClick)="openDetail($any($event))"
        (pageChange)="onPage($event)" (filterChange)="onFilter($event)">
        <ng-template adCell="action" let-a>
          <admin-status-badge tone="neutral" [dot]="false">{{ a.action }}</admin-status-badge>
        </ng-template>
        <ng-template adCell="statusCode" let-a>
          <admin-status-badge [tone]="a.statusCode < 400 ? 'ok' : 'danger'">{{ a.statusCode }}</admin-status-badge>
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="detailOpen()" eyebrow="AUDIT" [width]="460"
                  [title]="detail()?.action || ''" (closed)="detailOpen.set(false)">
      @if (detail(); as a) {
        <div class="kv">
          <div class="kv__row"><span class="kv__k">{{ 'admin.thResult' | transloco }}</span>
            <span class="kv__v"><admin-status-badge [tone]="a.statusCode < 400 ? 'ok' : 'danger'">{{ a.statusCode }}</admin-status-badge></span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thActor' | transloco }}</span><span class="kv__v">{{ a.actor }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thMethod' | transloco }}</span><span class="kv__v ad-mono">{{ a.method }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.auditPath' | transloco }}</span><span class="kv__v ad-mono">{{ a.path }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thTarget' | transloco }}</span><span class="kv__v ad-mono">{{ a.targetId || '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thIp' | transloco }}</span><span class="kv__v ad-mono">{{ a.ip || '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thWhen' | transloco }}</span><span class="kv__v ad-mono">{{ dt(a.createdAt) }}</span></div>
        </div>
      }
    </admin-drawer>
  `,
})
export class AdminAuditComponent {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly t = inject(TranslocoService);

  readonly pageSize = PAGE_SIZE;
  readonly rows = signal<AdminAuditLog[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');
  readonly s = signal<ListState>({ page: 0, sortKey: null, sortDir: 'asc', q: '', status: '', filters: {} });
  readonly detail = signal<AdminAuditLog | null>(null);
  readonly detailOpen = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(pm => { this.s.set(parseListState(pm)); this.load(); });
  }

  columns(): TableColumn[] {
    return [
      { key: 'createdAt', label: this.t.translate('admin.thWhen'), kind: 'datetime' },
      { key: 'actor', label: this.t.translate('admin.thActor'), kind: 'text', filter: 'text' },
      { key: 'action', label: this.t.translate('admin.thAction'), kind: 'custom', filter: 'text' },
      { key: 'method', label: this.t.translate('admin.thMethod'), kind: 'mono' },
      { key: 'targetId', label: this.t.translate('admin.thTarget'), kind: 'mono' },
      { key: 'statusCode', label: this.t.translate('admin.thResult'), kind: 'custom' },
      { key: 'ip', label: this.t.translate('admin.thIp'), kind: 'mono' },
    ];
  }

  load(): void {
    const s = this.s();
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    this.admin.auditLogs(s.page, this.pageSize, s.filters['actor'] ?? '', s.filters['action'] ?? '')
      .pipe(catchError(() => of(null))).subscribe(res => {
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
  onFilter(filters: Record<string, string>): void { this.patch({ filters, page: 0 }); }
  hasActiveFilters(): boolean { return Object.keys(this.s().filters).length > 0; }
  clearFilters(): void { this.router.navigate([], { relativeTo: this.route, queryParams: {} }); }

  openDetail(a: AdminAuditLog): void { this.detail.set(a); this.detailOpen.set(true); }
  dt(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
  }
}
