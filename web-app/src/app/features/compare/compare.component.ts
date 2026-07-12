import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CompareService } from './compare.service';
import {
  UiSpecSheetComponent,
  UiKickerComponent,
  UiButtonComponent,
  UiEmptyComponent,
  type SpecColumn,
  type SpecRow,
  type SpecCell,
} from '../../shared/ui';

/** Side-by-side hotel comparison rendered as a Swiss spec sheet. Route: /compare */
@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [
    TranslocoModule, RouterLink, UiSpecSheetComponent, UiKickerComponent,
    UiButtonComponent, UiEmptyComponent,
  ],
  template: `
    <div class="cmp">
      <a routerLink="/hotels" class="cmp__back">
        <span class="ms" aria-hidden="true">arrow_back</span> {{ t('catalog.compare.back') }}
      </a>

      <header class="cmp__head">
        <app-ui-kicker [rule]="true">{{ t('catalog.compare.title') }}</app-ui-kicker>
        <p class="cmp__sub">{{ t('catalog.compare.subtitle') }}</p>
      </header>

      @if (svc.count() < 2) {
        <app-ui-empty icon="balance" [title]="t('catalog.compare.title')" [message]="t('catalog.compare.empty')">
          <app-ui-button variant="primary" icon="hotel" (clicked)="go('/hotels')">{{ t('catalog.hotels') }}</app-ui-button>
        </app-ui-empty>
      } @else {
        <app-ui-spec-sheet [columns]="columns()" [rows]="rows()" [highlight]="cheapestId()" />

        <div class="cmp__actions" [style.--n]="svc.count()">
          <span></span>
          @for (h of svc.items(); track h.id) {
            <div class="cmp__action">
              <app-ui-button variant="outline" size="sm" (clicked)="go('/hotels/' + h.id)">{{ t('catalog.view') }}</app-ui-button>
              <button type="button" class="cmp__remove" (click)="svc.remove(h.id)" [attr.aria-label]="t('catalog.clearAll')">
                <span class="ms" aria-hidden="true">close</span>
              </button>
            </div>
          }
        </div>

        <div class="cmp__foot">
          <app-ui-button variant="ghost" icon="restart_alt" (clicked)="svc.clear()">{{ t('catalog.clearAll') }}</app-ui-button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; background: var(--bg-primary); min-height: 100vh; }
      .cmp { max-width: 960px; margin: 0 auto; padding: 88px 24px 80px; }
      .cmp__back {
        display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
        color: var(--color-red-ink); font-size: 0.85rem; font-weight: 600; margin-bottom: 20px;
      }
      .cmp__back .ms { font-size: 18px; }
      .cmp__head { margin-bottom: 24px; }
      .cmp__sub { margin: 12px 0 0; color: var(--text-secondary); font-size: 0.95rem; }

      .cmp__actions {
        display: grid; grid-template-columns: 1.3fr repeat(var(--n, 3), 1fr);
        border: 1px solid var(--border); border-top: none;
      }
      .cmp__action {
        display: flex; align-items: center; gap: 8px; padding: 12px;
        border-right: 1px solid var(--border-light, #EEEBE3);
      }
      .cmp__action:last-child { border-right: none; }
      .cmp__remove {
        border: none; background: none; cursor: pointer; color: var(--text-subtle, var(--text-tertiary));
        display: inline-flex;
      }
      .cmp__remove:hover { color: var(--color-red-ink); }
      .cmp__remove .ms { font-size: 18px; }

      .cmp__foot { margin-top: 18px; }
    `,
  ],
})
export class CompareComponent {
  readonly svc = inject(CompareService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  private readonly currency = new Intl.NumberFormat(undefined, {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  });

  readonly columns = computed<SpecColumn[]>(() =>
    this.svc.items().map((h) => ({ id: h.id, label: h.name, sublabel: h.city }))
  );

  readonly cheapestId = computed(() => {
    const items = this.svc.items();
    if (!items.length) return '';
    return items.reduce((a, b) => (b.pricePerNight < a.pricePerNight ? b : a)).id;
  });

  readonly rows = computed<SpecRow[]>(() => {
    const items = this.svc.items();
    if (items.length < 2) return [];
    const minPrice = Math.min(...items.map((h) => h.pricePerNight));
    const maxPrice = Math.max(...items.map((h) => h.pricePerNight));
    const maxStars = Math.max(...items.map((h) => h.stars));
    const span = maxPrice - minPrice || 1;

    const yn = (v: boolean): SpecCell => ({ display: v ? this.t('catalog.compare.yes') : this.t('catalog.compare.no'), muted: !v });

    return [
      { label: this.t('catalog.compare.rows.price'), cells: items.map((h) => ({
        display: this.currency.format(h.pricePerNight),
        best: h.pricePerNight === minPrice,
        bar: (h.pricePerNight - minPrice) / span * 0.8 + 0.2,
      })) },
      { label: this.t('catalog.compare.rows.stars'), cells: items.map((h) => ({
        display: '★'.repeat(h.stars),
        best: h.stars === maxStars,
      })) },
      { label: this.t('catalog.compare.rows.city'), cells: items.map((h) => ({ display: h.city, mono: true })) },
      { label: this.t('catalog.compare.rows.sea'), cells: items.map((h) => yn(h.seaProximity)) },
      { label: this.t('catalog.compare.rows.family'), cells: items.map((h) => yn(h.familyFriendly)) },
      { label: this.t('catalog.compare.rows.pet'), cells: items.map((h) => yn(h.petFriendly)) },
      { label: this.t('catalog.compare.rows.accessible'), cells: items.map((h) => yn(h.accessible)) },
    ];
  });

  t(key: string): string {
    return this.transloco.translate(key);
  }

  go(path: string): void {
    this.router.navigateByUrl(path);
  }
}
