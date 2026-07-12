import { Component, input } from '@angular/core';

export type UiStatTrend = 'up' | 'down' | 'flat';

/**
 * Swiss metric block: a big tabular numeral, a mono uppercase label, and an
 * optional trend delta. Reads like an editorial statistic.
 */
@Component({
  selector: 'app-ui-stat',
  standalone: true,
  template: `
    <div class="ui-stat">
      <span class="ui-stat__label">{{ label() }}</span>
      <span class="ui-stat__value" [class.ui-stat__value--red]="accent()">{{ value() }}</span>
      @if (delta()) {
        <span class="ui-stat__delta" [class]="'ui-stat__delta--' + trend()">
          @if (trend() !== 'flat') {
            <span class="ms" aria-hidden="true">{{ trend() === 'up' ? 'trending_up' : 'trending_down' }}</span>
          }
          {{ delta() }}
        </span>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .ui-stat { display: flex; flex-direction: column; gap: 4px; }
      .ui-stat__label {
        font-family: var(--font-mono);
        font-size: var(--text-micro, 0.6875rem);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-secondary);
      }
      .ui-stat__value {
        font-family: var(--font-display);
        font-weight: 800;
        letter-spacing: -0.035em;
        font-size: clamp(1.8rem, 1.2rem + 1.6vw, 2.6rem);
        line-height: 1;
        font-variant-numeric: tabular-nums;
        color: var(--color-ink);
      }
      .ui-stat__value--red { color: var(--color-red-ink); }
      .ui-stat__delta {
        display: inline-flex; align-items: center; gap: 3px;
        font-size: 0.78rem; font-weight: 600;
      }
      .ui-stat__delta .ms { font-size: 1rem; }
      .ui-stat__delta--up { color: var(--color-success-strong, #145C39); }
      .ui-stat__delta--down { color: var(--color-red-ink); }
      .ui-stat__delta--flat { color: var(--text-subtle, var(--text-tertiary)); }
    `,
  ],
})
export class UiStatComponent {
  readonly label = input<string>('');
  readonly value = input<string | number>('');
  readonly delta = input<string>('');
  readonly trend = input<UiStatTrend>('flat');
  /** Render the numeral in International Red instead of ink. */
  readonly accent = input<boolean>(false);
}
