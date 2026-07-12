import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PartnerService, PartnerSummary, PartnerDetail, PartnerType, PartnerStatus,
  RegisterPartnerRequest, ConfigurePartnerRequest,
} from '../../../core/services/partner.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { UiSelectComponent, UiSelectOption } from '../../../shared/ui/ui-select.component';
import { UiInputComponent } from '../../../shared/ui/ui-input.component';
import { AdminToastService } from '../ui/admin-toast.service';
import { AdminConfirmService } from '../ui/admin-confirm.service';
import { statusTone } from '../ui/admin-status.util';
import { parseListState, buildListParams, ListState, PAGE_SIZE } from '../state/list-query';

const TYPES: PartnerType[] = ['HOTEL', 'RESTAURANT', 'CAR_RENTAL', 'BEACH', 'OTHER'];
const LIFECYCLE: PartnerStatus[] = ['REGISTERED', 'CONFIGURED', 'VALIDATED', 'LIVE'];
const SEARCH_DEBOUNCE_MS = 300;

function emptyRegisterForm(): RegisterPartnerRequest {
  return { type: '', name: '', vatNumber: '', contactEmail: '', contactPhone: '', address: '', city: '', country: '' };
}
function configFromDetail(d: PartnerDetail): ConfigurePartnerRequest {
  return {
    address: d.address ?? '', city: d.city ?? '', country: d.country ?? '',
    latitude: d.latitude, longitude: d.longitude, contactPhone: d.contactPhone ?? '',
  };
}

/**
 * Partner onboarding: the register → configure → validate → go-live lifecycle
 * exposed by `PartnerController`, plus a suspend escape hatch. Distinct from
 * the generic "Partners" directory CRUD (`/admin/partners`) — this section
 * drives the actual approval workflow partners go through before they're
 * bookable.
 */
@Component({
  selector: 'app-admin-partner-onboarding',
  standalone: true,
  imports: [
    FormsModule, TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminDrawerComponent, AdminStatusBadgeComponent,
    UiSelectComponent, UiInputComponent,
  ],
  styleUrls: ['./section-shared.scss', './partner-onboarding.component.scss'],
  template: `
    <admin-section eyebrow="PEOPLE / ONBOARDING" [title]="'admin.navPartnerOnboarding' | transloco" [count]="total()"
                   [state]="state()" (retry)="load()">
      <div slot="toolbar" class="sec-tools">
        <app-ui-input class="sec-search" variant="search" type="search" icon="search"
                      [ngModel]="s().q" (ngModelChange)="onSearch($event)"
                      [placeholder]="'admin.searchPlaceholder' | transloco" />
        <div class="sec-field">
          <app-ui-select [options]="typeFilterOpts()" [ngModel]="s().filters['type'] || ''"
                         (ngModelChange)="setType($any($event))" [ariaLabel]="'admin.cType' | transloco" />
        </div>
        @if (hasActiveFilters()) {
          <button type="button" class="sec-btn sec-btn--ghost" (click)="clearFilters()">
            <span class="ad-ms">filter_alt_off</span> {{ 'admin.clearFilters' | transloco }}
          </button>
        }
        <button type="button" class="sec-btn sec-btn--primary" (click)="openCreate()">
          <span class="ad-ms">add_business</span> {{ 'admin.poRegisterPartner' | transloco }}
        </button>
      </div>

      <admin-data-table
        [columns]="columns()" [rows]="rows()" [total]="total()" [page]="s().page" [size]="pageSize"
        [sortKey]="s().sortKey" [sortDir]="s().sortDir" [loading]="loading()"
        [rowClickable]="true" (rowClick)="openDetail($any($event).id)"
        (sortChange)="onSort($event)" (pageChange)="onPage($event)">

        <ng-template adCell="status" let-p>
          <admin-status-badge [tone]="statusTone(p.status)">{{ p.status }}</admin-status-badge>
        </ng-template>

        <ng-template adCell="actions" let-p>
          <div class="row-actions">
            <button type="button" class="ra" (click)="openDetail(p.id)" [title]="'admin.poConfigure' | transloco"><span class="ad-ms">tune</span></button>
            @if (p.status === 'CONFIGURED') {
              <button type="button" class="ra" [disabled]="busyIds().has(p.id)" (click)="quickValidate(p)" [title]="'admin.poValidate' | transloco"><span class="ad-ms">check_circle</span></button>
            }
            @if (p.status === 'VALIDATED') {
              <button type="button" class="ra" [disabled]="busyIds().has(p.id)" (click)="quickGoLive(p)" [title]="'admin.poGoLive' | transloco"><span class="ad-ms">rocket_launch</span></button>
            }
            @if (p.status !== 'SUSPENDED') {
              <button type="button" class="ra ra--danger" [disabled]="busyIds().has(p.id)" (click)="quickSuspend(p)" [title]="'admin.suspend' | transloco"><span class="ad-ms">pause_circle</span></button>
            }
          </div>
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="detailOpen()" [width]="560" eyebrow="PARTNER"
                  [title]="detail()?.name || ('admin.poConfigure' | transloco)" (closed)="closeDetail()">
      @if (detail(); as d) {
        <div class="po">
          <div class="po-status">
            <admin-status-badge [tone]="statusTone(d.status)">{{ d.status }}</admin-status-badge>
            @if (d.qualityScore !== null) { <span class="po-score ad-mono">{{ 'admin.poQualityScore' | transloco }}: {{ d.qualityScore }}</span> }
          </div>

          <ol class="po-timeline" [attr.data-suspended]="d.status === 'SUSPENDED'">
            @for (step of lifecycle; track step; let i = $index) {
              <li class="po-tl__step" [class.po-tl__step--done]="stepReached(d.status, i)"
                  [class.po-tl__step--current]="d.status === step">
                <span class="po-tl__dot"></span>
                <span class="po-tl__lbl ad-mono">{{ step }}</span>
              </li>
            }
            @if (d.status === 'SUSPENDED') { <li class="po-tl__step po-tl__step--suspended"><span class="po-tl__dot"></span><span class="po-tl__lbl ad-mono">SUSPENDED</span></li> }
          </ol>

          <section class="po-card">
            <h3 class="po-h"><span class="ad-ms">store</span> {{ 'admin.poContact' | transloco }}</h3>
            <div class="kv">
              <div class="kv__row"><span class="kv__k">{{ 'admin.fType' | transloco }}</span><span class="kv__v">{{ d.type }}</span></div>
              <div class="kv__row"><span class="kv__k">{{ 'admin.fEmail' | transloco }}</span><span class="kv__v ad-mono">{{ d.contactEmail }}</span></div>
              <div class="kv__row"><span class="kv__k">{{ 'admin.fVat' | transloco }}</span><span class="kv__v">{{ d.vatNumber || '—' }}</span></div>
              <div class="kv__row"><span class="kv__k">{{ 'admin.thCreated' | transloco }}</span><span class="kv__v ad-mono">{{ date(d.createdAt) }}</span></div>
            </div>
          </section>

          <section class="po-card">
            <h3 class="po-h"><span class="ad-ms">tune</span> {{ 'admin.poConfiguration' | transloco }}</h3>
            <div class="form-grid">
              <label class="fld fld--full"><span class="fld__l">{{ 'admin.fAddress' | transloco }}</span>
                <app-ui-input [(ngModel)]="configForm.address" [ariaLabel]="'admin.fAddress' | transloco" /></label>
              <label class="fld"><span class="fld__l">{{ 'admin.fCity' | transloco }} *</span>
                <app-ui-input [(ngModel)]="configForm.city" [ariaLabel]="'admin.fCity' | transloco" /></label>
              <label class="fld"><span class="fld__l">{{ 'admin.fCountry' | transloco }}</span>
                <app-ui-input [(ngModel)]="configForm.country" [ariaLabel]="'admin.fCountry' | transloco" /></label>
              <label class="fld"><span class="fld__l">{{ 'admin.fPhone' | transloco }}</span>
                <app-ui-input [(ngModel)]="configForm.contactPhone" [ariaLabel]="'admin.fPhone' | transloco" /></label>
              <label class="fld"><span class="fld__l">{{ 'admin.fLatitude' | transloco }}</span>
                <app-ui-input type="number" step="any" [(ngModel)]="configForm.latitude" [ariaLabel]="'admin.fLatitude' | transloco" /></label>
              <label class="fld"><span class="fld__l">{{ 'admin.fLongitude' | transloco }}</span>
                <app-ui-input type="number" step="any" [(ngModel)]="configForm.longitude" [ariaLabel]="'admin.fLongitude' | transloco" /></label>
            </div>
            @if (configError()) { <p class="form-err">{{ configError() }}</p> }
            <div class="po-card__actions">
              <button type="button" class="sec-btn sec-btn--primary" [disabled]="configSaving()" (click)="saveConfig(d)">
                {{ (configSaving() ? 'admin.saving' : 'admin.save') | transloco }}
              </button>
            </div>
          </section>

          <div class="po-lifecycle-actions">
            @if (d.status === 'CONFIGURED') {
              <button type="button" class="sec-btn sec-btn--primary" [disabled]="detailBusy()" (click)="validate(d)">
                <span class="ad-ms">check_circle</span> {{ 'admin.poValidate' | transloco }}
              </button>
            }
            @if (d.status === 'VALIDATED') {
              <button type="button" class="sec-btn sec-btn--primary" [disabled]="detailBusy()" (click)="goLive(d)">
                <span class="ad-ms">rocket_launch</span> {{ 'admin.poGoLive' | transloco }}
              </button>
            }
            @if (d.status !== 'SUSPENDED') {
              <button type="button" class="sec-btn" [disabled]="detailBusy()" (click)="suspend(d)">
                <span class="ad-ms">pause_circle</span> {{ 'admin.suspend' | transloco }}
              </button>
            }
          </div>
        </div>
      } @else {
        <div class="po-loading">{{ 'admin.loading' | transloco }}</div>
      }
    </admin-drawer>

    <admin-drawer [open]="createOpen()" [title]="'admin.poRegisterPartner' | transloco"
                  eyebrow="PARTNER" (closed)="createOpen.set(false)">
      <div class="form-grid">
        <label class="fld"><span class="fld__l">{{ 'admin.fType' | transloco }} *</span>
          <app-ui-select [options]="typeOpts()" [(ngModel)]="createForm.type" placeholder="—" [ariaLabel]="'admin.fType' | transloco" /></label>
        <label class="fld"><span class="fld__l">{{ 'admin.fName' | transloco }} *</span>
          <app-ui-input [(ngModel)]="createForm.name" [ariaLabel]="'admin.fName' | transloco" /></label>
        <label class="fld"><span class="fld__l">{{ 'admin.fEmail' | transloco }} *</span>
          <app-ui-input type="email" [(ngModel)]="createForm.contactEmail" [ariaLabel]="'admin.fEmail' | transloco" /></label>
        <label class="fld"><span class="fld__l">{{ 'admin.fPhone' | transloco }}</span>
          <app-ui-input [(ngModel)]="createForm.contactPhone" [ariaLabel]="'admin.fPhone' | transloco" /></label>
        <label class="fld"><span class="fld__l">{{ 'admin.fVat' | transloco }}</span>
          <app-ui-input [(ngModel)]="createForm.vatNumber" [ariaLabel]="'admin.fVat' | transloco" /></label>
        <label class="fld"><span class="fld__l">{{ 'admin.fCity' | transloco }} *</span>
          <app-ui-input [(ngModel)]="createForm.city" [ariaLabel]="'admin.fCity' | transloco" /></label>
        <label class="fld fld--full"><span class="fld__l">{{ 'admin.fAddress' | transloco }}</span>
          <app-ui-input [(ngModel)]="createForm.address" [ariaLabel]="'admin.fAddress' | transloco" /></label>
        <label class="fld"><span class="fld__l">{{ 'admin.fCountry' | transloco }}</span>
          <app-ui-input [(ngModel)]="createForm.country" [ariaLabel]="'admin.fCountry' | transloco" /></label>
      </div>
      @if (createError()) { <p class="form-err">{{ createError() }}</p> }
      <div slot="actions">
        <button type="button" class="sec-btn sec-btn--primary" [disabled]="createSaving()" (click)="register()">
          {{ (createSaving() ? 'admin.saving' : 'admin.save') | transloco }}
        </button>
      </div>
    </admin-drawer>
  `,
})
export class AdminPartnerOnboardingComponent {
  private readonly api = inject(PartnerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(AdminToastService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly t = inject(TranslocoService);

  readonly pageSize = PAGE_SIZE;
  readonly lifecycle = LIFECYCLE;
  readonly statusTone = statusTone;

  readonly rows = signal<PartnerSummary[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');
  readonly s = signal<ListState>({ page: 0, sortKey: null, sortDir: 'asc', q: '', status: '', filters: {} });
  readonly busyIds = signal<Set<string>>(new Set());

  readonly detailOpen = signal(false);
  readonly detail = signal<PartnerDetail | null>(null);
  readonly detailBusy = signal(false);
  configForm: ConfigurePartnerRequest = { address: '', city: '', country: '', latitude: null, longitude: null, contactPhone: '' };
  readonly configSaving = signal(false);
  readonly configError = signal('');

  readonly createOpen = signal(false);
  readonly createSaving = signal(false);
  readonly createError = signal('');
  createForm: RegisterPartnerRequest = emptyRegisterForm();

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(pm => {
      this.s.set(parseListState(pm));
      this.load();
    });
  }

  typeOpts(): UiSelectOption[] { return TYPES.map(v => ({ value: v, label: v })); }
  typeFilterOpts(): UiSelectOption[] {
    return [{ value: '', label: this.t.translate('admin.poAllTypes') }, ...this.typeOpts()];
  }

  columns(): TableColumn[] {
    return [
      { key: 'name', label: this.t.translate('admin.cName'), sortable: true },
      { key: 'type', label: this.t.translate('admin.cType'), kind: 'badge' },
      { key: 'city', label: this.t.translate('admin.cCity'), sortable: true },
      { key: 'status', label: this.t.translate('admin.thStatus'), kind: 'custom' },
    ];
  }

  load(): void {
    const s = this.s();
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    const type = (s.filters['type'] as PartnerType | undefined) ?? '';
    this.api.list(s.page, this.pageSize, type, s.sortKey, s.sortDir)
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.loading.set(false);
        if (!res) { this.state.set('error'); return; }
        const content = this.filterByQuery(res.content ?? [], s.q);
        this.rows.set(content);
        this.total.set(res.page?.totalElements ?? 0);
        this.state.set(content.length ? 'ready' : 'empty');
      });
  }

  /** The list endpoint has no free-text search — filter the current page client-side. */
  private filterByQuery(rows: PartnerSummary[], q: string): PartnerSummary[] {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(r => r.name.toLowerCase().includes(needle) || (r.city ?? '').toLowerCase().includes(needle));
  }

  private patch(partial: Partial<ListState>): void {
    const next: ListState = { ...this.s(), ...partial };
    this.router.navigate([], { relativeTo: this.route, queryParams: buildListParams(next) });
  }
  onSort(e: { key: string; dir: 'asc' | 'desc' }): void { this.patch({ sortKey: e.key, sortDir: e.dir, page: 0 }); }
  onPage(p: number): void { this.patch({ page: p }); }
  onSearch(q: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.patch({ q, page: 0 }), SEARCH_DEBOUNCE_MS);
  }
  setType(type: string): void {
    const filters = { ...this.s().filters };
    if (type) filters['type'] = type; else delete filters['type'];
    this.patch({ filters, page: 0 });
  }
  hasActiveFilters(): boolean { const s = this.s(); return !!(s.q || Object.keys(s.filters).length); }
  clearFilters(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  // ── Detail drawer ───────────────────────────────────────────────────────
  openDetail(id: string): void {
    this.detail.set(null);
    this.detailOpen.set(true);
    this.configError.set('');
    this.api.getById(id).pipe(catchError(() => of(null))).subscribe(d => {
      if (!d) { this.detailOpen.set(false); this.toast.error(this.t.translate('admin.loadFailed')); return; }
      this.detail.set(d);
      this.configForm = configFromDetail(d);
    });
  }
  closeDetail(): void { this.detailOpen.set(false); this.detail.set(null); }

  private applyUpdate(updated: PartnerDetail): void {
    this.detail.set(updated);
    this.rows.update(list => list.map(r => r.id === updated.id ? { ...r, status: updated.status } : r));
  }

  saveConfig(d: PartnerDetail): void {
    if (!this.configForm.city.trim()) {
      this.configError.set(this.t.translate('admin.fieldRequired', { field: this.t.translate('admin.fCity') }));
      return;
    }
    this.configSaving.set(true); this.configError.set('');
    this.api.configure(d.id, this.configForm).pipe(catchError(() => { this.configError.set(this.t.translate('admin.saveFailed')); return of(null); }))
      .subscribe(updated => {
        this.configSaving.set(false);
        if (!updated) return;
        this.applyUpdate(updated);
        this.toast.ok(this.t.translate('admin.poConfigured'));
      });
  }

  validate(d: PartnerDetail): void {
    this.detailBusy.set(true);
    this.api.validate(d.id).pipe(catchError(() => of(null))).subscribe(updated => {
      this.detailBusy.set(false);
      if (!updated) { this.toast.error(this.t.translate('admin.saveFailed')); return; }
      this.applyUpdate(updated);
      this.toast.ok(this.t.translate('admin.poValidated'));
    });
  }

  goLive(d: PartnerDetail): void {
    this.detailBusy.set(true);
    this.api.goLive(d.id).pipe(catchError(() => of(null))).subscribe(updated => {
      this.detailBusy.set(false);
      if (!updated) { this.toast.error(this.t.translate('admin.saveFailed')); return; }
      this.applyUpdate(updated);
      this.toast.ok(this.t.translate('admin.poLive'));
    });
  }

  async suspend(d: PartnerDetail): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.suspend'), message: this.t.translate('admin.poSuspendConfirm', { name: d.name }),
      confirmLabel: this.t.translate('admin.suspend'), cancelLabel: this.t.translate('admin.cancel'), tone: 'danger',
    });
    if (!ok) return;
    this.detailBusy.set(true);
    this.api.suspend(d.id).pipe(catchError(() => of(null))).subscribe(res => {
      this.detailBusy.set(false);
      if (res === undefined) {
        this.applyUpdate({ ...d, status: 'SUSPENDED', active: false });
        this.toast.ok(this.t.translate('admin.partnerSuspended'));
      } else {
        this.toast.error(this.t.translate('admin.saveFailed'));
      }
    });
  }

  // ── Row quick actions (table) ───────────────────────────────────────────
  private withBusy(id: string, fn: () => void): void {
    this.busyIds.update(s => new Set(s).add(id));
    fn();
  }
  private clearBusy(id: string): void {
    this.busyIds.update(s => { const next = new Set(s); next.delete(id); return next; });
  }
  quickValidate(p: PartnerSummary): void {
    this.withBusy(p.id, () => this.api.validate(p.id).pipe(catchError(() => of(null))).subscribe(updated => {
      this.clearBusy(p.id);
      if (!updated) { this.toast.error(this.t.translate('admin.saveFailed')); return; }
      this.rows.update(list => list.map(r => r.id === p.id ? { ...r, status: updated.status } : r));
      this.toast.ok(this.t.translate('admin.poValidated'));
    }));
  }
  quickGoLive(p: PartnerSummary): void {
    this.withBusy(p.id, () => this.api.goLive(p.id).pipe(catchError(() => of(null))).subscribe(updated => {
      this.clearBusy(p.id);
      if (!updated) { this.toast.error(this.t.translate('admin.saveFailed')); return; }
      this.rows.update(list => list.map(r => r.id === p.id ? { ...r, status: updated.status } : r));
      this.toast.ok(this.t.translate('admin.poLive'));
    }));
  }
  async quickSuspend(p: PartnerSummary): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.suspend'), message: this.t.translate('admin.poSuspendConfirm', { name: p.name }),
      confirmLabel: this.t.translate('admin.suspend'), cancelLabel: this.t.translate('admin.cancel'), tone: 'danger',
    });
    if (!ok) return;
    this.withBusy(p.id, () => this.api.suspend(p.id).pipe(catchError(() => of(null))).subscribe(res => {
      this.clearBusy(p.id);
      if (res !== undefined) { this.toast.error(this.t.translate('admin.saveFailed')); return; }
      this.rows.update(list => list.map(r => r.id === p.id ? { ...r, status: 'SUSPENDED' as PartnerStatus, active: false } : r));
      this.toast.ok(this.t.translate('admin.partnerSuspended'));
    }));
  }

  // ── Create / register ────────────────────────────────────────────────────
  openCreate(): void { this.createError.set(''); this.createForm = emptyRegisterForm(); this.createOpen.set(true); }
  register(): void {
    const f = this.createForm;
    if (!f.type || !f.name.trim() || !f.contactEmail.trim() || !f.city.trim()) {
      this.createError.set(this.t.translate('admin.saveFailed'));
      return;
    }
    this.createSaving.set(true); this.createError.set('');
    this.api.register(f).pipe(catchError(() => { this.createError.set(this.t.translate('admin.saveFailed')); return of(null); }))
      .subscribe(res => {
        this.createSaving.set(false);
        if (!res) return;
        this.createOpen.set(false);
        this.toast.ok(this.t.translate('admin.poRegistered'));
        this.load();
      });
  }

  stepReached(status: PartnerStatus, i: number): boolean {
    const idx = LIFECYCLE.indexOf(status);
    return idx >= 0 && i <= idx;
  }
  date(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  }
}
