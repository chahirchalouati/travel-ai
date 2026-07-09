import { Component, computed, input } from '@angular/core';

/**
 * Swiss rating display — filled/empty square dots plus a bold ink numeral.
 * `value` out of `max` (default 5). Set `[showCount]` text for review counts.
 */
@Component({
  selector: 'app-ui-rating',
  standalone: true,
  template: `
    <span class="ui-rating">
      <span class="ui-rating__dots" aria-hidden="true">
        @for (i of slots(); track i) {
          <span class="ui-rating__dot" [class.ui-rating__dot--on]="i <= rounded()"></span>
        }
      </span>
      <span class="ui-rating__score">{{ value().toFixed(1) }}</span>
      @if (count()) { <span class="ui-rating__count">({{ count() }})</span> }
    </span>
  `,
  styles: [
    `
      :host { display: inline-flex; }
      .ui-rating { display: inline-flex; align-items: center; gap: 8px; }
      .ui-rating__dots { display: inline-flex; gap: 3px; }
      .ui-rating__dot {
        width: 8px; height: 8px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
      }
      .ui-rating__dot--on { background: var(--color-red); border-color: var(--color-red); }
      .ui-rating__score {
        font-weight: 800; font-size: 0.9rem; color: var(--color-ink);
        font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
      }
      .ui-rating__count { font-size: 0.78rem; color: var(--text-secondary); }
    `,
  ],
})
export class UiRatingComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(5);
  readonly count = input<string>('');

  readonly rounded = computed(() => Math.round(this.value()));
  readonly slots = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));
}
