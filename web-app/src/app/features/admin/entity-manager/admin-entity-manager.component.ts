import { Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AdminCatalogService, AdminEntity, ListQuery, PartnerOption, SortDir } from '../../../core/services/admin-catalog.service';
import { ColumnDef, EntityConfig, FieldDef } from './entity-configs';

const PAGE_SIZE = 20;
const EXPORT_SIZE = 1000;
const DEBOUNCE_MS = 300;

type FilterKind = 'text' | 'bool' | 'select';

/** Schema-driven CRUD surface: filterable/sortable table + create/edit modal for any admin resource. */
@Component({
  selector: 'app-admin-entity-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  styleUrls: ['./admin-entity-manager.component.scss'],
  template: `
    <div class="em">
      <div class="em-bar">
        <div class="em-bar-left">
          <button class="em-new" (click)="openCreate()">
            <span class="ms">add</span> {{ 'admin.addNew' | transloco }} {{ config.labelKey | transloco }}
          </button>
          <div class="em-search">
            <span class="ms">search</span>
            <input type="search" [ngModel]="search()" (ngModelChange)="onSearch($event)"
                   [placeholder]="'admin.searchPlaceholder' | transloco" />
          </div>
        </div>
        <div class="em-bar-right">
          @if (activeFilterCount() > 0) {
            <button class="em-chip" (click)="clearFilters()">
              <span class="ms">filter_alt_off</span> {{ 'admin.clearFilters' | transloco }} ({{ activeFilterCount() }})
            </button>
          }
          <button class="em-chip" [disabled]="exporting() || total() === 0" (click)="exportCsv()">
            <span class="ms">{{ exporting() ? 'hourglass_top' : 'download' }}</span> {{ 'admin.exportCsv' | transloco }}
          </button>
          <span class="em-count">{{ total() }} {{ 'admin.totalItems' | transloco }}</span>
        </div>
      </div>

      @if (toast()) { <div class="em-toast">{{ toast() }}</div> }

      @if (selectedCount() > 0) {
        <div class="em-bulkbar">
          <span class="em-bulk-count">{{ 'admin.selectedCount' | transloco:{ count: selectedCount() } }}</span>
          <div class="em-bulk-actions">
            @if (config.statusActions) {
              <button class="mini mini-ok" [disabled]="bulkBusy()" (click)="bulkStatus(true)">{{ 'admin.activate' | transloco }}</button>
              <button class="mini mini-danger" [disabled]="bulkBusy()" (click)="bulkStatus(false)">{{ 'admin.suspend' | transloco }}</button>
            }
            @if (!config.noDelete) {
              <button class="mini mini-danger" [disabled]="bulkBusy()" (click)="bulkDelete()">{{ 'admin.delete' | transloco }}</button>
            }
            <button class="mini" (click)="clearSelection()">{{ 'admin.deselect' | transloco }}</button>
          </div>
        </div>
      }

      <div class="table-wrap">
        <table class="em-table">
          <thead>
            <tr>
              <th class="th-check">
                <input type="checkbox" [checked]="allOnPageSelected()" (change)="toggleSelectAll()" />
              </th>
              @for (c of config.columns; track c.key) {
                <th class="th-sort" (click)="toggleSort(c.key)">
                  <span class="th-inner">
                    {{ c.labelKey | transloco }}
                    <span class="ms th-arrow" [class.th-arrow--on]="sortKey() === c.key">
                      {{ sortKey() === c.key ? (sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                    </span>
                  </span>
                </th>
              }
              <th class="ta-right">{{ 'admin.thActions' | transloco }}</th>
            </tr>
            <tr class="filter-row">
              <th></th>
              @for (c of config.columns; track c.key) {
                <th>
                  @switch (filterKind(c)) {
                    @case ('bool') {
                      <select [ngModel]="filters()[c.key]" (ngModelChange)="setFilter(c.key, $event)">
                        <option value="">{{ 'admin.filterAll' | transloco }}</option>
                        <option value="true">{{ 'admin.yes' | transloco }}</option>
                        <option value="false">{{ 'admin.no' | transloco }}</option>
                      </select>
                    }
                    @case ('select') {
                      <select [ngModel]="filters()[c.key]" (ngModelChange)="setFilter(c.key, $event)">
                        <option value="">{{ 'admin.filterAll' | transloco }}</option>
                        @for (o of filterOptions(c); track o) { <option [value]="o">{{ o }}</option> }
                      </select>
                    }
                    @default {
                      <input type="text" [ngModel]="filters()[c.key]" (ngModelChange)="setFilter(c.key, $event)"
                             [placeholder]="'admin.filterPlaceholder' | transloco" />
                    }
                  }
                </th>
              }
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr [class.row-selected]="isSelected(row.id)">
                <td class="td-check">
                  <input type="checkbox" [checked]="isSelected(row.id)" (change)="toggleSelect(row.id)" />
                </td>
                @for (c of config.columns; track c.key) {
                  <td>
                    @switch (c.kind) {
                      @case ('bool') {
                        <span class="tag" [class.tag-ok]="!!row[c.key]" [class.tag-off]="!row[c.key]">
                          {{ (row[c.key] ? 'admin.yes' : 'admin.no') | transloco }}
                        </span>
                      }
                      @case ('badge') { <span class="tag tag-neutral">{{ display(row[c.key]) }}</span> }
                      @default { {{ display(row[c.key]) }} }
                    }
                  </td>
                }
                <td class="ta-right row-actions">
                  @if (config.statusActions) {
                    @if (row['active']) {
                      <button class="mini mini-danger" (click)="setStatus(row, false)">{{ 'admin.suspend' | transloco }}</button>
                    } @else {
                      <button class="mini mini-ok" (click)="setStatus(row, true)">{{ 'admin.activate' | transloco }}</button>
                    }
                  }
                  <button class="mini" (click)="openEdit(row)">{{ 'admin.edit' | transloco }}</button>
                  @if (!config.noDelete) {
                    <button class="mini mini-danger" (click)="remove(row)">{{ 'admin.delete' | transloco }}</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td [attr.colspan]="config.columns.length + 2" class="empty-row">{{ 'admin.noItems' | transloco }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <div class="pager">
        <button [disabled]="page() === 0" (click)="prev()">{{ 'admin.prev' | transloco }}</button>
        <span>{{ 'admin.page' | transloco }} {{ page() + 1 }}</span>
        <button [disabled]="!hasMore()" (click)="next()">{{ 'admin.next' | transloco }}</button>
      </div>
    </div>

    <!-- Modal form -->
    @if (formOpen()) {
      <div class="em-overlay" (click)="close()">
        <div class="em-modal" (click)="$event.stopPropagation()">
          <header class="em-modal-head">
            <h3>{{ (editingId() ? 'admin.editItem' : 'admin.newItem') | transloco }} · {{ config.labelKey | transloco }}</h3>
            <button class="em-close" (click)="close()"><span class="ms">close</span></button>
          </header>

          <div class="em-grid">
            @for (f of config.fields; track f.key) {
              <label class="em-field" [class.em-field-full]="f.full || f.type === 'textarea'">
                <span class="em-label">{{ f.labelKey | transloco }}@if (f.required) { <span class="req">*</span> }</span>

                @switch (f.type) {
                  @case ('textarea') {
                    <textarea rows="3" [(ngModel)]="form[f.key]"></textarea>
                  }
                  @case ('checkbox') {
                    <span class="em-check"><input type="checkbox" [(ngModel)]="form[f.key]" /></span>
                  }
                  @case ('number') {
                    <input type="number" step="any" [(ngModel)]="form[f.key]" />
                  }
                  @case ('date') {
                    <input type="date" [(ngModel)]="form[f.key]" />
                  }
                  @case ('datetime') {
                    <input type="datetime-local" [(ngModel)]="form[f.key]" />
                  }
                  @case ('select') {
                    <select [(ngModel)]="form[f.key]">
                      <option value="">—</option>
                      @for (o of f.options; track o) { <option [value]="o">{{ o }}</option> }
                    </select>
                  }
                  @case ('partner') {
                    <select [(ngModel)]="form[f.key]">
                      <option value="">—</option>
                      @for (p of partners(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
                    </select>
                  }
                  @default {
                    <input type="text" [(ngModel)]="form[f.key]" />
                  }
                }
              </label>
            }
          </div>

          @if (formError()) { <p class="em-error">{{ formError() }}</p> }

          <footer class="em-modal-foot">
            <button class="em-btn-ghost" (click)="close()">{{ 'admin.cancel' | transloco }}</button>
            <button class="em-btn-primary" [disabled]="saving()" (click)="save()">
              {{ (saving() ? 'admin.saving' : 'admin.save') | transloco }}
            </button>
          </footer>
        </div>
      </div>
    }
  `,
})
export class AdminEntityManagerComponent implements OnChanges, OnDestroy {
  private readonly api = inject(AdminCatalogService);
  private readonly transloco = inject(TranslocoService);

  @Input({ required: true }) config!: EntityConfig;

  readonly rows = signal<AdminEntity[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly hasMore = signal(false);
  readonly toast = signal('');

  readonly search = signal('');
  readonly filters = signal<Record<string, string>>({});
  readonly sortKey = signal<string | null>(null);
  readonly sortDir = signal<SortDir>('asc');
  readonly exporting = signal(false);
  readonly selected = signal<Set<string>>(new Set());
  readonly bulkBusy = signal(false);

  readonly partners = signal<PartnerOption[]>([]);

  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: Record<string, unknown> = {};

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(): void {
    // Reset filter/sort state when switching resource.
    this.search.set('');
    this.filters.set({});
    this.sortKey.set(null);
    this.sortDir.set('asc');
    this.page.set(0);
    this.load();
    if (this.config.fields.some(f => f.type === 'partner') && this.partners().length === 0) {
      this.api.partnerOptions().pipe(catchError(() => of([]))).subscribe(opts => this.partners.set(opts));
    }
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  private query(): ListQuery {
    return {
      search: this.search(),
      sortKey: this.sortKey() ?? undefined,
      sortDir: this.sortDir(),
      filters: this.filters(),
    };
  }

  private load(): void {
    this.clearSelection();
    this.api.list(this.config.resource, this.page(), PAGE_SIZE, this.query())
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.rows.set(res?.content ?? []);
        this.total.set(res?.totalElements ?? 0);
        this.hasMore.set((this.page() + 1) * PAGE_SIZE < (res?.totalElements ?? 0));
      });
  }

  /** Reloads from page 0 after a filter/search/sort change, debounced for text input. */
  private reloadFromStart(debounced: boolean): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    const run = () => { this.page.set(0); this.load(); };
    if (debounced) this.debounceTimer = setTimeout(run, DEBOUNCE_MS);
    else run();
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.reloadFromStart(true);
  }

  setFilter(key: string, value: string): void {
    const next = { ...this.filters() };
    if (value === '' || value == null) delete next[key];
    else next[key] = value;
    this.filters.set(next);
    this.reloadFromStart(this.filterKindByKey(key) === 'text');
  }

  clearFilters(): void {
    this.search.set('');
    this.filters.set({});
    this.reloadFromStart(false);
  }

  activeFilterCount(): number {
    return Object.keys(this.filters()).length + (this.search().trim() ? 1 : 0);
  }

  toggleSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.reloadFromStart(false);
  }

  // ── Filter metadata (derived from the entity config) ────────────────────

  private fieldFor(col: ColumnDef): FieldDef | undefined {
    return this.config.fields.find(f => f.key === col.key);
  }

  filterKind(col: ColumnDef): FilterKind {
    if (col.kind === 'bool') return 'bool';
    const field = this.fieldFor(col);
    if (field?.type === 'checkbox') return 'bool';
    if (field?.options?.length) return 'select';
    return 'text';
  }

  private filterKindByKey(key: string): FilterKind {
    const col = this.config.columns.find(c => c.key === key);
    return col ? this.filterKind(col) : 'text';
  }

  filterOptions(col: ColumnDef): string[] {
    return this.fieldFor(col)?.options ?? [];
  }

  // ── Multi-select + bulk actions ─────────────────────────────────────────

  selectedCount(): number { return this.selected().size; }
  isSelected(id: string): boolean { return this.selected().has(id); }

  allOnPageSelected(): boolean {
    const rows = this.rows();
    return rows.length > 0 && rows.every(r => this.selected().has(r.id));
  }

  toggleSelect(id: string): void {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  toggleSelectAll(): void {
    if (this.allOnPageSelected()) { this.clearSelection(); return; }
    this.selected.set(new Set(this.rows().map(r => r.id)));
  }

  clearSelection(): void {
    if (this.selected().size) this.selected.set(new Set());
  }

  bulkStatus(active: boolean): void {
    const ids = [...this.selected()];
    if (!ids.length) return;
    this.runBulk(ids.map(id => active ? this.api.activate(this.config.resource, id) : this.api.suspend(this.config.resource, id)));
  }

  bulkDelete(): void {
    const ids = [...this.selected()];
    if (!ids.length) return;
    if (!confirm(this.transloco.translate('admin.bulkDeleteConfirm', { count: ids.length }))) return;
    this.runBulk(ids.map(id => this.api.remove(this.config.resource, id)));
  }

  private runBulk(requests: ReturnType<AdminCatalogService['remove']>[]): void {
    this.bulkBusy.set(true);
    const count = requests.length;
    forkJoin(requests).pipe(catchError(() => of(null))).subscribe(res => {
      this.bulkBusy.set(false);
      this.flash(res === null
        ? this.transloco.translate('admin.bulkFailed')
        : this.transloco.translate('admin.bulkDone', { count }));
      this.load();
    });
  }

  prev(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  next(): void { if (this.hasMore()) { this.page.update(p => p + 1); this.load(); } }

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }

  // ── CSV export (respects the active filters/sort) ───────────────────────

  exportCsv(): void {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.api.list(this.config.resource, 0, EXPORT_SIZE, this.query())
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.exporting.set(false);
        if (!res) { this.flash(this.transloco.translate('admin.exportFailed')); return; }
        this.downloadCsv(res.content ?? []);
      });
  }

  private downloadCsv(data: AdminEntity[]): void {
    const cols = this.config.columns;
    const header = cols.map(c => this.csvCell(this.transloco.translate(c.labelKey)));
    const lines = data.map(row => cols.map(c => this.csvCell(this.display(row[c.key]))).join(','));
    const csv = [header.join(','), ...lines].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.config.resource.replace(/\//g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.flash(this.transloco.translate('admin.exported', { count: data.length }));
  }

  private csvCell(value: string): string {
    const needsQuote = /[",\r\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuote ? `"${escaped}"` : escaped;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set('');
    const blank: Record<string, unknown> = {};
    for (const f of this.config.fields) {
      blank[f.key] = f.type === 'checkbox' ? (f.key === 'active') : '';
    }
    this.form = blank;
    this.formOpen.set(true);
  }

  openEdit(row: AdminEntity): void {
    this.editingId.set(row.id);
    this.formError.set('');
    const next: Record<string, unknown> = {};
    for (const f of this.config.fields) {
      next[f.key] = this.toFieldValue(f, row[f.key]);
    }
    this.form = next;
    this.formOpen.set(true);
  }

  close(): void { this.formOpen.set(false); }

  save(): void {
    const missing = this.config.fields.find(f => f.required && this.isEmpty(this.form[f.key]));
    if (missing) {
      this.formError.set(this.transloco.translate('admin.fieldRequired', { field: this.transloco.translate(missing.labelKey) }));
      return;
    }
    const payload = this.buildPayload();
    this.saving.set(true);
    this.formError.set('');
    const id = this.editingId();
    const req$ = id
      ? this.api.update(this.config.resource, id, payload)
      : this.api.create(this.config.resource, payload);
    req$.pipe(catchError(() => { this.formError.set(this.transloco.translate('admin.saveFailed')); return of(null); }))
      .subscribe(result => {
        this.saving.set(false);
        if (result === null) return;
        this.formOpen.set(false);
        this.flash(this.transloco.translate(id ? 'admin.itemUpdated' : 'admin.itemCreated'));
        this.load();
      });
  }

  setStatus(row: AdminEntity, active: boolean): void {
    const req$ = active
      ? this.api.activate(this.config.resource, row.id)
      : this.api.suspend(this.config.resource, row.id);
    req$.pipe(catchError(() => of(null))).subscribe(() => {
      this.rows.update(list => list.map(r => r.id === row.id ? { ...r, active } : r));
      this.flash(this.transloco.translate(active ? 'admin.partnerActivated' : 'admin.partnerSuspended'));
    });
  }

  remove(row: AdminEntity): void {
    if (!confirm(this.transloco.translate('admin.deleteConfirm'))) return;
    this.api.remove(this.config.resource, row.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.flash(this.transloco.translate('admin.itemDeleted'));
      this.load();
    });
  }

  // ── Value conversions ──────────────────────────────────────────────────

  private toFieldValue(f: FieldDef, raw: unknown): unknown {
    if (f.type === 'checkbox') return !!raw;
    if (f.type === 'datetime' && typeof raw === 'string' && raw) {
      // ISO instant → "yyyy-MM-ddTHH:mm" for datetime-local input.
      return raw.slice(0, 16);
    }
    return raw ?? '';
  }

  private buildPayload(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of this.config.fields) {
      const v = this.form[f.key];
      if (f.type === 'checkbox') {
        out[f.key] = !!v;
      } else if (f.type === 'number') {
        out[f.key] = this.isEmpty(v) ? null : Number(v);
      } else if (f.type === 'datetime') {
        out[f.key] = this.isEmpty(v) ? null : new Date(v as string).toISOString();
      } else {
        out[f.key] = this.isEmpty(v) ? null : v;
      }
    }
    return out;
  }

  private isEmpty(v: unknown): boolean {
    return v === null || v === undefined || v === '';
  }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
