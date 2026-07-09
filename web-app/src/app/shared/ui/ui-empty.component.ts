import { Component, input } from '@angular/core';

/**
 * Empty-state block: a squared red-tint icon tile, an ink title, a muted line,
 * and a projected action slot (e.g. a button).
 */
@Component({
  selector: 'app-ui-empty',
  standalone: true,
  template: `
    <div class="ui-empty">
      @if (icon()) {
        <span class="ui-empty__icon" aria-hidden="true"><span class="ms">{{ icon() }}</span></span>
      }
      <h3 class="ui-empty__title">{{ title() }}</h3>
      @if (message()) { <p class="ui-empty__msg">{{ message() }}</p> }
      <div class="ui-empty__action"><ng-content></ng-content></div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .ui-empty {
        display: flex; flex-direction: column; align-items: center;
        text-align: center; padding: 3rem 1.5rem; gap: 6px;
      }
      .ui-empty__icon {
        display: grid; place-items: center;
        width: 52px; height: 52px; margin-bottom: 8px;
        background: var(--color-red-tint, #FDECEA);
        border-radius: var(--radius-sm);
      }
      .ui-empty__icon .ms { font-size: 26px; color: var(--color-red-ink); }
      .ui-empty__title { margin: 0; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); }
      .ui-empty__msg { margin: 0; max-width: 34ch; font-size: 0.9rem; line-height: 1.5; color: var(--text-secondary); }
      .ui-empty__action { margin-top: 12px; }
      .ui-empty__action:empty { display: none; }
    `,
  ],
})
export class UiEmptyComponent {
  readonly icon = input<string>('inbox');
  readonly title = input<string>('');
  readonly message = input<string>('');
}
