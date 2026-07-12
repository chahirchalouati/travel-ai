import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, AdminUser, AdminUserUpsert } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { UiSelectComponent, UiSelectOption } from '../../../shared/ui/ui-select.component';
import { UiInputComponent } from '../../../shared/ui/ui-input.component';
import { UiCheckboxComponent } from '../../../shared/ui/ui-checkbox.component';
import { UiAvatarComponent } from '../../../shared/ui/ui-avatar.component';
import { AdminToastService } from '../ui/admin-toast.service';
import { AdminConfirmService } from '../ui/admin-confirm.service';
import { activeTone } from '../ui/admin-status.util';
import { parseListState, buildListParams, ListState, PAGE_SIZE } from '../state/list-query';

const ROLES = ['TRAVELER', 'PARTNER', 'OPERATIONS', 'ADMIN'];
const SEARCH_DEBOUNCE_MS = 300;
function emptyForm(): AdminUserUpsert {
  return { email: '', password: '', firstName: '', lastName: '', phone: '', role: 'TRAVELER', emailVerified: false, active: true };
}

/** Users: role/status/impersonate/export/anonymize with guardrails, plus create/edit. */
@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    FormsModule, TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminStatusBadgeComponent, AdminDrawerComponent,
    UiSelectComponent, UiInputComponent, UiCheckboxComponent, UiAvatarComponent,
  ],
  styleUrls: ['./section-shared.scss'],
  template: `
    <admin-section eyebrow="01 / PEOPLE" [title]="'admin.navUsers' | transloco" [count]="total()"
                   [state]="state()" (retry)="load()">
      <div slot="toolbar" class="sec-tools">
        <app-ui-input class="sec-search" variant="search" type="search" icon="search"
                      [ngModel]="s().q" (ngModelChange)="onSearch($event)"
                      [placeholder]="'admin.searchPlaceholder' | transloco" />
        <div class="sec-field">
          <app-ui-select [options]="roleFilterOpts()" [ngModel]="s().filters['role'] || ''"
                         (ngModelChange)="setRole($any($event))" [ariaLabel]="'admin.thRole' | transloco" />
        </div>
        @if (hasActiveFilters()) {
          <button type="button" class="sec-btn sec-btn--ghost" (click)="clearFilters()">
            <span class="ad-ms">filter_alt_off</span> {{ 'admin.clearFilters' | transloco }}
          </button>
        }
        <button type="button" class="sec-btn sec-btn--primary" (click)="openCreate()">
          <span class="ad-ms">person_add</span> {{ 'admin.newUser' | transloco }}
        </button>
      </div>

      <admin-data-table
        [columns]="columns()" [rows]="rows()" [total]="total()" [page]="s().page" [size]="pageSize"
        [sortKey]="s().sortKey" [sortDir]="s().sortDir" [loading]="loading()" [csv]="false"
        [rowClickable]="true" (rowClick)="openEdit($any($event))"
        (sortChange)="onSort($event)" (pageChange)="onPage($event)">

        <ng-template adCell="firstName" let-u>
          <div class="cell-user">
            <app-ui-avatar [name]="u.firstName + ' ' + u.lastName" [src]="u.avatarUrl || ''" [size]="28" />
            <span class="cell-user__name">{{ u.firstName }} {{ u.lastName }}</span>
          </div>
        </ng-template>

        <ng-template adCell="role" let-u>
          <app-ui-select class="cell-select" [options]="roleOpts()" [ngModel]="u.role" (click)="$event.stopPropagation()"
                         (ngModelChange)="changeRole(u, $any($event))" [ariaLabel]="'admin.thRole' | transloco" />
        </ng-template>

        <ng-template adCell="active" let-u>
          <admin-status-badge [tone]="activeTone(u.active)">{{ (u.active ? 'admin.active' : 'admin.banned') | transloco }}</admin-status-badge>
        </ng-template>

        <ng-template adCell="actions" let-u>
          <div class="row-actions">
            <button type="button" class="ra" (click)="openEdit(u)" [title]="'admin.edit' | transloco"><span class="ad-ms">edit</span></button>
            <button type="button" class="ra" [class.ra--danger]="u.active" (click)="toggleBan(u)"
                    [title]="(u.active ? 'admin.ban' : 'admin.reinstate') | transloco"><span class="ad-ms">{{ u.active ? 'block' : 'undo' }}</span></button>
            @if (u.active && u.role !== 'ADMIN') {
              <button type="button" class="ra" (click)="impersonate(u)" [title]="'admin.impersonate' | transloco"><span class="ad-ms">visibility</span></button>
            }
            <button type="button" class="ra" (click)="exportUser(u)" [title]="'admin.gdprExport' | transloco"><span class="ad-ms">download</span></button>
            <button type="button" class="ra ra--danger" (click)="anonymize(u)" [title]="'admin.gdprErase' | transloco"><span class="ad-ms">person_off</span></button>
          </div>
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="formOpen()" [title]="(editingId() ? 'admin.editUser' : 'admin.newUser') | transloco"
                  eyebrow="USER" (closed)="formOpen.set(false)">
      <div class="form-grid">
        <label class="fld fld--full" [attr.for]="feEmail.inputId()"><span class="fld__l">{{ 'admin.fEmail' | transloco }} *</span>
          <app-ui-input #feEmail type="email" [(ngModel)]="form.email" [disabled]="!!editingId()" [ariaLabel]="'admin.fEmail' | transloco" /></label>
        <label class="fld fld--full" [attr.for]="fePassword.inputId()"><span class="fld__l">{{ (editingId() ? 'admin.fPasswordKeep' : 'admin.fPassword') | transloco }}</span>
          <app-ui-input #fePassword type="text" [(ngModel)]="form.password" [ariaLabel]="'admin.fPassword' | transloco" /></label>
        <label class="fld" [attr.for]="feFirst.inputId()"><span class="fld__l">{{ 'admin.fFirstName' | transloco }} *</span><app-ui-input #feFirst [(ngModel)]="form.firstName" [ariaLabel]="'admin.fFirstName' | transloco" /></label>
        <label class="fld" [attr.for]="feLast.inputId()"><span class="fld__l">{{ 'admin.fLastName' | transloco }} *</span><app-ui-input #feLast [(ngModel)]="form.lastName" [ariaLabel]="'admin.fLastName' | transloco" /></label>
        <label class="fld" [attr.for]="fePhone.inputId()"><span class="fld__l">{{ 'admin.fPhone' | transloco }}</span><app-ui-input #fePhone [(ngModel)]="form.phone" [ariaLabel]="'admin.fPhone' | transloco" /></label>
        <label class="fld"><span class="fld__l">{{ 'admin.thRole' | transloco }}</span>
          <app-ui-select [options]="roleOpts()" [(ngModel)]="form.role" [ariaLabel]="'admin.thRole' | transloco" /></label>
        <div class="fld fld--check">
          <app-ui-checkbox [label]="'admin.fEmailVerified' | transloco" [checked]="!!form.emailVerified" (checkedChange)="form.emailVerified = $event" />
        </div>
        <div class="fld fld--check">
          <app-ui-checkbox [label]="'admin.fActive' | transloco" [checked]="!!form.active" (checkedChange)="form.active = $event" />
        </div>
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
export class AdminUsersComponent {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(AdminToastService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly t = inject(TranslocoService);

  readonly roles = ROLES;
  readonly pageSize = PAGE_SIZE;
  readonly activeTone = activeTone;

  readonly rows = signal<AdminUser[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');
  readonly s = signal<ListState>({ page: 0, sortKey: null, sortDir: 'asc', q: '', status: '', filters: {} });

  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: AdminUserUpsert = emptyForm();

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(pm => {
      this.s.set(parseListState(pm));
      this.load();
    });
  }

  roleOpts(): UiSelectOption[] { return ROLES.map(r => ({ value: r, label: r })); }
  roleFilterOpts(): UiSelectOption[] {
    return [{ value: '', label: this.t.translate('admin.filterAllRoles') }, ...this.roleOpts()];
  }

  columns(): TableColumn[] {
    return [
      { key: 'firstName', label: this.t.translate('admin.thUser'), sortable: true, kind: 'custom' },
      { key: 'email', label: this.t.translate('admin.thEmail'), sortable: true, kind: 'mono' },
      { key: 'role', label: this.t.translate('admin.thRole'), sortable: true, kind: 'custom' },
      { key: 'active', label: this.t.translate('admin.thStatus'), kind: 'custom' },
      { key: 'createdAt', label: this.t.translate('admin.thCreated'), sortable: true, kind: 'date' },
    ];
  }

  load(): void {
    const s = this.s();
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    this.admin.users(s.page, this.pageSize, { search: s.q, sortKey: s.sortKey, sortDir: s.sortDir, filters: s.filters })
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
    this.router.navigate([], { relativeTo: this.route, queryParams: buildListParams(next), replaceUrl: false });
  }
  onSort(e: { key: string; dir: 'asc' | 'desc' }): void { this.patch({ sortKey: e.key, sortDir: e.dir, page: 0 }); }
  onPage(p: number): void { this.patch({ page: p }); }
  onSearch(q: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.patch({ q, page: 0 }), SEARCH_DEBOUNCE_MS);
  }
  setRole(role: string): void {
    const filters = { ...this.s().filters };
    if (role) filters['role'] = role; else delete filters['role'];
    this.patch({ filters, page: 0 });
  }
  hasActiveFilters(): boolean { const s = this.s(); return !!(s.q || Object.keys(s.filters).length); }
  clearFilters(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  // ── Mutations (optimistic) ─────────────────────────────────────────────
  changeRole(u: AdminUser, role: string): void {
    if (role === u.role) return;
    const prev = u.role;
    this.patchRow(u.id, { role });
    this.admin.setUserRole(u.id, role).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) this.toast.ok(this.t.translate('admin.roleChanged', { email: u.email, role }));
      else { this.patchRow(u.id, { role: prev }); this.toast.error(this.t.translate('admin.saveFailed')); }
    });
  }

  async toggleBan(u: AdminUser): Promise<void> {
    if (u.active) {
      const ok = await this.confirm.ask({
        title: this.t.translate('admin.ban'), message: this.t.translate('admin.banConfirm', { email: u.email }),
        confirmLabel: this.t.translate('admin.ban'), cancelLabel: this.t.translate('admin.cancel'), tone: 'danger',
      });
      if (!ok) return;
    }
    const next = !u.active;
    this.patchRow(u.id, { active: next });
    this.admin.setUserActive(u.id, next).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) this.toast.ok(this.t.translate(next ? 'admin.userReinstated' : 'admin.userBanned'));
      else { this.patchRow(u.id, { active: u.active }); this.toast.error(this.t.translate('admin.saveFailed')); }
    });
  }

  async impersonate(u: AdminUser): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.impersonate'), message: this.t.translate('admin.impersonateConfirm', { email: u.email }),
      confirmLabel: this.t.translate('admin.impersonate'), cancelLabel: this.t.translate('admin.cancel'), tone: 'accent',
      confirmPhrase: u.email, phraseHint: this.t.translate('admin.impersonateHint'),
    });
    if (!ok) return;
    this.admin.impersonate(u.id).pipe(catchError(() => of(null))).subscribe(res => {
      if (!res) { this.toast.error(this.t.translate('admin.impersonateFailed')); return; }
      const adminToken = localStorage.getItem('ai_access_token');
      if (adminToken) localStorage.setItem('ai_admin_token', adminToken);
      localStorage.setItem('ai_impersonating', `${res.firstName} ${res.lastName} (${res.email})`);
      localStorage.setItem('ai_access_token', res.accessToken);
      window.location.href = '/';
    });
  }

  exportUser(u: AdminUser): void {
    this.admin.exportUserData(u.id).pipe(catchError(() => of(null))).subscribe(data => {
      if (!data) { this.toast.error(this.t.translate('admin.gdprExportFailed')); return; }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `user-${u.id}-data.json`; a.click();
      URL.revokeObjectURL(url);
      this.toast.ok(this.t.translate('admin.gdprExported'));
    });
  }

  async anonymize(u: AdminUser): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.gdprErase'), message: this.t.translate('admin.gdprEraseConfirm', { email: u.email }),
      confirmLabel: this.t.translate('admin.gdprErase'), cancelLabel: this.t.translate('admin.cancel'), tone: 'danger',
      confirmPhrase: u.email, phraseHint: this.t.translate('admin.gdprEraseHint'),
    });
    if (!ok) return;
    this.admin.anonymizeUser(u.id).pipe(catchError(() => of(null))).subscribe({
      next: () => { this.toast.ok(this.t.translate('admin.gdprErased')); this.load(); },
      error: () => this.toast.error(this.t.translate('admin.gdprEraseFailed')),
    });
  }

  private patchRow(id: string, patch: Partial<AdminUser>): void {
    this.rows.update(list => list.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  // ── Create / edit ──────────────────────────────────────────────────────
  openCreate(): void { this.editingId.set(null); this.formError.set(''); this.form = emptyForm(); this.formOpen.set(true); }
  openEdit(u: AdminUser): void {
    this.editingId.set(u.id); this.formError.set('');
    this.form = { email: u.email, password: '', firstName: u.firstName, lastName: u.lastName, phone: '', role: u.role, emailVerified: u.emailVerified, active: u.active };
    this.formOpen.set(true);
  }
  save(): void {
    const f = this.form;
    if (!f.email || !f.firstName || !f.lastName || (!this.editingId() && !f.password)) {
      this.formError.set(this.t.translate('admin.userFormIncomplete')); return;
    }
    this.saving.set(true); this.formError.set('');
    const id = this.editingId();
    const req$ = id ? this.admin.updateUser(id, f) : this.admin.createUser(f);
    req$.pipe(catchError(() => { this.formError.set(this.t.translate('admin.saveFailed')); return of(null); })).subscribe(res => {
      this.saving.set(false);
      if (!res) return;
      this.formOpen.set(false);
      this.toast.ok(this.t.translate(id ? 'admin.itemUpdated' : 'admin.itemCreated'));
      this.load();
    });
  }
}
