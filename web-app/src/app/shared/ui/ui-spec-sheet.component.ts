import { Component, computed, input } from '@angular/core';

export interface SpecColumn {
  id: string;
  label: string;
  sublabel?: string;
}

export interface SpecCell {
  /** Rendered text, e.g. "€182" or "0.4 km". */
  display: string;
  /** Marks this the winning cell in its row (red square + red text). */
  best?: boolean;
  /** 0..1 — draws an inline comparison bar of that fraction. */
  bar?: number;
  /** Dim the value (e.g. a missing amenity). */
  muted?: boolean;
  /** Render in the mono/technical face. */
  mono?: boolean;
}

export interface SpecRow {
  label: string;
  /** One cell per column, in column order. */
  cells: SpecCell[];
}

/**
 * Swiss spec-sheet — compare options like a technical datasheet. Columns are
 * the options, rows are attributes; the winning cell per row carries a red
 * mark, numeric cells can draw an inline bar. Figures render tabular.
 */
@Component({
  selector: 'app-ui-spec-sheet',
  standalone: true,
  template: `
    <div class="ss">
      <div class="ss__row ss__row--head">
        <div class="ss__attr"></div>
        @for (c of columns(); track c.id) {
          <div class="ss__col" [class.ss__col--hl]="c.id === highlight()">
            <span class="ss__col-label">{{ c.label }}</span>
            @if (c.sublabel) { <span class="ss__col-sub">{{ c.sublabel }}</span> }
          </div>
        }
      </div>
      @for (r of rows(); track r.label) {
        <div class="ss__row">
          <div class="ss__attr">{{ r.label }}</div>
          @for (cell of r.cells; track $index) {
            <div class="ss__cell" [class.ss__cell--best]="cell.best" [class.ss__cell--muted]="cell.muted">
              <span class="ss__val" [class.ss__val--mono]="cell.mono">{{ cell.display }}</span>
              @if (cell.best) { <span class="ss__mark" aria-hidden="true"></span> }
              @if (cell.bar != null) {
                <span class="ss__bar"><span class="ss__bar-fill" [style.width.%]="clamp(cell.bar) * 100"></span></span>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; border: 1px solid var(--border); background: var(--surface); }
      .ss { display: block; }
      .ss__row {
        display: grid;
        grid-template-columns: 1.3fr repeat(var(--ss-cols, 3), 1fr);
        border-bottom: 1px solid var(--border-light, #EEEBE3);
        align-items: center;
      }
      .ss__row:last-child { border-bottom: none; }
      .ss__row--head { border-bottom: 1px solid var(--color-ink); }

      .ss__attr { padding: 11px 14px; font-size: 12px; color: var(--text-secondary); }
      .ss__col { padding: 10px 12px; font-family: var(--font-mono); }
      .ss__col-label {
        display: block; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--text-secondary);
      }
      .ss__col--hl .ss__col-label { color: var(--color-ink); }
      .ss__col-sub { display: block; font-size: 9.5px; color: var(--text-subtle, var(--text-tertiary)); }

      .ss__cell { padding: 11px 12px; display: flex; align-items: center; gap: 6px; }
      .ss__val { font-weight: 800; font-size: 15px; color: var(--color-ink); font-variant-numeric: tabular-nums; white-space: nowrap; }
      .ss__val--mono { font-family: var(--font-mono); font-weight: 500; font-size: 13px; }
      .ss__cell--muted .ss__val { color: var(--text-subtle, var(--text-tertiary)); font-weight: 500; }
      .ss__cell--best .ss__val { color: var(--color-red-ink, #C42A22); }
      .ss__mark { width: 7px; height: 7px; background: var(--color-red); flex: 0 0 auto; }
      .ss__bar { flex: 1; height: 5px; background: var(--bg-tertiary); min-width: 20px; max-width: 60px; }
      .ss__bar-fill { display: block; height: 100%; background: var(--color-ink); }
      .ss__cell--best .ss__bar-fill { background: var(--color-red); }
    `,
  ],
  host: { '[style.--ss-cols]': 'columns().length || 3' },
})
export class UiSpecSheetComponent {
  readonly columns = input<SpecColumn[]>([]);
  readonly rows = input<SpecRow[]>([]);
  /** Column id to emphasise (e.g. the recommended option). */
  readonly highlight = input<string>('');

  clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
  }
}
