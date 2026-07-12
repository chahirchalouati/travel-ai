import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, combineLatest, forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminCatalogService, AdminEntity, PartnerOption } from '../../../core/services/admin-catalog.service';
import { ENTITY_CONFIGS, EntityConfig, ColumnDef, FieldDef } from '../catalog-configs';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { UiSelectComponent, UiSelectOption } from '../../../shared/ui/ui-select.component';
import { UiInputComponent } from '../../../shared/ui/ui-input.component';
import { UiCheckboxComponent } from '../../../shared/ui/ui-checkbox.component';
import { UiDatepickerComponent } from '../../../shared/ui/ui-datepicker.component';
import { AdminToastService } from '../ui/admin-toast.service';
import { AdminConfirmService } from '../ui/admin-confirm.service';
import { ADMIN_NAV_FLAT } from '../admin-nav';
import { parseListState, buildListParams, toListQuery, ListState, PAGE_SIZE } from '../state/list-query';

const EXPORT_SIZE = 1000;
const SEARCH_DEBOUNCE_MS = 300;

/** Schema-driven CRUD for every catalog/partner/promo resource, selected by route data. */
@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [
    FormsModule, TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminDrawerComponent,
    UiSelectComponent, UiInputComponent, UiCheckboxComponent, UiDatepickerComponent,
  ],
  styleUrls: ['./section-shared.scss'],
  template: `
    <admin-section [eyebrow]="eyebrow()" [title]="titleKey() | transloco" [count]="total()"
                   [state]="state()" (retry)="load()">
      <div slot="toolbar" class="sec-tools">
        <app-ui-input class="sec-search" variant="search" type="search" icon="search"
                      [ngModel]="s().q" (ngModelChange)="onSearch($event)"
                      [placeholder]="'admin.searchPlaceholder' | transloco" />
        @if (hasActiveFilters()) {
          <button type="button" class="sec-btn sec-btn--ghost" (click)="clearFilters()">
            <span class="ad-ms">filter_alt_off</span> {{ 'admin.clearFilters' | transloco }}
          </button>
        }
        <button type="button" class="sec-btn" [disabled]="total() === 0 || exporting()" (click)="exportCsv()">
          <span class="ad-ms">download</span> {{ 'admin.exportCsv' | transloco }}
        </button>
        <button type="button" class="sec-btn sec-btn--primary" (click)="openCreate()">
          <span class="ad-ms">add</span> {{ 'admin.addNew' | transloco }}
        </button>
      </div>

      @if (selected().length > 0) {
        <div class="sec-bulk">
          <span class="sec-bulk__count ad-mono">{{ 'admin.selectedCount' | transloco:{ count: selected().length } }}</span>
          <div class="sec-bulk__actions">
            @if (cfg().statusActions) {
              <button type="button" class="sec-btn" [disabled]="bulkBusy()" (click)="bulkStatus(true)">{{ 'admin.activate' | transloco }}</button>
              <button type="button" class="sec-btn" [disabled]="bulkBusy()" (click)="bulkStatus(false)">{{ 'admin.suspend' | transloco }}</button>
            }
            @if (!cfg().noDelete) {
              <button type="button" class="sec-btn" [disabled]="bulkBusy()" (click)="bulkDelete()">{{ 'admin.delete' | transloco }}</button>
            }
            <button type="button" class="sec-btn sec-btn--ghost" (click)="selected.set([])">{{ 'admin.deselect' | transloco }}</button>
          </div>
        </div>
      }

      <admin-data-table
        [columns]="columns()" [rows]="rows()" [total]="total()" [page]="s().page" [size]="pageSize"
        [sortKey]="s().sortKey" [sortDir]="s().sortDir" [loading]="loading()"
        [selectable]="true" [filterable]="true" [filters]="s().filters" [(selected)]="selectedModel"
        [rowClickable]="true" (rowClick)="openEdit($any($event))"
        (sortChange)="onSort($event)" (pageChange)="onPage($event)" (filterChange)="onFilter($event)">

        <ng-template adCell="actions" let-row>
          <div class="row-actions">
            @if (cfg().statusActions) {
              @if (row['active']) {
                <button type="button" class="ra ra--danger" (click)="setStatus(row, false)" [title]="'admin.suspend' | transloco"><span class="ad-ms">pause_circle</span></button>
              } @else {
                <button type="button" class="ra" (click)="setStatus(row, true)" [title]="'admin.activate' | transloco"><span class="ad-ms">play_circle</span></button>
              }
            }
            <button type="button" class="ra" (click)="openEdit(row)" [title]="'admin.edit' | transloco"><span class="ad-ms">edit</span></button>
            @if (!cfg().noDelete) {
              <button type="button" class="ra ra--danger" (click)="remove(row)" [title]="'admin.delete' | transloco"><span class="ad-ms">delete</span></button>
            }
          </div>
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="formOpen()" [title]="(editingId() ? 'admin.editItem' : 'admin.newItem') | transloco"
                  [eyebrow]="(cfg().labelKey | transloco).toUpperCase()" [width]="560" (closed)="formOpen.set(false)">
      <div class="form-grid">
        @for (f of cfg().fields; track f.key) {
          <label class="fld" [class.fld--full]="f.full || f.type === 'textarea'" [class.fld--check]="f.type === 'checkbox'"
                 [attr.for]="f.type === 'text' ? ('cat-fld-' + f.key) : null">
            @if (f.type === 'checkbox') {
              <app-ui-checkbox [label]="f.labelKey | transloco" [checked]="!!form[f.key]" (checkedChange)="form[f.key] = $event" />
            } @else {
              <span class="fld__l">{{ f.labelKey | transloco }}@if (f.required) { * }</span>
              @switch (f.type) {
                @case ('textarea') { <textarea rows="3" [(ngModel)]="form[f.key]"></textarea> }
                @case ('number')   { <input type="number" step="any" [(ngModel)]="form[f.key]" /> }
                @case ('date')     { <app-ui-datepicker [(ngModel)]="form[f.key]" [ariaLabel]="f.labelKey | transloco" /> }
                @case ('datetime') { <input type="datetime-local" [(ngModel)]="form[f.key]" /> }
                @case ('select')   { <app-ui-select [options]="selectFieldOpts(f)" [(ngModel)]="form[f.key]" placeholder="—" [ariaLabel]="f.labelKey | transloco" /> }
                @case ('partner')  { <app-ui-select [options]="partnerOpts()" [(ngModel)]="form[f.key]" placeholder="—" [ariaLabel]="f.labelKey | transloco" /> }
                @default           { <app-ui-input [inputId]="'cat-fld-' + f.key" [(ngModel)]="form[f.key]" [ariaLabel]="f.labelKey | transloco" /> }
              }
            }
          </label>
        }
      </div>
      @if (formError()) { <p class="form-err">{{ formError() }}</p> }
      <div slot="actions">
        <button type="button" class="sec-btn sec-btn--primary" [disabled]="saving()" (click)="save()">
          {{ (saving() ? 'admin.saving' : 'admin.save') | transloco }}
        </button>
      </div>
    </admin-drawer>
  `,
})
export class AdminCatalogComponent {
  private readonly api = inject(AdminCatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(AdminToastService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly t = inject(TranslocoService);

  readonly pageSize = PAGE_SIZE;
  readonly resource = signal<string>('hotels');
  readonly rows = signal<AdminEntity[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');
  readonly s = signal<ListState>({ page: 0, sortKey: null, sortDir: 'asc', q: '', status: '', filters: {} });
  readonly partners = signal<PartnerOption[]>([]);
  readonly selected = signal<string[]>([]);
  // Two-way bridge for the table's `selected` model input.
  get selectedModel(): string[] { return this.selected(); }
  set selectedModel(v: string[]) { this.selected.set(v); }
  readonly exporting = signal(false);
  readonly bulkBusy = signal(false);

  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: Record<string, unknown> = {};

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly cfg = computed<EntityConfig>(() => ENTITY_CONFIGS[this.resource()] ?? ENTITY_CONFIGS['hotels']);
  titleKey(): string { return ADMIN_NAV_FLAT.find(n => n.path === this.resource())?.labelKey ?? this.cfg().labelKey; }
  eyebrow(): string {
    const r = this.resource();
    if (r === 'partners') return 'PEOPLE';
    if (r === 'promos') return 'OPERATIONS';
    return 'CATALOG';
  }

  constructor() {
    combineLatest([this.route.data, this.route.queryParamMap]).pipe(takeUntilDestroyed()).subscribe(([data, pm]) => {
      const resource = (data['resource'] as string) ?? 'hotels';
      if (resource !== this.resource()) {
        this.resource.set(resource);
        this.selected.set([]);
        this.rows.set([]);
        this.loadPartnersIfNeeded();
      }
      this.s.set(parseListState(pm));
      this.load();
    });
  }

  columns(): TableColumn[] {
    return this.cfg().columns.map(c => ({
      key: c.key,
      label: this.t.translate(c.labelKey),
      sortable: true,
      kind: this.cellKind(c),
      filter: this.filterKind(c),
      filterOptions: this.fieldFor(c)?.options,
    }));
  }

  private cellKind(c: ColumnDef): TableColumn['kind'] {
    if (c.kind === 'bool') return 'bool';
    if (c.kind === 'badge') return 'badge';
    return 'text';
  }
  private filterKind(c: ColumnDef): TableColumn['filter'] {
    if (c.kind === 'bool') return 'bool';
    const f = this.fieldFor(c);
    if (f?.type === 'checkbox') return 'bool';
    if (f?.options?.length) return 'select';
    return 'text';
  }
  private fieldFor(c: ColumnDef): FieldDef | undefined { return this.cfg().fields.find(f => f.key === c.key); }

  /** Dropdown options for an enum field, with a clear "—" entry. */
  selectFieldOpts(f: FieldDef): UiSelectOption[] {
    return [{ value: '', label: '—' }, ...(f.options ?? []).map(o => ({ value: o, label: o }))];
  }
  /** Dropdown options for the partner picker (shows the partner name for the stored id). */
  partnerOpts(): UiSelectOption[] {
    return [{ value: '', label: '—' }, ...this.partners().map(p => ({ value: p.id, label: p.name }))];
  }

  private loadPartnersIfNeeded(): void {
    if (this.cfg().fields.some(f => f.type === 'partner') && this.partners().length === 0) {
      this.api.partnerOptions().pipe(catchError(() => of([]))).subscribe(o => this.partners.set(o));
    }
  }

  load(): void {
    const s = this.s();
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    this.api.list(this.cfg().resource, s.page, this.pageSize, toListQuery(s))
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.loading.set(false);
        if (!res) { this.state.set('error'); return; }
        this.rows.set(res.content ?? []);
        this.total.set(res.page?.totalElements ?? 0);
        this.state.set((res.content ?? []).length ? 'ready' : 'empty');
      });
  }

  // ── URL-state navigation ───────────────────────────────────────────────
  private patch(partial: Partial<ListState>): void {
    const next: ListState = { ...this.s(), ...partial };
    this.router.navigate([], { relativeTo: this.route, queryParams: buildListParams(next) });
  }
  onSort(e: { key: string; dir: 'asc' | 'desc' }): void { this.patch({ sortKey: e.key, sortDir: e.dir, page: 0 }); }
  onPage(p: number): void { this.patch({ page: p }); }
  onFilter(filters: Record<string, string>): void { this.patch({ filters, page: 0 }); }
  onSearch(q: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.patch({ q, page: 0 }), SEARCH_DEBOUNCE_MS);
  }
  hasActiveFilters(): boolean { const s = this.s(); return !!(s.q || Object.keys(s.filters).length); }
  clearFilters(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  // ── Row + bulk actions ─────────────────────────────────────────────────
  setStatus(row: AdminEntity, active: boolean): void {
    const req$ = active ? this.api.activate(this.cfg().resource, row.id) : this.api.suspend(this.cfg().resource, row.id);
    req$.pipe(catchError(() => of(null))).subscribe(() => {
      this.rows.update(list => list.map(r => r.id === row.id ? { ...r, active } : r));
      this.toast.ok(this.t.translate(active ? 'admin.partnerActivated' : 'admin.partnerSuspended'));
    });
  }

  async remove(row: AdminEntity): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.delete'), message: this.t.translate('admin.deleteConfirm'),
      confirmLabel: this.t.translate('admin.delete'), cancelLabel: this.t.translate('admin.cancel'), tone: 'danger',
    });
    if (!ok) return;
    this.api.remove(this.cfg().resource, row.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.toast.ok(this.t.translate('admin.itemDeleted')); this.load();
    });
  }

  bulkStatus(active: boolean): void {
    const ids = this.selected();
    if (!ids.length) return;
    this.runBulk(ids.map(id => active ? this.api.activate(this.cfg().resource, id) : this.api.suspend(this.cfg().resource, id)));
  }
  async bulkDelete(): Promise<void> {
    const ids = this.selected();
    if (!ids.length) return;
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.delete'), message: this.t.translate('admin.bulkDeleteConfirm', { count: ids.length }),
      confirmLabel: this.t.translate('admin.delete'), cancelLabel: this.t.translate('admin.cancel'), tone: 'danger',
    });
    if (!ok) return;
    this.runBulk(ids.map(id => this.api.remove(this.cfg().resource, id)));
  }
  private runBulk(requests: ReturnType<AdminCatalogService['remove']>[]): void {
    this.bulkBusy.set(true);
    const count = requests.length;
    forkJoin(requests).pipe(catchError(() => of(null))).subscribe(res => {
      this.bulkBusy.set(false);
      this.selected.set([]);
      this.toast[res === null ? 'error' : 'ok'](this.t.translate(res === null ? 'admin.bulkFailed' : 'admin.bulkDone', { count }));
      this.load();
    });
  }

  // ── CSV ────────────────────────────────────────────────────────────────
  exportCsv(): void {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.api.list(this.cfg().resource, 0, EXPORT_SIZE, toListQuery(this.s())).pipe(catchError(() => of(null))).subscribe(res => {
      this.exporting.set(false);
      if (!res) { this.toast.error(this.t.translate('admin.exportFailed')); return; }
      this.downloadCsv(res.content ?? []);
    });
  }
  private downloadCsv(data: AdminEntity[]): void {
    const cols = this.cfg().columns;
    const cell = (v: string) => /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const disp = (v: unknown) => v === null || v === undefined || v === '' ? '' : String(v);
    const header = cols.map(c => cell(this.t.translate(c.labelKey))).join(',');
    const lines = data.map(row => cols.map(c => cell(disp((row as Record<string, unknown>)[c.key]))).join(','));
    const csv = ['﻿' + header, ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${this.cfg().resource.replace(/\//g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    this.toast.ok(this.t.translate('admin.exported', { count: data.length }));
  }

  // ── Create / edit ──────────────────────────────────────────────────────
  openCreate(): void {
    this.editingId.set(null); this.formError.set('');
    const blank: Record<string, unknown> = {};
    for (const f of this.cfg().fields) blank[f.key] = f.type === 'checkbox' ? f.key === 'active' : '';
    this.form = blank; this.formOpen.set(true);
  }
  openEdit(row: AdminEntity): void {
    this.editingId.set(row.id); this.formError.set('');
    const next: Record<string, unknown> = {};
    for (const f of this.cfg().fields) next[f.key] = this.toFieldValue(f, (row as Record<string, unknown>)[f.key]);
    this.form = next; this.formOpen.set(true);
  }
  save(): void {
    const missing = this.cfg().fields.find(f => f.required && this.isEmpty(this.form[f.key]));
    if (missing) { this.formError.set(this.t.translate('admin.fieldRequired', { field: this.t.translate(missing.labelKey) })); return; }
    this.saving.set(true); this.formError.set('');
    const id = this.editingId();
    const payload = this.buildPayload();
    const req$ = id ? this.api.update(this.cfg().resource, id, payload) : this.api.create(this.cfg().resource, payload);
    req$.pipe(catchError(() => { this.formError.set(this.t.translate('admin.saveFailed')); return of(null); })).subscribe(res => {
      this.saving.set(false);
      if (res === null) return;
      this.formOpen.set(false);
      this.toast.ok(this.t.translate(id ? 'admin.itemUpdated' : 'admin.itemCreated'));
      this.load();
    });
  }

  private toFieldValue(f: FieldDef, raw: unknown): unknown {
    if (f.type === 'checkbox') return !!raw;
    if (f.type === 'datetime' && typeof raw === 'string' && raw) return raw.slice(0, 16);
    return raw ?? '';
  }
  private buildPayload(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of this.cfg().fields) {
      const v = this.form[f.key];
      if (f.type === 'checkbox') out[f.key] = !!v;
      else if (f.type === 'number') out[f.key] = this.isEmpty(v) ? null : Number(v);
      else if (f.type === 'datetime') out[f.key] = this.isEmpty(v) ? null : new Date(v as string).toISOString();
      else out[f.key] = this.isEmpty(v) ? null : v;
    }
    return out;
  }
  private isEmpty(v: unknown): boolean { return v === null || v === undefined || v === ''; }
}
