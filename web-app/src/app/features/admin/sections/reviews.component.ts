import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, AdminReview } from '../../../core/services/admin.service';
import { AdminSectionComponent, SectionState } from '../ui/admin-section.component';
import { AdminDataTableComponent, TableColumn } from '../ui/admin-data-table.component';
import { AdminTableCellDirective } from '../ui/admin-table-cell.directive';
import { AdminStatusBadgeComponent } from '../ui/admin-status-badge.component';
import { AdminDrawerComponent } from '../ui/admin-drawer.component';
import { UiRatingComponent } from '../../../shared/ui/ui-rating.component';
import { AdminToastService } from '../ui/admin-toast.service';
import { AdminConfirmService } from '../ui/admin-confirm.service';
import { parseListState, buildListParams, ListState, PAGE_SIZE } from '../state/list-query';

/** Reviews moderation: rating-forward table with guarded delete. */
@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [
    TranslocoModule, AdminSectionComponent, AdminDataTableComponent,
    AdminTableCellDirective, AdminStatusBadgeComponent, AdminDrawerComponent, UiRatingComponent,
  ],
  styleUrls: ['./section-shared.scss'],
  styles: [`
    .rv-title { display: flex; flex-direction: column; gap: 2px; max-width: 42ch; }
    .rv-title__t { font-weight: 600; }
    .rv-title__c { font-size: var(--ad-fx-xs); color: var(--ad-text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rv-d { display: flex; flex-direction: column; gap: var(--ad-sp-4); }
    .rv-d__head { display: flex; align-items: center; gap: var(--ad-sp-3); flex-wrap: wrap; }
    .rv-d__body { font-size: var(--ad-fx-md); line-height: 1.6; color: var(--ad-text); white-space: pre-wrap; }
    .rv-d__meta { font-size: var(--ad-fx-sm); color: var(--ad-text-dim); border-top: 1px solid var(--ad-line-soft); padding-top: var(--ad-sp-3); }
  `],
  template: `
    <admin-section eyebrow="03 / OPERATIONS" [title]="'admin.navReviews' | transloco" [count]="total()"
                   [state]="state()" (retry)="load()">
      <admin-data-table
        [columns]="columns()" [rows]="rows()" [total]="total()" [page]="s().page" [size]="pageSize"
        [loading]="loading()" [rowClickable]="true" (rowClick)="openDetail($any($event))" (pageChange)="onPage($event)">

        <ng-template adCell="rating" let-r>
          <app-ui-rating [value]="r.rating" />
        </ng-template>
        <ng-template adCell="targetType" let-r>
          <admin-status-badge tone="neutral" [dot]="false">{{ r.targetType }}</admin-status-badge>
        </ng-template>
        <ng-template adCell="title" let-r>
          <span class="rv-title">
            <span class="rv-title__t">{{ r.title || ('admin.untitledReview' | transloco) }}</span>
            <span class="rv-title__c">{{ r.content }}</span>
          </span>
        </ng-template>
        <ng-template adCell="actions" let-r>
          <div class="row-actions">
            <button type="button" class="ra ra--danger" (click)="remove(r)" [title]="'admin.delete' | transloco"><span class="ad-ms">delete</span></button>
          </div>
        </ng-template>
      </admin-data-table>
    </admin-section>

    <admin-drawer [open]="detailOpen()" eyebrow="REVIEW" [width]="480"
                  [title]="detail()?.title || ('admin.untitledReview' | transloco)" (closed)="detailOpen.set(false)">
      @if (detail(); as r) {
        <div class="rv-d">
          <div class="rv-d__head">
            <app-ui-rating [value]="r.rating" />
            <admin-status-badge tone="neutral" [dot]="false">{{ r.targetType }}</admin-status-badge>
          </div>
          <p class="rv-d__body">{{ r.content }}</p>
          <div class="rv-d__meta">{{ 'admin.by' | transloco }} {{ r.authorName }}@if (r.authorEmail) { · {{ r.authorEmail }} } · {{ dt(r.createdAt) }}</div>
        </div>
      }
      @if (detail(); as r) {
        <button type="button" slot="actions" class="sec-btn" (click)="remove(r)"><span class="ad-ms">delete</span> {{ 'admin.delete' | transloco }}</button>
      }
    </admin-drawer>
  `,
})
export class AdminReviewsComponent {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(AdminToastService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly t = inject(TranslocoService);

  readonly pageSize = PAGE_SIZE;
  readonly rows = signal<AdminReview[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly state = signal<SectionState>('loading');
  readonly s = signal<ListState>({ page: 0, sortKey: null, sortDir: 'asc', q: '', status: '', filters: {} });
  readonly detail = signal<AdminReview | null>(null);
  readonly detailOpen = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(pm => { this.s.set(parseListState(pm)); this.load(); });
  }

  columns(): TableColumn[] {
    return [
      { key: 'rating', label: this.t.translate('admin.thRating'), kind: 'custom', width: '90px' },
      { key: 'targetType', label: this.t.translate('admin.thTarget'), kind: 'custom' },
      { key: 'title', label: this.t.translate('admin.thReview'), kind: 'custom' },
      { key: 'authorName', label: this.t.translate('admin.by'), kind: 'text' },
      { key: 'createdAt', label: this.t.translate('admin.thCreated'), kind: 'date' },
    ];
  }

  load(): void {
    const s = this.s();
    this.loading.set(true);
    if (!this.rows().length) this.state.set('loading');
    this.admin.reviews(s.page, this.pageSize).pipe(catchError(() => of(null))).subscribe(res => {
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

  openDetail(r: AdminReview): void { this.detail.set(r); this.detailOpen.set(true); }
  dt(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  }

  async remove(r: AdminReview): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.t.translate('admin.delete'), message: this.t.translate('admin.deleteReviewConfirm'),
      confirmLabel: this.t.translate('admin.delete'), cancelLabel: this.t.translate('admin.cancel'), tone: 'danger',
    });
    if (!ok) return;
    this.admin.deleteReview(r.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.rows.update(list => list.filter(x => x.id !== r.id));
      this.toast.ok(this.t.translate('admin.reviewDeleted'));
    });
  }
}
