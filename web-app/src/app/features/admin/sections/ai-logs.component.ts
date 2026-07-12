import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, AdminAiLog } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { parseListState, buildListParams, ListState, PAGE_SIZE } from '../state/list-query';

/** AI request logs: agent/model/latency/tokens/result monitor. */
@Component({
  selector: 'app-admin-ai-logs',
  standalone: true,
  imports: [
    TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminStatusBadgeComponent, AdminDrawerComponent,
  ],
  styleUrls: ['./section-shared.scss'],
  template: `
    <admin-section eyebrow="05 / SYSTEM" [title]="'admin.navLogs' | transloco" [count]="total()"
                   [state]="state()" (retry)="load()">
      <admin-data-table
        [columns]="columns()" [rows]="rows()" [total]="total()" [page]="s().page" [size]="pageSize"
        [loading]="loading()" [rowClickable]="true" (rowClick)="openDetail($any($event))" (pageChange)="onPage($event)">
        <ng-template adCell="error" let-l>
          <admin-status-badge [tone]="l.error ? 'danger' : 'ok'">{{ (l.error ? 'admin.error' : 'admin.ok') | transloco }}</admin-status-badge>
        </ng-template>
        <ng-template adCell="durationMs" let-l>
          <span class="ad-mono">{{ l.durationMs != null ? l.durationMs + ' ms' : '—' }}</span>
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="detailOpen()" eyebrow="AI LOG" [width]="440"
                  [title]="detail()?.agent || ''" (closed)="detailOpen.set(false)">
      @if (detail(); as l) {
        <div class="kv">
          <div class="kv__row"><span class="kv__k">{{ 'admin.thResult' | transloco }}</span>
            <span class="kv__v"><admin-status-badge [tone]="l.error ? 'danger' : 'ok'">{{ (l.error ? 'admin.error' : 'admin.ok') | transloco }}</admin-status-badge></span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thModel' | transloco }}</span><span class="kv__v ad-mono">{{ l.model || '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thDuration' | transloco }}</span><span class="kv__v ad-mono">{{ l.durationMs != null ? l.durationMs + ' ms' : '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thTokens' | transloco }}</span><span class="kv__v ad-mono">{{ l.tokensUsed ?? '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.logRequestId' | transloco }}</span><span class="kv__v ad-mono">{{ l.requestId || '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thWhen' | transloco }}</span><span class="kv__v ad-mono">{{ dt(l.createdAt) }}</span></div>
        </div>
      }
    </admin-drawer>
  `,
})
export class AdminAiLogsComponent {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly t = inject(TranslocoService);

  readonly pageSize = PAGE_SIZE;
  readonly rows = signal<AdminAiLog[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');
  readonly s = signal<ListState>({ page: 0, sortKey: null, sortDir: 'asc', q: '', status: '', filters: {} });
  readonly detail = signal<AdminAiLog | null>(null);
  readonly detailOpen = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(pm => { this.s.set(parseListState(pm)); this.load(); });
  }

  columns(): TableColumn[] {
    return [
      { key: 'agent', label: this.t.translate('admin.thAgent'), kind: 'text' },
      { key: 'model', label: this.t.translate('admin.thModel'), kind: 'mono' },
      { key: 'durationMs', label: this.t.translate('admin.thDuration'), kind: 'custom', align: 'right' },
      { key: 'tokensUsed', label: this.t.translate('admin.thTokens'), kind: 'mono', align: 'right' },
      { key: 'error', label: this.t.translate('admin.thResult'), kind: 'custom' },
      { key: 'createdAt', label: this.t.translate('admin.thWhen'), kind: 'datetime' },
    ];
  }

  load(): void {
    const s = this.s();
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    this.admin.aiLogs(s.page, this.pageSize).pipe(catchError(() => of(null))).subscribe(res => {
      this.loading.set(false);
      if (!res) { this.state.set('error'); return; }
      this.rows.set(res.content ?? []);
      this.total.set(res.page?.totalElements ?? 0);
      this.state.set((res.content ?? []).length ? 'ready' : 'empty');
    });
  }

  onPage(p: number): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: buildListParams({ ...this.s(), page: p }) });
  }

  openDetail(l: AdminAiLog): void { this.detail.set(l); this.detailOpen.set(true); }
  dt(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
  }
}
