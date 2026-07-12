import { Component, input } from '@angular/core';

export type UiBadgeVariant = 'neutral' | 'ink' | 'red' | 'success' | 'warning' | 'outline';
export type UiBadgeSize = 'sm' | 'md';

/**
 * Squared status/label badge. `<app-ui-badge variant="red">New</app-ui-badge>`.
 * Optional leading Material Symbol via `icon`.
 */
@Component({
  selector: 'app-ui-badge',
  standalone: true,
  template: `
    <span class="ui-badge" [class]="'ui-badge--' + variant() + ' ui-badge--' + size()">
      @if (icon()) { <span class="ms ui-badge__icon" aria-hidden="true">{{ icon() }}</span> }
      <ng-content></ng-content>
    </span>
  `,
  styles: [
    `
      :host { display: inline-flex; }

      .ui-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border-radius: var(--radius-sm);
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        border: 1px solid transparent;
      }
      .ui-badge--sm { padding: 3px 8px; font-size: 0.7rem; }
      .ui-badge--md { padding: 5px 10px; font-size: 0.78rem; }
      .ui-badge__icon { font-size: 0.95em; }

      .ui-badge--neutral { background: var(--surface-sunken, var(--bg-tertiary)); color: var(--text-primary); }
      .ui-badge--ink     { background: var(--color-ink); color: #fff; }
      .ui-badge--red     { background: var(--color-red); color: #fff; }
      .ui-badge--success { background: var(--color-success-tint, #E4F1EA); color: var(--color-success-strong, #145C39); }
      .ui-badge--warning { background: var(--color-warning-tint, #FBEBDD); color: var(--color-warning, #C25A17); }
      .ui-badge--outline { background: transparent; border-color: var(--color-ink); color: var(--color-ink); }
    `,
  ],
})
export class UiBadgeComponent {
  readonly variant = input<UiBadgeVariant>('neutral');
  readonly size = input<UiBadgeSize>('md');
  readonly icon = input<string>('');
}
