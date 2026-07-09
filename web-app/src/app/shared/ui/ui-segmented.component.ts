import { Component, input, model } from '@angular/core';

export interface UiSegment {
  value: string;
  label: string;
  icon?: string;
}

/**
 * Swiss segmented control / tab switch. Bordered track, ink-filled active
 * segment. Two-way `[(value)]`, `[options]` is a `UiSegment[]`.
 */
@Component({
  selector: 'app-ui-segmented',
  standalone: true,
  template: `
    <div class="ui-seg" role="tablist">
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          role="tab"
          class="ui-seg__item"
          [class.ui-seg__item--on]="value() === opt.value"
          [attr.aria-selected]="value() === opt.value"
          (click)="value.set(opt.value)"
        >
          @if (opt.icon) { <span class="ms ui-seg__icon" aria-hidden="true">{{ opt.icon }}</span> }
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host { display: inline-flex; }
      .ui-seg {
        display: inline-flex;
        padding: 3px;
        gap: 2px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
      }
      .ui-seg__item {
        display: inline-flex; align-items: center; gap: 6px;
        border: none; background: none; cursor: pointer;
        padding: 7px 14px;
        font-family: var(--font-body); font-size: 0.82rem; font-weight: 600;
        color: var(--text-secondary);
        border-radius: 1px;
        transition: background 150ms ease, color 150ms ease;
      }
      .ui-seg__icon { font-size: 1.05em; }
      .ui-seg__item:hover:not(.ui-seg__item--on) { color: var(--color-ink); }
      .ui-seg__item--on { background: var(--color-ink); color: #fff; }
    `,
  ],
})
export class UiSegmentedComponent {
  readonly options = input<UiSegment[]>([]);
  readonly value = model<string>('');
}
