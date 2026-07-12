import { Component, input } from '@angular/core';

/** Shimmering placeholder block. Set `width`/`height` (CSS values) and `radius`. */
@Component({
  selector: 'app-ui-skeleton',
  standalone: true,
  template: `<span class="ui-skel" [style.width]="width()" [style.height]="height()" [style.border-radius]="radius()"></span>`,
  styles: [
    `
      :host { display: block; }
      .ui-skel {
        display: block;
        background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
        background-size: 200% 100%;
        animation: ui-shimmer 1.4s ease-in-out infinite;
      }
      @keyframes ui-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      @media (prefers-reduced-motion: reduce) { .ui-skel { animation: none; } }
    `,
  ],
})
export class UiSkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('14px');
  readonly radius = input<string>('2px');
}
