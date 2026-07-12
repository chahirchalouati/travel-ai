import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AdminService, FeatureFlag, FeatureFlagUpsert } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { UiToggleComponent } from '../../../shared/ui/ui-toggle.component';
import { UiCheckboxComponent } from '../../../shared/ui/ui-checkbox.component';
import { UiInputComponent } from '../../../shared/ui/ui-input.component';
import { AdminToastService } from '../ui/admin-toast.service';
import { AdminConfirmService } from '../ui/admin-confirm.service';

const ROLES = ['TRAVELER', 'PARTNER', 'OPERATIONS', 'ADMIN'];
const KEY_RE = /^[a-z0-9._-]{2,80}$/;
type RoleMap = Record<string, boolean>;

/** Feature flags: create, rollout %, role targeting, toggle and delete. */
@Component({
  selector: 'app-admin-flags',
  standalone: true,
  imports: [
    FormsModule, TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminStatusBadgeComponent, AdminDrawerComponent,
    UiToggleComponent, UiCheckboxComponent, UiInputComponent,
  ],
  styleUrls: ['./section-shared.scss'],
  styles: [`
    .ff-new { background: var(--ad-surface); border: 1px solid var(--ad-line); border-radius: var(--ad-r-md); padding: var(--ad-sp-5); margin-bottom: var(--ad-sp-5); }
    .ff-new__grid { display: grid; grid-template-columns: 1.2fr 1.5fr 1fr auto; gap: var(--ad-sp-3); align-items: end; }
    .ff-roll { display: flex; align-items: center; gap: 6px; }
    .ff-roll input { width: 64px; }
    .ff-key { display: flex; flex-direction: column; gap: 2px; }
    .ff-key__k { font-family: var(--ad-mono); font-weight: 600; }
    .ff-key__d { font-size: var(--ad-fx-xs); color: var(--ad-text-dim); }
    .ff-chips { display: inline-flex; gap: 4px; flex-wrap: wrap; }
    .ff-roles { display: flex; gap: 6px; flex-wrap: wrap; margin-top: var(--ad-sp-2); align-items: center; }
    @media (max-width: 800px) { .ff-new__grid { grid-template-columns: 1fr 1fr; } }
  `],
  template: `
    <admin-section eyebrow="05 / SYSTEM" [title]="'admin.navFlags' | transloco" [count]="rows().length"
                   [state]="state()" (retry)="load()">
      <div class="ff-new">
        <span class="fld__l">{{ 'admin.flagNew' | transloco }}</span>
        <div class="ff-new__grid">
          <input type="text" [(ngModel)]="nkey" [placeholder]="'admin.flagKeyPlaceholder' | transloco" />
          <input type="text" [(ngModel)]="ndesc" [placeholder]="'admin.fDescription' | transloco" />
          <input type="text" [(ngModel)]="ngroup" [placeholder]="'admin.flagGroup' | transloco" />
          <label class="ff-roll"><input type="number" min="0" max="100" [(ngModel)]="nrollout" /> %</label>
        </div>
        <div class="ff-roles">
          @for (r of allRoles; track r) {
            <app-ui-checkbox [label]="r" [checked]="!!nroles[r]" (checkedChange)="nroles[r] = $event" />
          }
          <button type="button" class="sec-btn sec-btn--primary" (click)="create()"><span class="ad-ms">add</span> {{ 'admin.flagAdd' | transloco }}</button>
        </div>
      </div>

      <admin-data-table [columns]="columns()" [rows]="rows()" [total]="rows().length" [size]="500" [loading]="loading()"
                        [rowClickable]="true" (rowClick)="openEdit($any($event))">
        <ng-template adCell="key" let-f>
          <span class="ff-key"><span class="ff-key__k">{{ f.key }}</span>@if (f.description) { <span class="ff-key__d">{{ f.description }}</span> }</span>
        </ng-template>
        <ng-template adCell="groupName" let-f>
          @if (f.groupName) { <admin-status-badge tone="neutral" [dot]="false">{{ f.groupName }}</admin-status-badge> } @else { <span class="muted">—</span> }
        </ng-template>
        <ng-template adCell="rolloutPercentage" let-f>
          <admin-status-badge [tone]="rolloutTone(f.rolloutPercentage)" [dot]="false">{{ f.rolloutPercentage }}%</admin-status-badge>
        </ng-template>
        <ng-template adCell="targetRoles" let-f>
          @if (f.targetRoles) {
            <span class="ff-chips">@for (r of splitRoles(f.targetRoles); track r) { <admin-status-badge tone="neutral" [dot]="false">{{ r }}</admin-status-badge> }</span>
          } @else { <span class="muted">{{ 'admin.flagAllRoles' | transloco }}</span> }
        </ng-template>
        <ng-template adCell="enabled" let-f>
          <span (click)="$event.stopPropagation()"><app-ui-toggle [value]="f.enabled" (valueChange)="toggle(f)" /></span>
        </ng-template>
        <ng-template adCell="actions" let-f>
          <div class="row-actions">
            <button type="button" class="ra" (click)="openEdit(f)" [title]="'admin.edit' | transloco"><span class="ad-ms">tune</span></button>
            <button type="button" class="ra ra--danger" (click)="remove(f)" [title]="'admin.delete' | transloco"><span class="ad-ms">delete</span></button>
          </div>
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="editOpen()" eyebrow="FLAG" [title]="'admin.flagConfigure' | transloco" [width]="440" (closed)="editOpen.set(false)">
      <div class="form-grid">
        <label class="fld fld--full" [attr.for]="feDesc.inputId()"><span class="fld__l">{{ 'admin.fDescription' | transloco }}</span><app-ui-input #feDesc [(ngModel)]="edesc" [ariaLabel]="'admin.fDescription' | transloco" /></label>
        <label class="fld" [attr.for]="feGroup.inputId()"><span class="fld__l">{{ 'admin.flagGroup' | transloco }}</span><app-ui-input #feGroup [(ngModel)]="egroup" [ariaLabel]="'admin.flagGroup' | transloco" /></label>
        <label class="fld"><span class="fld__l">{{ 'admin.flagRollout' | transloco }} %</span><input type="number" min="0" max="100" [(ngModel)]="erollout" /></label>
        <div class="fld fld--full"><span class="fld__l">{{ 'admin.flagRoles' | transloco }}</span>
          <div class="ff-roles">
            @for (r of allRoles; track r) { <app-ui-checkbox [label]="r" [checked]="!!eroles[r]" (checkedChange)="eroles[r] = $event" /> }
          </div>
          <p class="rag-hint" style="color:var(--ad-text-faint);font-size:var(--ad-fx-xs);margin:8px 0 0">{{ 'admin.flagRolesHint' | transloco }}</p>
        </div>
      </div>
      <div slot="actions">
        <button type="button" class="sec-btn sec-btn--primary" (click)="saveEdit()">{{ 'admin.save' | transloco }}</button>
      </div>
    </admin-drawer>
  `,
})
export class AdminFlagsComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(AdminToastService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly t = inject(TranslocoService);

  readonly allRoles = ROLES;
  readonly rows = signal<FeatureFlag[]>([]);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');

  // Create form
  nkey = ''; ndesc = ''; ngroup = ''; nrollout = 100; nroles: RoleMap = {};
  // Edit drawer
  readonly editOpen = signal(false);
  editKey = ''; editEnabled = true; edesc = ''; egroup = ''; erollout = 100; eroles: RoleMap = {};

  constructor() { this.load(); }

  columns(): TableColumn[] {
    return [
      { key: 'key', label: this.t.translate('admin.flagKey'), kind: 'custom' },
      { key: 'groupName', label: this.t.translate('admin.flagGroup'), kind: 'custom' },
      { key: 'rolloutPercentage', label: this.t.translate('admin.flagRollout'), kind: 'custom' },
      { key: 'targetRoles', label: this.t.translate('admin.flagRoles'), kind: 'custom' },
      { key: 'enabled', label: this.t.translate('admin.thStatus'), kind: 'custom' },
    ];
  }

  load(): void {
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    this.admin.featureFlags().pipe(catchError(() => of(null))).subscribe(f => {
      this.loading.set(false);
      if (!f) { this.state.set('error'); return; }
      this.rows.set(f);
      this.state.set(f.length ? 'ready' : 'empty');
    });
  }

  splitRoles(csv: string): string[] { return csv.split(',').map(x => x.trim()).filter(Boolean); }
  rolloutTone(pct: number): 'ok' | 'danger' | 'info' { return pct >= 100 ? 'ok' : pct <= 0 ? 'danger' : 'info'; }
  private rolesCsv(m: RoleMap): string | null { const p = ROLES.filter(r => m[r]); return p.length ? p.join(',') : null; }
  private clamp(v: number): number { const n = Number(v); return Number.isNaN(n) ? 100 : Math.max(0, Math.min(100, Math.round(n))); }

  create(): void {
    const key = this.nkey.trim().toLowerCase();
    if (!KEY_RE.test(key)) { this.toast.error(this.t.translate('admin.flagKeyInvalid')); return; }
    const payload: FeatureFlagUpsert = {
      key, enabled: false, description: this.ndesc || null,
      rolloutPercentage: this.clamp(this.nrollout), targetRoles: this.rolesCsv(this.nroles), groupName: this.ngroup || null,
    };
    this.admin.upsertFlag(payload).pipe(catchError(() => of(null))).subscribe(created => {
      if (!created) { this.toast.error(this.t.translate('admin.saveFailed')); return; }
      this.nkey = ''; this.ndesc = ''; this.ngroup = ''; this.nrollout = 100; this.nroles = {};
      this.toast.ok(this.t.translate('admin.flagCreated')); this.load();
    });
  }

  toggle(f: FeatureFlag): void {
    this.admin.toggleFlag(f.id, !f.enabled).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) { this.rows.update(l => l.map(x => x.id === f.id ? updated : x)); this.toast.ok(this.t.translate(updated.enabled ? 'admin.flagEnabled' : 'admin.flagDisabled', { key: updated.key })); }
      else this.toast.error(this.t.translate('admin.saveFailed'));
    });
  }

  openEdit(f: FeatureFlag): void {
    this.editKey = f.key; this.editEnabled = f.enabled;
    this.edesc = f.description ?? ''; this.egroup = f.groupName ?? ''; this.erollout = f.rolloutPercentage;
    this.eroles = {}; this.splitRoles(f.targetRoles ?? '').forEach(r => this.eroles[r] = true);
    this.editOpen.set(true);
  }
  saveEdit(): void {
    const payload: FeatureFlagUpsert = {
      key: this.editKey, enabled: this.editEnabled, description: this.edesc || null,
      rolloutPercentage: this.clamp(this.erollout), targetRoles: this.rolesCsv(this.eroles), groupName: this.egroup || null,
    };
    this.admin.upsertFlag(payload).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) { this.editOpen.set(false); this.toast.ok(this.t.translate('admin.flagUpdated')); this.load(); }
      else this.toast.error(this.t.translate('admin.saveFailed'));
    });
  }

  async remove(f: FeatureFlag): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.delete'), message: this.t.translate('admin.flagDeleteConfirm', { key: f.key }),
      confirmLabel: this.t.translate('admin.delete'), cancelLabel: this.t.translate('admin.cancel'), tone: 'danger',
    });
    if (!ok) return;
    this.admin.deleteFlag(f.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.rows.update(l => l.filter(x => x.id !== f.id)); this.toast.ok(this.t.translate('admin.flagDeleted'));
    });
  }
}
