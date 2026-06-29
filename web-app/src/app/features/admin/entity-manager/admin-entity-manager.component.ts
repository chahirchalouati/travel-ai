import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AdminCatalogService, AdminEntity, PartnerOption } from '../../../core/services/admin-catalog.service';
import { EntityConfig, FieldDef } from './entity-configs';

const PAGE_SIZE = 20;

/** Schema-driven CRUD surface: table + create/edit modal for any admin resource. */
@Component({
  selector: 'app-admin-entity-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  styleUrls: ['./admin-entity-manager.component.scss'],
  template: `
    <div class="em">
      <div class="em-bar">
        <button class="em-new" (click)="openCreate()">
          <span class="ms">add</span> {{ 'admin.addNew' | transloco }} {{ config.labelKey | transloco }}
        </button>
        <span class="em-count">{{ total() }} {{ 'admin.totalItems' | transloco }}</span>
      </div>

      @if (toast()) { <div class="em-toast">{{ toast() }}</div> }

      <div class="table-wrap">
        <table class="em-table">
          <thead>
            <tr>
              @for (c of config.columns; track c.key) { <th>{{ c.labelKey | transloco }}</th> }
              <th class="ta-right">{{ 'admin.thActions' | transloco }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr>
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
              <tr><td [attr.colspan]="config.columns.length + 1" class="empty-row">{{ 'admin.noItems' | transloco }}</td></tr>
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
export class AdminEntityManagerComponent implements OnChanges {
  private readonly api = inject(AdminCatalogService);
  private readonly transloco = inject(TranslocoService);

  @Input({ required: true }) config!: EntityConfig;

  readonly rows = signal<AdminEntity[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly hasMore = signal(false);
  readonly toast = signal('');

  readonly partners = signal<PartnerOption[]>([]);

  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: Record<string, unknown> = {};

  ngOnChanges(): void {
    this.page.set(0);
    this.load();
    if (this.config.fields.some(f => f.type === 'partner') && this.partners().length === 0) {
      this.api.partnerOptions().pipe(catchError(() => of([]))).subscribe(opts => this.partners.set(opts));
    }
  }

  private load(): void {
    this.api.list(this.config.resource, this.page(), PAGE_SIZE)
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.rows.set(res?.content ?? []);
        this.total.set(res?.totalElements ?? 0);
        this.hasMore.set((this.page() + 1) * PAGE_SIZE < (res?.totalElements ?? 0));
      });
  }

  prev(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  next(): void { if (this.hasMore()) { this.page.update(p => p + 1); this.load(); } }

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
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
