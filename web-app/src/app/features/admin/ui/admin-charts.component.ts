import { Component, Input, computed, signal } from '@angular/core';

export interface ChartDatum {
  label: string;
  value: number;
  /** Optional explicit color; falls back to the series palette. */
  color?: string;
}

const SERIES = [
  'var(--ad-c1)', 'var(--ad-c2)', 'var(--ad-c3)', 'var(--ad-c4)',
  'var(--ad-c5)', 'var(--ad-c6)', 'var(--ad-c7)',
];

/**
 * Horizontal bar chart — dense, label-friendly, palette-consistent. Values are
 * scaled to the max. Formats numbers with an optional prefix (e.g. currency).
 */
@Component({
  selector: 'admin-bars',
  standalone: true,
  template: `
    <div class="ad-bars">
      @for (d of data; track d.label; let i = $index) {
        <div class="ad-bars__row">
          <span class="ad-bars__label">{{ d.label }}</span>
          <span class="ad-bars__track">
            <span class="ad-bars__fill" [style.width.%]="pct(d.value)" [style.background]="d.color || color(i)"></span>
          </span>
          <span class="ad-bars__val ad-mono">{{ fmt(d.value) }}</span>
        </div>
      } @empty { <p class="ad-bars__empty">—</p> }
    </div>
  `,
  styles: [`
    .ad-bars { display: flex; flex-direction: column; gap: var(--ad-sp-3); }
    .ad-bars__row { display: grid; grid-template-columns: minmax(88px, 34%) 1fr auto; align-items: center; gap: var(--ad-sp-3); }
    .ad-bars__label { font-size: var(--ad-fx-sm); color: var(--ad-text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ad-bars__track { height: 9px; background: var(--ad-inset); border-radius: var(--ad-r-pill); overflow: hidden; }
    .ad-bars__fill { display: block; height: 100%; border-radius: var(--ad-r-pill); min-width: 2px;
      transition: width var(--ad-dur-slow) var(--ad-ease-out); }
    .ad-bars__val { font-size: var(--ad-fx-xs); color: var(--ad-text); text-align: right; min-width: 40px; }
    .ad-bars__empty { color: var(--ad-text-faint); margin: 0; }
  `],
})
export class AdminBarsComponent {
  @Input() data: ChartDatum[] = [];
  @Input() prefix = '';
  private max = computed(() => Math.max(1, ...this.data.map(d => d.value)));
  pct(v: number): number { return Math.max(0, (v / this.max()) * 100); }
  color(i: number): string { return SERIES[i % SERIES.length]; }
  fmt(v: number): string {
    const n = v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${Math.round(v * 100) / 100}`;
    return `${this.prefix}${n}`;
  }
}

/**
 * Donut chart with a labelled center total and a legend. Segments are drawn with
 * stroke-dasharray on concentric circles so hover can lift a slice.
 */
@Component({
  selector: 'admin-donut',
  standalone: true,
  template: `
    <div class="ad-donut">
      <svg viewBox="0 0 42 42" class="ad-donut__svg" role="img" [attr.aria-label]="centerLabel">
        <circle class="ad-donut__ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--ad-inset)" stroke-width="4"></circle>
        @for (s of arcs(); track s.label; let i = $index) {
          <circle cx="21" cy="21" r="15.915" fill="transparent" [attr.stroke]="s.color"
                  stroke-width="4" [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset"
                  [class.ad-donut__slice--hot]="hover() === i"
                  (mouseenter)="hover.set(i)" (mouseleave)="hover.set(-1)"
                  transform="rotate(-90 21 21)"></circle>
        }
        <text x="21" y="20" class="ad-donut__total">{{ total() > 0 ? centerValue : '—' }}</text>
        <text x="21" y="25.5" class="ad-donut__cap">{{ centerLabel }}</text>
      </svg>
      <ul class="ad-donut__legend">
        @for (s of arcs(); track s.label; let i = $index) {
          <li [class.ad-donut__leg--hot]="hover() === i" (mouseenter)="hover.set(i)" (mouseleave)="hover.set(-1)">
            <span class="ad-donut__swatch" [style.background]="s.color"></span>
            <span class="ad-donut__leg-label">{{ s.label }}</span>
            <span class="ad-donut__leg-val ad-mono">{{ s.pct }}%</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .ad-donut { display: flex; align-items: center; gap: var(--ad-sp-6); flex-wrap: wrap; }
    .ad-donut__svg { width: 148px; height: 148px; flex: none; }
    .ad-donut__ring { opacity: 0.6; }
    .ad-donut__svg circle { transition: stroke-width var(--ad-dur) var(--ad-ease), opacity var(--ad-dur); cursor: pointer; }
    .ad-donut__slice--hot { stroke-width: 5.4; }
    .ad-donut__total { font-family: var(--ad-mono); font-size: 6px; font-weight: 600; fill: var(--ad-text); text-anchor: middle; }
    .ad-donut__cap { font-family: var(--ad-mono); font-size: 2.4px; letter-spacing: 0.14em; fill: var(--ad-text-faint); text-anchor: middle; text-transform: uppercase; }
    .ad-donut__legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ad-sp-2); min-width: 160px; flex: 1; }
    .ad-donut__legend li { display: flex; align-items: center; gap: var(--ad-sp-2); padding: 3px 6px; border-radius: var(--ad-r-xs); transition: background var(--ad-dur-fast); cursor: default; }
    .ad-donut__leg--hot { background: var(--ad-surface-2); }
    .ad-donut__swatch { width: 9px; height: 9px; border-radius: 2px; flex: none; }
    .ad-donut__leg-label { font-size: var(--ad-fx-sm); color: var(--ad-text-dim); flex: 1; }
    .ad-donut__leg-val { font-size: var(--ad-fx-xs); color: var(--ad-text); }
  `],
})
export class AdminDonutComponent {
  @Input() data: ChartDatum[] = [];
  @Input() centerLabel = '';
  @Input() centerValue = '';
  readonly hover = signal(-1);

  total = computed(() => this.data.reduce((s, d) => s + Math.max(0, d.value), 0));

  arcs = computed(() => {
    const total = this.total();
    let acc = 0;
    return this.data.map((d, i) => {
      const frac = total > 0 ? Math.max(0, d.value) / total : 0;
      const len = frac * 100;
      const arc = { label: d.label, color: d.color || SERIES[i % SERIES.length],
        dash: `${len} ${100 - len}`, offset: `${-acc}`, pct: Math.round(frac * 100) };
      acc += len;
      return arc;
    });
  });
}
