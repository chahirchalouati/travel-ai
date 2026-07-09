import { Component, input, output } from '@angular/core';

export type UiButtonVariant = 'primary' | 'outline' | 'ghost' | 'ai';
export type UiButtonSize = 'sm' | 'md' | 'lg';

/**
 * Swiss button. Squared, flat, invert-on-hover. `primary` is red, `ai` is the
 * ink block (Claude/AI action), `outline` inverts to ink, `ghost` is bare.
 * Supports `loading`, a leading `icon`, and `block` (full width).
 */
@Component({
  selector: 'app-ui-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      class="ui-btn"
      [class]="'ui-btn--' + variant() + ' ui-btn--' + size()"
      [class.ui-btn--block]="block()"
      [disabled]="disabled() || loading()"
      (click)="clicked.emit($event)"
    >
      @if (loading()) {
        <span class="ui-btn__spin" aria-hidden="true"></span>
      } @else if (icon()) {
        <span class="ms ui-btn__icon" aria-hidden="true">{{ icon() }}</span>
      }
      <span class="ui-btn__label"><ng-content></ng-content></span>
    </button>
  `,
  styles: [
    `
      :host { display: inline-flex; }
      :host(.block), .ui-btn--block { width: 100%; }

      .ui-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        font-family: var(--font-body);
        font-weight: 600;
        letter-spacing: -0.01em;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: background 180ms var(--ease, ease), color 180ms var(--ease, ease),
          border-color 180ms var(--ease, ease), transform 120ms var(--ease, ease);
      }
      .ui-btn:active { transform: scale(0.985); }
      .ui-btn:focus-visible { outline: none; box-shadow: var(--ring-focus); }
      .ui-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .ui-btn--sm { padding: 0.4rem 0.85rem; font-size: 0.8rem; }
      .ui-btn--md { padding: 0.62rem 1.25rem; font-size: 0.875rem; }
      .ui-btn--lg { padding: 0.8rem 1.6rem; font-size: 0.95rem; }
      .ui-btn__icon { font-size: 1.15em; }

      .ui-btn--primary { background: var(--color-red); color: #fff; }
      .ui-btn--primary:hover:not(:disabled) { background: var(--color-red-hover); }

      .ui-btn--outline { background: var(--surface); color: var(--color-ink); border-color: var(--color-ink); }
      .ui-btn--outline:hover:not(:disabled) { background: var(--color-ink); color: #fff; }

      .ui-btn--ghost { background: transparent; color: var(--text-primary); }
      .ui-btn--ghost:hover:not(:disabled) { background: var(--color-red-tint); color: var(--color-red); }

      .ui-btn--ai { background: var(--color-ink); color: #fff; }
      .ui-btn--ai:hover:not(:disabled) { background: var(--color-red); }

      .ui-btn__spin {
        width: 15px; height: 15px; border-radius: 50%;
        border: 2px solid currentColor; border-top-color: transparent;
        animation: ui-btn-spin 0.7s linear infinite;
      }
      @keyframes ui-btn-spin { to { transform: rotate(360deg); } }
    `,
  ],
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('primary');
  readonly size = input<UiButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly icon = input<string>('');
  readonly block = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly clicked = output<MouseEvent>();
}
