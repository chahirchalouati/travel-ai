import { Component, computed, input, model, output } from '@angular/core';

export interface FareDay {
  /** ISO date (used to derive the label if `label` is omitted). */
  date?: string;
  /** Explicit short label, e.g. "Wed 16". Overrides the derived one. */
  label?: string;
  price: number;
  available?: boolean;
}

/**
 * Swiss fare grid — a week/strip of day cells showing each price with a
 * relative bar; the cheapest available day is marked red. Click to select.
 * Two-way `[(selected)]` holds the chosen index (-1 = none).
 */
@Component({
  selector: 'app-ui-fare-grid',
  standalone: true,
  template: `
    <div class="fg">
      @for (d of days(); track $index) {
        <button
          type="button"
          class="fg__cell"
          [class.fg__cell--cheap]="$index === cheapestIndex()"
          [class.fg__cell--on]="$index === selected()"
          [class.fg__cell--off]="d.available === false"
          [disabled]="d.available === false"
          (click)="pick($index)"
        >
          <span class="fg__day">{{ labelFor(d) }}</span>
          <span class="fg__price">{{ d.available === false ? '—' : format(d.price) }}</span>
          <span class="fg__bar" [style.height.px]="barHeight(d.price)"></span>
        </button>
      }
    </div>
    <div class="fg__legend">
      <span><i class="fg__key fg__key--cheap"></i>cheapest</span>
      <span><i class="fg__key fg__key--rel"></i>bar = relative price</span>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .fg {
        display: grid;
        grid-template-columns: repeat(var(--fg-cols, 7), 1fr);
        gap: 8px;
      }
      .fg__cell {
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        border: 1px solid var(--border); background: var(--surface);
        padding: 8px 6px; cursor: pointer; font-family: inherit;
        transition: border-color 140ms ease, background 140ms ease;
      }
      .fg__cell:hover:not(:disabled) { border-color: var(--color-ink); }
      .fg__cell--on { border-color: var(--color-ink); background: var(--surface-hover); }
      .fg__cell--cheap { border: 2px solid var(--color-red); }
      .fg__cell--off { opacity: 0.5; cursor: not-allowed; }
      .fg__day {
        font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.04em;
        text-transform: uppercase; color: var(--text-secondary);
      }
      .fg__cell--cheap .fg__day { color: var(--color-red-ink, #C42A22); }
      .fg__price { font-weight: 800; font-size: 13px; color: var(--color-ink); font-variant-numeric: tabular-nums; }
      .fg__cell--cheap .fg__price { color: var(--color-red-ink, #C42A22); }
      .fg__bar { width: 100%; background: var(--bg-tertiary); }
      .fg__cell--cheap .fg__bar { background: var(--color-red); }
      .fg__legend {
        display: flex; gap: 16px; margin-top: 12px;
        font-family: var(--font-mono); font-size: 10.5px; color: var(--text-secondary);
      }
      .fg__key { display: inline-block; width: 8px; height: 8px; margin-right: 5px; vertical-align: middle; }
      .fg__key--cheap { background: var(--color-red); }
      .fg__key--rel { background: var(--bg-tertiary); }
    `,
  ],
  host: { '[style.--fg-cols]': 'days().length || 7' },
})
export class UiFareGridComponent {
  readonly days = input<FareDay[]>([]);
  readonly currency = input<string>('EUR');
  readonly selected = model<number>(-1);
  readonly daySelected = output<FareDay>();

  private readonly prices = computed(() =>
    this.days().filter((d) => d.available !== false).map((d) => d.price)
  );
  readonly cheapestIndex = computed(() => {
    const days = this.days();
    let idx = -1;
    let min = Infinity;
    days.forEach((d, i) => {
      if (d.available !== false && d.price < min) { min = d.price; idx = i; }
    });
    return idx;
  });

  private readonly fmt = computed(
    () => new Intl.NumberFormat(undefined, { style: 'currency', currency: this.currency(), maximumFractionDigits: 0 })
  );

  format(v: number): string {
    return this.fmt().format(Math.round(v));
  }

  labelFor(d: FareDay): string {
    if (d.label) return d.label;
    if (!d.date) return '';
    const parsed = new Date(d.date);
    if (Number.isNaN(parsed.getTime())) return d.date;
    return parsed
      .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
      .toUpperCase();
  }

  barHeight(price: number): number {
    const ps = this.prices();
    if (ps.length === 0) return 10;
    const min = Math.min(...ps);
    const max = Math.max(...ps);
    if (max === min) return 16;
    return Math.round(10 + ((price - min) / (max - min)) * 20);
  }

  pick(i: number): void {
    const d = this.days()[i];
    if (!d || d.available === false) return;
    this.selected.set(i);
    this.daySelected.emit(d);
  }
}
