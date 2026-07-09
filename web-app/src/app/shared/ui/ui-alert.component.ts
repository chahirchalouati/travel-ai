import { Component, input, output } from '@angular/core';

export type UiAlertVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * Swiss inline banner. Flat tinted surface with a left ink/red rule, an icon,
 * an optional title, and projected body copy. Optionally dismissible.
 */
@Component({
  selector: 'app-ui-alert',
  standalone: true,
  template: `
    <div class="ui-alert" [class]="'ui-alert--' + variant()" role="status">
      <span class="ms ui-alert__icon" aria-hidden="true">{{ icon() || defaultIcon() }}</span>
      <div class="ui-alert__body">
        @if (title()) { <p class="ui-alert__title">{{ title() }}</p> }
        <p class="ui-alert__text"><ng-content></ng-content></p>
      </div>
      @if (dismissible()) {
        <button type="button" class="ui-alert__close" aria-label="Dismiss" (click)="dismissed.emit()">
          <span class="ms" aria-hidden="true">close</span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .ui-alert {
        display: flex; align-items: flex-start; gap: 10px;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-left-width: 3px;
        border-radius: var(--radius-sm);
        background: var(--surface);
      }
      .ui-alert__icon { font-size: 20px; flex: 0 0 auto; margin-top: 1px; }
      .ui-alert__body { flex: 1; min-width: 0; }
      .ui-alert__title { margin: 0 0 2px; font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
      .ui-alert__text { margin: 0; font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); }
      .ui-alert__close {
        border: none; background: none; cursor: pointer; padding: 2px;
        color: var(--text-subtle, var(--text-tertiary)); flex: 0 0 auto;
      }
      .ui-alert__close:hover { color: var(--color-ink); }
      .ui-alert__close .ms { font-size: 18px; }

      .ui-alert--info    { border-left-color: var(--color-ink); }
      .ui-alert--info .ui-alert__icon { color: var(--color-ink); }
      .ui-alert--success { border-left-color: var(--color-success, #1F7A4D); background: var(--color-success-tint, #E4F1EA); }
      .ui-alert--success .ui-alert__icon { color: var(--color-success-strong, #145C39); }
      .ui-alert--warning { border-left-color: var(--color-warning, #C25A17); background: var(--color-warning-tint, #FBEBDD); }
      .ui-alert--warning .ui-alert__icon { color: var(--color-warning, #C25A17); }
      .ui-alert--danger  { border-left-color: var(--color-red-ink); background: var(--color-red-tint, #FDECEA); }
      .ui-alert--danger .ui-alert__icon { color: var(--color-red-ink); }
    `,
  ],
})
export class UiAlertComponent {
  readonly variant = input<UiAlertVariant>('info');
  readonly title = input<string>('');
  readonly icon = input<string>('');
  readonly dismissible = input<boolean>(false);
  readonly dismissed = output<void>();

  defaultIcon(): string {
    switch (this.variant()) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'danger': return 'error';
      default: return 'info';
    }
  }
}
