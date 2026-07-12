import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, AdminPayment } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { UiSelectComponent, UiSelectOption } from '../../../shared/ui/ui-select.component';
import { AdminToastService } from '../ui/admin-toast.service';
import { AdminConfirmService } from '../ui/admin-confirm.service';
import { statusTone } from '../ui/admin-status.util';
import { money } from '../state/format';
import { parseListState, buildListParams, ListState, PAGE_SIZE } from '../state/list-query';

const STATUSES = ['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

/** Payments: status-filtered ledger with guarded refunds. */
@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [
    FormsModule, TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminStatusBadgeComponent, AdminDrawerComponent, UiSelectComponent,
  ],
  styleUrls: ['./section-shared.scss'],
  template: `
    <admin-section eyebrow="03 / OPERATIONS" [title]="'admin.navPayments' | transloco" [count]="total()"
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

        <ng-template adCell="bookingId" let-p>
          <button type="button" class="pay-link ad-mono" (click)="$event.stopPropagation(); goBooking(p.bookingId)">
            <span class="ad-ms">confirmation_number</span> {{ p.bookingId.slice(0, 8) }}
          </button>
        </ng-template>
        <ng-template adCell="status" let-p>
          <admin-status-badge [tone]="statusTone(p.status)">{{ p.status }}</admin-status-badge>
        </ng-template>

        <ng-template adCell="actions" let-p>
          <div class="row-actions">
            @if (p.status === 'COMPLETED') {
              <button type="button" class="ra ra--danger" (click)="refund(p)" [title]="'admin.refund' | transloco"><span class="ad-ms">undo</span></button>
            } @else if (p.status === 'REFUNDED') {
              <span class="muted">{{ 'admin.refunded' | transloco }}</span>
            } @else { <span class="muted">—</span> }
          </div>
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="detailOpen()" eyebrow="PAYMENT" [width]="440"
                  [title]="detail() ? money(detail()!.amount, detail()!.currency) : ''" (closed)="detailOpen.set(false)">
      @if (detail(); as p) {
        <div class="kv">
          <div class="kv__row"><span class="kv__k">{{ 'admin.thStatus' | transloco }}</span>
            <span class="kv__v"><admin-status-badge [tone]="statusTone(p.status)">{{ p.status }}</admin-status-badge></span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.payType' | transloco }}</span><span class="kv__v">{{ p.type || '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.payGateway' | transloco }}</span><span class="kv__v">{{ p.gateway || '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.payReference' | transloco }}</span><span class="kv__v ad-mono">{{ p.gatewayReference || '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.thUser' | transloco }}</span><span class="kv__v">{{ p.userEmail || '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">{{ 'admin.payLinkedTo' | transloco }}</span>
            <span class="kv__v"><button type="button" class="pay-link ad-mono" (click)="goBooking(p.bookingId)">
              <span class="ad-ms">confirmation_number</span> {{ 'admin.navBookings' | transloco }} · {{ p.bookingId.slice(0, 8) }}
            </button></span></div>
          @if (p.failureReason) { <div class="kv__row"><span class="kv__k">{{ 'admin.payFailure' | transloco }}</span><span class="kv__v">{{ p.failureReason }}</span></div> }
          <div class="kv__row"><span class="kv__k">{{ 'admin.thCreated' | transloco }}</span><span class="kv__v ad-mono">{{ dt(p.createdAt) }}</span></div>
          @if (p.paidAt) { <div class="kv__row"><span class="kv__k">{{ 'admin.payPaidAt' | transloco }}</span><span class="kv__v ad-mono">{{ dt(p.paidAt) }}</span></div> }
          @if (p.refundedAt) { <div class="kv__row"><span class="kv__k">{{ 'admin.refunded' | transloco }}</span><span class="kv__v ad-mono">{{ dt(p.refundedAt) }}</span></div> }
        </div>
      }
      @if (detail()?.status === 'COMPLETED') {
        <button type="button" slot="actions" class="sec-btn" (click)="refund(detail()!)"><span class="ad-ms">undo</span> {{ 'admin.refund' | transloco }}</button>
      }
    </admin-drawer>
  `,
})
export class AdminPaymentsComponent {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(AdminToastService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly t = inject(TranslocoService);

  readonly statuses = STATUSES;
  readonly pageSize = PAGE_SIZE;
  readonly statusTone = statusTone;
  readonly money = money;

  readonly detail = signal<AdminPayment | null>(null);
  readonly detailOpen = signal(false);
  readonly rows = signal<AdminPayment[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');
  readonly s = signal<ListState>({ page: 0, sortKey: null, sortDir: 'asc', q: '', status: '', filters: {} });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(pm => { this.s.set(parseListState(pm)); this.load(); });
  }

  statusOpts(): UiSelectOption[] {
    return STATUSES.map(st => ({ value: st, label: st || this.t.translate('admin.payAllStatuses') }));
  }

  columns(): TableColumn[] {
    return [
      { key: 'createdAt', label: this.t.translate('admin.thCreated'), kind: 'date' },
      { key: 'userEmail', label: this.t.translate('admin.thUser'), kind: 'text' },
      { key: 'bookingId', label: this.t.translate('admin.payLinkedTo'), kind: 'custom' },
      { key: 'amount', label: this.t.translate('admin.thAmount'), kind: 'currency', currencyKey: 'currency', align: 'right' },
      { key: 'gateway', label: this.t.translate('admin.payGateway'), kind: 'text' },
      { key: 'status', label: this.t.translate('admin.thStatus'), kind: 'custom' },
    ];
  }

  load(): void {
    const s = this.s();
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    this.admin.payments(s.page, this.pageSize, s.status).pipe(catchError(() => of(null))).subscribe(res => {
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

  openDetail(p: AdminPayment): void { this.detail.set(p); this.detailOpen.set(true); }
  goBooking(bookingId: string): void { this.router.navigate(['/admin', 'bookings'], { queryParams: { open: bookingId } }); }
  dt(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
  }

  async refund(p: AdminPayment): Promise<void> {
    if (p.status !== 'COMPLETED') return;
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.refund'), message: this.t.translate('admin.refundConfirm'),
      confirmLabel: this.t.translate('admin.refund'), cancelLabel: this.t.translate('admin.cancel'), tone: 'danger',
    });
    if (!ok) return;
    this.admin.refundPayment(p.id).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) { this.rows.update(list => list.map(x => x.id === p.id ? updated : x)); this.toast.ok(this.t.translate('admin.refundDone')); }
      else this.toast.error(this.t.translate('admin.refundFailed'));
    });
  }
}
