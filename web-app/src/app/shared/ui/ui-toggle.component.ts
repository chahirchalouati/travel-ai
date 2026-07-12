import { Component, input, model } from '@angular/core';

/**
 * Swiss switch. Squared track + thumb; red when on. Two-way `[(value)]`, with an
 * optional trailing `label`.
 */
@Component({
  selector: 'app-ui-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="ui-toggle"
      role="switch"
      [attr.aria-checked]="value()"
      [class.ui-toggle--on]="value()"
      [disabled]="disabled()"
      (click)="toggle()"
    >
      <span class="ui-toggle__track" aria-hidden="true">
        <span class="ui-toggle__thumb"></span>
      </span>
      @if (label()) { <span class="ui-toggle__label">{{ label() }}</span> }
    </button>
  `,
  styles: [
    `
      :host { display: inline-flex; }
      .ui-toggle {
        display: inline-flex; align-items: center; gap: 10px;
        background: none; border: none; padding: 0; cursor: pointer;
        font-family: var(--font-body); font-size: 0.875rem; font-weight: 500;
        color: var(--text-primary);
      }
      .ui-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
      .ui-toggle:focus-visible { outline: none; }
      .ui-toggle:focus-visible .ui-toggle__track { box-shadow: var(--ring-focus); }

      .ui-toggle__track {
        position: relative;
        width: 42px; height: 24px;
        border-radius: var(--radius-sm);
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        transition: background 180ms ease, border-color 180ms ease;
        flex: 0 0 auto;
      }
      .ui-toggle__thumb {
        position: absolute; top: 2px; left: 2px;
        width: 18px; height: 18px;
        border-radius: 1px;
        background: #fff;
        box-shadow: 0 0 0 1px rgba(17, 17, 17, 0.12);
        transition: transform 180ms var(--ease, ease);
      }
      .ui-toggle--on .ui-toggle__track { background: var(--color-red); border-color: var(--color-red-ink); }
      .ui-toggle--on .ui-toggle__thumb { transform: translateX(18px); box-shadow: none; }
    `,
  ],
})
export class UiToggleComponent {
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly value = model<boolean>(false);

  toggle(): void {
    if (!this.disabled()) this.value.set(!this.value());
  }
}
