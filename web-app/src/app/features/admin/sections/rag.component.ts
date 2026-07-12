import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AdminService, RagStatus } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminStatTileComponent } from '../ui/admin-stat-tile.component';
import { AdminBarsComponent, ChartDatum } from '../ui/admin-charts.component';
import { AdminToastService } from '../ui/admin-toast.service';
import { AdminConfirmService } from '../ui/admin-confirm.service';

/** RAG console: vector-store health, per-type document spread, and a guarded rebuild. */
@Component({
  selector: 'app-admin-rag',
  standalone: true,
  imports: [TranslocoModule, AdminSectionComponent, AdminStatTileComponent, AdminBarsComponent],
  styleUrls: ['./section-shared.scss'],
  styles: [`
    .rag-kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 260px)); gap: var(--ad-sp-4); margin-bottom: var(--ad-sp-6); }
    .rag-panel { background: var(--ad-surface); border: 1px solid var(--ad-line); border-radius: var(--ad-r-md); padding: var(--ad-sp-5); max-width: 640px; }
    .rag-panel__h { font-size: var(--ad-fx-h2); font-weight: 700; margin: 0 0 var(--ad-sp-5); }
    .rag-actions { display: flex; align-items: center; gap: var(--ad-sp-4); margin-top: var(--ad-sp-6); }
    .rag-hint { color: var(--ad-text-faint); font-size: var(--ad-fx-xs); margin: 0; }
    @media (max-width: 560px) { .rag-kpis { grid-template-columns: 1fr; } }
  `],
  template: `
    <admin-section eyebrow="05 / SYSTEM" [title]="'admin.navRag' | transloco" [state]="state()" (retry)="load()">
      <div class="rag-kpis">
        <admin-stat-tile [label]="'admin.ragDocuments' | transloco" [value]="status()?.totalDocuments ?? 0" />
        <admin-stat-tile [label]="'admin.ragStatus' | transloco"
          [value]="(status()?.populated ? 'admin.ragReady' : 'admin.ragEmpty') | transloco"
          [tone]="status()?.populated ? 'ok' : 'warn'" />
      </div>

      <div class="rag-panel">
        <h2 class="rag-panel__h">{{ 'admin.ragByType' | transloco }}</h2>
        <admin-bars [data]="byType()" />
        <div class="rag-actions">
          <button type="button" class="sec-btn sec-btn--primary" [disabled]="busy()" (click)="rebuild()">
            <span class="ad-ms">{{ busy() ? 'hourglass_top' : 'refresh' }}</span>
            {{ (busy() ? 'admin.ragRebuilding' : 'admin.ragRebuild') | transloco }}
          </button>
          <p class="rag-hint">{{ 'admin.ragHint' | transloco }}</p>
        </div>
      </div>
    </admin-section>
  `,
})
export class AdminRagComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(AdminToastService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly t = inject(TranslocoService);

  readonly status = signal<RagStatus | null>(null);
  readonly state = signal<SectionState>('loading');
  readonly busy = signal(false);

  readonly byType = computed<ChartDatum[]>(() =>
    Object.entries(this.status()?.byType ?? {}).map(([label, value]) => ({ label, value })));

  constructor() { this.load(); }
  load(): void {
    this.state.set('loading');
    this.admin.ragStatus().pipe(catchError(() => of(null))).subscribe(s => { this.status.set(s); this.state.set(s ? 'ready' : 'error'); });
  }

  async rebuild(): Promise<void> {
    if (this.busy()) return;
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.ragRebuild'), message: this.t.translate('admin.ragRebuildConfirm'),
      confirmLabel: this.t.translate('admin.ragRebuild'), cancelLabel: this.t.translate('admin.cancel'), tone: 'accent',
    });
    if (!ok) return;
    this.busy.set(true);
    this.admin.ragReingest().pipe(catchError(() => of(null))).subscribe(res => {
      this.busy.set(false);
      if (res) { this.toast.ok(this.t.translate('admin.ragRebuilt', { count: res.documentsIngested })); this.load(); }
      else this.toast.error(this.t.translate('admin.ragRebuildFailed'));
    });
  }
}
