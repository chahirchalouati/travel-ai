import { Component, input } from '@angular/core';

/**
 * Swiss "kicker" — a mono, uppercase eyebrow label with an optional red
 * square mark and a black rule underneath. The signature section-opener of
 * the Swiss Grid system. Content is projected: `<app-ui-kicker>Featured</app-ui-kicker>`.
 */
@Component({
  selector: 'app-ui-kicker',
  standalone: true,
  template: `
    <span class="ui-kicker" [class.ui-kicker--rule]="rule()">
      @if (mark()) {
        <span class="ui-kicker__mark" aria-hidden="true"></span>
      }
      <span class="ui-kicker__text"><ng-content></ng-content></span>
    </span>
  `,
  styles: [
    `
      :host { display: block; }

      .ui-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-family: var(--font-mono);
        font-size: var(--text-micro, 0.6875rem);
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--color-ink);
      }

      .ui-kicker--rule {
        padding-bottom: 8px;
        border-bottom: 1px solid var(--color-ink);
      }

      .ui-kicker__mark {
        width: 8px;
        height: 8px;
        background: var(--color-red);
        flex: 0 0 auto;
      }
    `,
  ],
})
export class UiKickerComponent {
  /** Show the leading red square mark. */
  readonly mark = input<boolean>(true);
  /** Draw the black rule under the label. */
  readonly rule = input<boolean>(false);
}
