import { Component, input } from '@angular/core';

/** Minimal Swiss loading spinner — a red-topped ring. */
@Component({
  selector: 'app-ui-spinner',
  standalone: true,
  template: `
    <span class="ui-spinner" [style.width.px]="size()" [style.height.px]="size()" role="status" aria-label="Loading"></span>
  `,
  styles: [
    `
      :host { display: inline-flex; }
      .ui-spinner {
        display: inline-block;
        border: 2px solid var(--border);
        border-top-color: var(--color-red-ink);
        border-radius: 50%;
        animation: ui-spin 0.7s linear infinite;
      }
      @keyframes ui-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .ui-spinner { animation-duration: 1.6s; } }
    `,
  ],
})
export class UiSpinnerComponent {
  readonly size = input<number>(20);
}
