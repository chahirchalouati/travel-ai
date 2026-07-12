import {
  AfterContentInit, Component, ContentChildren, EventEmitter, Input, Output,
  QueryList, SimpleChanges, TemplateRef, model, OnChanges,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { inject } from '@angular/core';
import { AdminTableCellDirective } from './admin-table-cell.directive';
import { AdminStatusBadgeComponent } from './admin-status-badge.component';
import { UiSelectComponent, UiSelectOption } from '../../../shared/ui/ui-select.component';
import { UiInputComponent } from '../../../shared/ui/ui-input.component';

export type CellKind = 'text' | 'mono' | 'currency' | 'date' | 'datetime' | 'bool' | 'badge' | 'custom';
export type SortDir = 'asc' | 'desc';

export interface TableColumn {
  key: string;
  /** Pre-translated header label. */
  label: string;
  sortable?: boolean;
  kind?: CellKind;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Row field holding the ISO currency code, for kind==='currency'. */
  currencyKey?: string;
  /** Renders an inline filter control in the filter row. */
  filter?: 'text' | 'bool' | 'select';
  filterOptions?: string[];
}

/** Rows only need an id; cell access is by column key via {@link AdminDataTableComponent.val}. */
export interface TableRow { id: string; }

const FILTER_DEBOUNCE_MS = 300;

/**
 * Presentational server-driven table: sortable headers, optional filter row,
 * page-scoped multi-select, custom cells/actions via `*adCell`, and a footer
 * with pager + total + optional CSV. The parent owns fetching and URL-state;
 * the table only emits intent (sort/page/filter/rowClick/export).
 */
@Component({
  selector: 'admin-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, FormsModule, TranslocoModule, AdminStatusBadgeComponent, UiSelectComponent, UiInputComponent],
  styleUrls: ['./admin-data-table.component.scss'],
  template: `
    <div class="ad-tbl-wrap">
      @if (loading) { <div class="ad-tbl-prog" role="progressbar" aria-label="loading"></div> }
      <table class="ad-tbl">
        <thead>
          <tr class="ad-tbl__hrow">
            @if (selectable) {
              <th class="ad-tbl__check">
                <input type="checkbox" [checked]="allOnPage()" (change)="toggleAll()" aria-label="Select all rows" />
              </th>
            }
            @for (c of columns; track c.key) {
              <th [style.width]="c.width || null" [attr.data-align]="c.align || 'left'"
                  [class.ad-tbl__sortable]="c.sortable" (click)="c.sortable && sort(c)"
                  [attr.aria-sort]="ariaSort(c)">
                <span class="ad-tbl__th">
                  {{ c.label }}
                  @if (c.sortable) {
                    <span class="ad-tbl__arrow" [attr.data-on]="sortKey === c.key">
                      {{ sortKey === c.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}
                    </span>
                  }
                </span>
              </th>
            }
            @if (hasActions) { <th class="ad-tbl__actions-h" aria-label="actions"></th> }
          </tr>

          @if (filterable) {
            <tr class="ad-tbl__frow">
              @if (selectable) { <th></th> }
              @for (c of columns; track c.key) {
                <th>
                  @if (c.filter === 'bool') {
                    <app-ui-select [options]="boolOpts()" [ngModel]="filters[c.key] || ''"
                                   (ngModelChange)="setFilter(c.key, $any($event), false)" [ariaLabel]="c.label" />
                  } @else if (c.filter === 'select') {
                    <app-ui-select [options]="selectOpts(c)" [ngModel]="filters[c.key] || ''"
                                   (ngModelChange)="setFilter(c.key, $any($event), false)" [ariaLabel]="c.label" />
                  } @else if (c.filter === 'text') {
                    <app-ui-input variant="filter" [ngModel]="filters[c.key] || ''"
                                  (ngModelChange)="setFilter(c.key, $event, true)" [ariaLabel]="c.label"
                                  [placeholder]="'admin.filterPlaceholder' | transloco" />
                  }
                </th>
              }
              @if (hasActions) { <th></th> }
            </tr>
          }
        </thead>

        <tbody>
          @for (row of rows; track row.id) {
            <tr [class.ad-tbl__row--click]="rowClickable" [class.ad-tbl__row--sel]="isSel(row.id)"
                (click)="onRowClick(row)">
              @if (selectable) {
                <td class="ad-tbl__check" (click)="$event.stopPropagation()">
                  <input type="checkbox" [checked]="isSel(row.id)" (change)="toggleOne(row.id)"
                         [attr.aria-label]="'Select row'" />
                </td>
              }
              @for (c of columns; track c.key) {
                <td [attr.data-align]="c.align || 'left'">
                  @switch (c.kind || 'text') {
                    @case ('custom') {
                      <ng-container *ngTemplateOutlet="tplFor(c.key); context: { $implicit: row }"></ng-container>
                    }
                    @case ('mono')     { <span class="ad-mono">{{ display(val(row, c.key)) }}</span> }
                    @case ('currency') { <span class="ad-mono">{{ fmtCurrency(val(row, c.key), c.currencyKey ? val(row, c.currencyKey) : null) }}</span> }
                    @case ('date')     { <span class="ad-tbl__dim ad-mono">{{ fmtDate(val(row, c.key)) }}</span> }
                    @case ('datetime') { <span class="ad-tbl__dim ad-mono">{{ fmtDateTime(val(row, c.key)) }}</span> }
                    @case ('bool')     { <span class="ad-tbl__bool" [attr.data-on]="isTrue(val(row, c.key))">{{ isTrue(val(row, c.key)) ? '●' : '○' }}</span> }
                    @case ('badge')    { @if (val(row, c.key)) { <admin-status-badge tone="neutral" [dot]="false">{{ display(val(row, c.key)) }}</admin-status-badge> } @else { — } }
                    @default           { {{ display(val(row, c.key)) }} }
                  }
                </td>
              }
              @if (hasActions) {
                <td class="ad-tbl__actions" (click)="$event.stopPropagation()">
                  <ng-container *ngTemplateOutlet="tplFor('actions'); context: { $implicit: row }"></ng-container>
                </td>
              }
            </tr>
          } @empty {
            <tr><td [attr.colspan]="colCount()" class="ad-tbl__empty">{{ emptyText || ('admin.stateEmpty' | transloco) }}</td></tr>
          }
        </tbody>
      </table>
    </div>

    <footer class="ad-tbl-foot">
      <span class="ad-tbl-foot__count ad-mono">
        @if (total > 0) { {{ pageStart() }}–{{ pageEnd() }} / {{ total }} }
        @else { 0 }
      </span>
      <div class="ad-tbl-foot__right">
        @if (csv) {
          <button type="button" class="ad-tbl-foot__csv" [disabled]="total === 0" (click)="exportCsv.emit()">
            {{ 'admin.exportCsv' | transloco }}
          </button>
        }
        <div class="ad-tbl-foot__pager">
          <button type="button" [disabled]="page === 0" (click)="pageChange.emit(page - 1)" aria-label="Previous page">←</button>
          <span class="ad-mono">{{ page + 1 }} / {{ totalPages() }}</span>
          <button type="button" [disabled]="page + 1 >= totalPages()" (click)="pageChange.emit(page + 1)" aria-label="Next page">→</button>
        </div>
      </div>
    </footer>
  `,
})
export class AdminDataTableComponent implements AfterContentInit, OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() rows: readonly TableRow[] = [];
  @Input() total = 0;
  @Input() page = 0;
  @Input() size = 20;
  @Input() sortKey: string | null = null;
  @Input() sortDir: SortDir = 'asc';
  @Input() loading = false;
  @Input() rowClickable = false;
  @Input() selectable = false;
  @Input() filterable = false;
  @Input() filters: Record<string, string> = {};
  @Input() csv = false;
  @Input() emptyText = '';

  readonly selected = model<string[]>([]);

  @Output() sortChange = new EventEmitter<{ key: string; dir: SortDir }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() filterChange = new EventEmitter<Record<string, string>>();
  @Output() rowClick = new EventEmitter<TableRow>();
  @Output() exportCsv = new EventEmitter<void>();

  @ContentChildren(AdminTableCellDirective) private cellDirs!: QueryList<AdminTableCellDirective>;
  private tpls = new Map<string, TemplateRef<unknown>>();
  hasActions = false;

  private filterTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly i18n = inject(TranslocoService);

  /** Options for the built-in boolean filter dropdown. */
  boolOpts(): UiSelectOption[] {
    return [
      { value: '', label: this.i18n.translate('admin.filterAll') },
      { value: 'true', label: this.i18n.translate('admin.yes') },
      { value: 'false', label: this.i18n.translate('admin.no') },
    ];
  }
  /** Options for an enum filter dropdown, prefixed with an "all" entry. */
  selectOpts(c: TableColumn): UiSelectOption[] {
    return [{ value: '', label: this.i18n.translate('admin.filterAll') },
      ...(c.filterOptions ?? []).map(o => ({ value: o, label: o }))];
  }

  ngAfterContentInit(): void {
    this.tpls = new Map(this.cellDirs.map(d => [d.name, d.tpl] as const));
    this.hasActions = this.tpls.has('actions');
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Selection is page-scoped: drop it whenever a new page/result set arrives.
    if (changes['rows'] && !changes['rows'].firstChange) this.selected.set([]);
  }

  tplFor(name: string): TemplateRef<unknown> | null { return this.tpls.get(name) ?? null; }

  // ── Sorting ──────────────────────────────────────────────────────────────
  sort(c: TableColumn): void {
    const dir: SortDir = this.sortKey === c.key && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key: c.key, dir });
  }
  ariaSort(c: TableColumn): string | null {
    if (!c.sortable) return null;
    if (this.sortKey !== c.key) return 'none';
    return this.sortDir === 'asc' ? 'ascending' : 'descending';
  }

  // ── Filtering ────────────────────────────────────────────────────────────
  setFilter(key: string, value: string, debounced: boolean): void {
    const next = { ...this.filters };
    if (value === '' || value == null) delete next[key]; else next[key] = value;
    this.filters = next;
    if (this.filterTimer) clearTimeout(this.filterTimer);
    if (debounced) this.filterTimer = setTimeout(() => this.filterChange.emit(next), FILTER_DEBOUNCE_MS);
    else this.filterChange.emit(next);
  }

  // ── Selection ────────────────────────────────────────────────────────────
  isSel(id: string): boolean { return this.selected().includes(id); }
  allOnPage(): boolean { return this.rows.length > 0 && this.rows.every(r => this.isSel(r.id)); }
  toggleOne(id: string): void {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set([...s]);
  }
  toggleAll(): void {
    if (this.allOnPage()) { this.selected.set([]); return; }
    this.selected.set(this.rows.map(r => r.id));
  }

  // ── Rows ─────────────────────────────────────────────────────────────────
  onRowClick(row: TableRow): void { if (this.rowClickable) this.rowClick.emit(row); }
  colCount(): number { return this.columns.length + (this.selectable ? 1 : 0) + (this.hasActions ? 1 : 0); }

  // ── Paging math ──────────────────────────────────────────────────────────
  totalPages(): number { return Math.max(1, Math.ceil(this.total / this.size)); }
  pageStart(): number { return this.page * this.size + 1; }
  pageEnd(): number { return Math.min((this.page + 1) * this.size, this.total); }

  // ── Value formatting ─────────────────────────────────────────────────────
  val(row: TableRow, key: string): unknown { return (row as unknown as Record<string, unknown>)[key]; }
  display(v: unknown): string { return v === null || v === undefined || v === '' ? '—' : String(v); }
  isTrue(v: unknown): boolean { return v === true || v === 'true'; }

  fmtCurrency(v: unknown, code: unknown): string {
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    if (Number.isNaN(n)) return '—';
    const currency = typeof code === 'string' && code ? code : 'EUR';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
    } catch {
      return `${n.toFixed(2)} ${currency}`;
    }
  }
  fmtDate(v: unknown): string { return this.formatDate(v, false); }
  fmtDateTime(v: unknown): string { return this.formatDate(v, true); }
  private formatDate(v: unknown, withTime: boolean): string {
    if (!v) return '—';
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) return '—';
    const opts: Intl.DateTimeFormatOptions = withTime
      ? { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric', month: 'short', day: '2-digit' };
    return new Intl.DateTimeFormat(undefined, opts).format(d);
  }
}
