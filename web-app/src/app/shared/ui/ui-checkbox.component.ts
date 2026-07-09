import { Component, input, model } from '@angular/core';

/**
 * Styled checkbox pill. Supports two-way binding via `[(checked)]` for simple
 * boolean filters, or the split `[checked]` / `(checkedChange)` form when the
 * checked state lives in a parent-owned collection (e.g. a `Set`).
 */
@Component({
  selector: 'app-ui-checkbox',
  standalone: true,
  template: `
    <button
      type="button"
      class="ui-check"
      role="checkbox"
      [class.ui-check--on]="checked()"
      [attr.aria-checked]="checked()"
      [disabled]="disabled()"
      (click)="toggle()"
    >
      <span class="ui-check__box" aria-hidden="true">
        @if (checked()) {
          <span class="ms ui-check__mark">check</span>
        }
      </span>
      <span class="ui-check__label">{{ label() }}</span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .ui-check {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px 8px 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--bg-primary);
        color: var(--text-secondary);
        font-family: inherit;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: border-color 150ms ease, background 150ms ease, color 150ms ease;
      }

      .ui-check:hover:not(:disabled) {
        border-color: var(--color-red-ink);
      }

      .ui-check:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(224, 74, 47, 0.18);
      }

      .ui-check:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .ui-check__box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: 2px solid var(--border);
        border-radius: 6px;
        background: var(--bg-primary);
        transition: border-color 150ms ease, background 150ms ease;
        flex: 0 0 auto;
      }

      .ui-check--on {
        border-color: var(--color-red-ink);
        background: var(--brand-light);
        color: var(--color-red-ink);
      }

      .ui-check--on .ui-check__box {
        border-color: var(--color-red-ink);
        background: var(--brand);
      }

      .ui-check__mark {
        font-size: 16px;
        color: #fff;
        line-height: 1;
      }

      .ui-check__label {
        line-height: 1;
      }
    `,
  ],
})
export class UiCheckboxComponent {
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly checked = model<boolean>(false);

  toggle(): void {
    if (!this.disabled()) {
      this.checked.set(!this.checked());
    }
  }
}
