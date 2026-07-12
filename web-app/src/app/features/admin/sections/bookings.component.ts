import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, AdminBooking, AdminBookingDetail } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { UiSelectComponent, UiSelectOption } from '../../../shared/ui/ui-select.component';
import { AdminToastService } from '../ui/admin-toast.service';
import { statusTone } from '../ui/admin-status.util';
import { money } from '../state/format';
import { parseListState, buildListParams, ListState, PAGE_SIZE } from '../state/list-query';

const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const TIMELINE = ['PENDING', 'CONFIRMED', 'COMPLETED'];

/** Bookings: operational table + detail drawer with status timeline and inline optimistic status change. */
@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [
    FormsModule, TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminDrawerComponent, AdminStatusBadgeComponent, UiSelectComponent,
  ],
  styleUrls: ['./section-shared.scss', './bookings.component.scss'],
  template: `
    <admin-section eyebrow="03 / OPERATIONS" [title]="'admin.navBookings' | transloco" [count]="total()"
                   [state]="state()" (retry)="load()">
      <admin-data-table
        [columns]="columns()" [rows]="rows()" [total]="total()" [page]="s().page" [size]="pageSize"
        [sortKey]="s().sortKey" [sortDir]="s().sortDir" [loading]="loading()" [rowClickable]="true"
        (sortChange)="onSort($event)" (pageChange)="onPage($event)" (rowClick)="openDetail($any($event).id)">

        <ng-template adCell="status" let-b>
          <app-ui-select class="cell-select" [options]="statusOpts()" [ngModel]="b.status"
                         (ngModelChange)="changeStatus(b, $any($event))" (click)="$event.stopPropagation()"
                         [ariaLabel]="'admin.thStatus' | transloco" />
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="detailOpen()" [width]="540" eyebrow="BOOKING"
                  [title]="detail()?.bookingReference || ('admin.navBookings' | transloco)" (closed)="closeDetail()">
      @if (detail(); as d) {
        <div class="bd">
          <div class="bd-status">
            <admin-status-badge [tone]="statusTone(d.status)">{{ d.status }}</admin-status-badge>
            <span class="bd-total ad-mono">{{ money(d.totalAmount) }}</span>
          </div>

          <ol class="bd-timeline" [attr.data-cancelled]="d.status === 'CANCELLED'">
            @for (step of timeline; track step; let i = $index) {
              <li class="bd-tl__step" [class.bd-tl__step--done]="stepReached(d.status, i)"
                  [class.bd-tl__step--current]="d.status === step">
                <span class="bd-tl__dot"></span>
                <span class="bd-tl__lbl ad-mono">{{ step }}</span>
              </li>
            }
            @if (d.status === 'CANCELLED') { <li class="bd-tl__step bd-tl__step--cancelled"><span class="bd-tl__dot"></span><span class="bd-tl__lbl ad-mono">CANCELLED</span></li> }
          </ol>

          @if (d.user; as u) {
            <section class="bd-card">
              <h3 class="bd-h"><span class="ad-ms">person</span> {{ 'admin.bdCustomer' | transloco }}</h3>
              <div class="bd-kv"><span>{{ u.firstName }} {{ u.lastName }}</span><span class="muted ad-mono">{{ u.email }}</span></div>
              <div class="bd-tags">
                <admin-status-badge tone="neutral" [dot]="false">{{ u.role }}</admin-status-badge>
                <admin-status-badge [tone]="u.active ? 'ok' : 'danger'">{{ (u.active ? 'admin.active' : 'admin.banned') | transloco }}</admin-status-badge>
                <span class="muted">{{ 'admin.bdTotalBookings' | transloco:{ count: d.userTotalBookings } }}</span>
              </div>
            </section>
          }

          <section class="bd-card">
            <h3 class="bd-h"><span class="ad-ms">luggage</span> {{ 'admin.bdTrip' | transloco }}</h3>
            <div class="bd-grid">
              <div><span class="bd-l">{{ 'admin.thDestination' | transloco }}</span><span>{{ d.destination || '—' }}</span></div>
              <div><span class="bd-l">{{ 'admin.bdParty' | transloco }}</span><span>{{ d.partySize ?? '—' }}</span></div>
              <div><span class="bd-l">{{ 'admin.bdCheckIn' | transloco }}</span><span>{{ date(d.checkIn) }}</span></div>
              <div><span class="bd-l">{{ 'admin.bdCheckOut' | transloco }}</span><span>{{ date(d.checkOut) }}</span></div>
            </div>
          </section>

          <section class="bd-card">
            <h3 class="bd-h"><span class="ad-ms">payments</span> {{ 'admin.bdAmounts' | transloco }}</h3>
            <div class="bd-amounts">
              @if (d.hotelAmount) { <div class="bd-amt"><span>{{ 'admin.navHotels' | transloco }}</span><span class="ad-mono">{{ money(d.hotelAmount) }}</span></div> }
              @if (d.flightAmount) { <div class="bd-amt"><span>{{ 'admin.navFlights' | transloco }}</span><span class="ad-mono">{{ money(d.flightAmount) }}</span></div> }
              @if (d.restaurantAmount) { <div class="bd-amt"><span>{{ 'admin.navRestaurants' | transloco }}</span><span class="ad-mono">{{ money(d.restaurantAmount) }}</span></div> }
              @if (d.cruiseAmount) { <div class="bd-amt"><span>{{ 'admin.navCruises' | transloco }}</span><span class="ad-mono">{{ money(d.cruiseAmount) }}</span></div> }
              @if (d.serviceFeeAmount) { <div class="bd-amt"><span>{{ 'admin.bdServiceFee' | transloco }}</span><span class="ad-mono">{{ money(d.serviceFeeAmount) }}</span></div> }
              @if (d.commissionAmount) { <div class="bd-amt muted"><span>{{ 'admin.bdCommission' | transloco }}</span><span class="ad-mono">{{ money(d.commissionAmount) }}</span></div> }
              <div class="bd-amt bd-amt--total"><span>{{ 'admin.thAmount' | transloco }}</span><span class="ad-mono">{{ money(d.totalAmount) }}</span></div>
            </div>
          </section>

          <section class="bd-card">
            <h3 class="bd-h"><span class="ad-ms">receipt_long</span> {{ 'admin.bdPayments' | transloco }} ({{ d.payments.length }})</h3>
            @for (p of d.payments; track p.id) {
              <div class="bd-pay">
                <admin-status-badge [tone]="statusTone(p.status)">{{ p.status }}</admin-status-badge>
                <span class="ad-mono">{{ money(p.amount, p.currency || 'EUR') }}</span>
                <span class="muted">{{ p.gateway || '—' }}</span>
                <span class="muted ad-mono">{{ date(p.createdAt) }}</span>
              </div>
            } @empty { <p class="muted">{{ 'admin.bdNoPayments' | transloco }}</p> }
          </section>

          <div class="bd-change">
            <span class="bd-l">{{ 'admin.thStatus' | transloco }}</span>
            <div class="sec-field">
              <app-ui-select [options]="statusOpts()" [ngModel]="d.status"
                             (ngModelChange)="changeStatusDetail($any($event))" [ariaLabel]="'admin.thStatus' | transloco" />
            </div>
          </div>
        </div>
      } @else {
        <div class="bd-loading">{{ 'admin.loading' | transloco }}</div>
      }
    </admin-drawer>
  `,
})
export class AdminBookingsComponent {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(AdminToastService);
  private readonly t = inject(TranslocoService);

  readonly statuses = STATUSES;
  readonly timeline = TIMELINE;
  readonly pageSize = PAGE_SIZE;
  readonly statusTone = statusTone;
  readonly money = money;

  readonly rows = signal<AdminBooking[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');
  readonly s = signal<ListState>({ page: 0, sortKey: null, sortDir: 'asc', q: '', status: '', filters: {} });

  readonly detail = signal<AdminBookingDetail | null>(null);
  readonly detailOpen = signal(false);
  private openId: string | null = null;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(pm => {
      this.s.set(parseListState(pm));
      this.load();
      const open = pm.get('open');
      if (open && open !== this.openId) this.openDetail(open);
      else if (!open) { this.detailOpen.set(false); this.openId = null; }
    });
  }

  statusOpts(): UiSelectOption[] { return STATUSES.map(st => ({ value: st, label: st })); }

  columns(): TableColumn[] {
    return [
      { key: 'bookingReference', label: this.t.translate('admin.thBookingRef'), sortable: true, kind: 'mono' },
      { key: 'userEmail', label: this.t.translate('admin.thUser'), kind: 'text' },
      { key: 'destination', label: this.t.translate('admin.thDestination'), sortable: true, kind: 'text' },
      { key: 'totalAmount', label: this.t.translate('admin.thAmount'), sortable: true, kind: 'currency', align: 'right' },
      { key: 'createdAt', label: this.t.translate('admin.thCreated'), sortable: true, kind: 'date' },
      { key: 'status', label: this.t.translate('admin.thStatus'), kind: 'custom' },
    ];
  }

  load(): void {
    const s = this.s();
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    this.admin.bookings(s.page, this.pageSize).pipe(catchError(() => of(null))).subscribe(res => {
      this.loading.set(false);
      if (!res) { this.state.set('error'); return; }
      // Sorting is applied client-side because listBookings only accepts pagination.
      const content = this.sortRows(res.content ?? []);
      this.rows.set(content);
      this.total.set(res.page?.totalElements ?? 0);
      this.state.set(content.length ? 'ready' : 'empty');
    });
  }

  private sortRows(rows: AdminBooking[]): AdminBooking[] {
    const key = this.s().sortKey;
    if (!key) return rows;
    const dir = this.s().sortDir === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[key];
      const bv = (b as unknown as Record<string, unknown>)[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
    });
  }

  private patch(partial: Partial<ListState>): void {
    const next: ListState = { ...this.s(), ...partial };
    this.router.navigate([], { relativeTo: this.route, queryParams: { ...buildListParams(next), open: this.openId ?? undefined } });
  }
  onSort(e: { key: string; dir: 'asc' | 'desc' }): void { this.patch({ sortKey: e.key, sortDir: e.dir, page: 0 }); }
  onPage(p: number): void { this.patch({ page: p }); }

  changeStatus(b: AdminBooking, status: string): void {
    if (status === b.status) return;
    const prev = b.status;
    this.rows.update(list => list.map(r => r.id === b.id ? { ...r, status } : r));
    this.admin.setBookingStatus(b.id, status).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) this.toast.ok(this.t.translate('admin.bookingUpdated'));
      else { this.rows.update(list => list.map(r => r.id === b.id ? { ...r, status: prev } : r)); this.toast.error(this.t.translate('admin.saveFailed')); }
    });
  }

  changeStatusDetail(status: string): void {
    const d = this.detail();
    if (!d || status === d.status) return;
    const prev = d.status;
    this.detail.set({ ...d, status });
    this.admin.setBookingStatus(d.id, status).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) {
        this.toast.ok(this.t.translate('admin.bookingUpdated'));
        this.rows.update(list => list.map(r => r.id === d.id ? { ...r, status } : r));
      } else { this.detail.set({ ...d, status: prev }); this.toast.error(this.t.translate('admin.saveFailed')); }
    });
  }

  openDetail(id: string): void {
    this.openId = id;
    this.detail.set(null);
    this.detailOpen.set(true);
    this.admin.bookingDetail(id).pipe(catchError(() => of(null))).subscribe(d => {
      if (d) this.detail.set(d);
      else { this.detailOpen.set(false); this.toast.error(this.t.translate('admin.loadFailed')); }
    });
  }
  closeDetail(): void {
    this.detailOpen.set(false);
    this.openId = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: buildListParams(this.s()) });
  }

  stepReached(status: string | null, i: number): boolean {
    const idx = TIMELINE.indexOf(status ?? '');
    return idx >= 0 && i <= idx;
  }
  date(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  }
}
