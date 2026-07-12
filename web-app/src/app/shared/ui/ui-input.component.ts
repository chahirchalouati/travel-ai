import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Visual preset for {@link UiInputComponent}. */
export type UiInputVariant = 'field' | 'search' | 'filter';

/**
 * Themeable single-line text input primitive. Wraps a borderless native
 * `<input>` in a focus-within box with an optional leading Material Symbol,
 * and implements {@link ControlValueAccessor} so it is a drop-in for
 * `[ngModel]` / reactive forms.
 *
 * Appearance is driven entirely by `--ui-in-*` custom properties (defaulting
 * to the global design tokens, like {@link UiSelectComponent}). Surfaces that
 * need a bespoke look — e.g. the admin panel with its `--ad-*` palette —
 * override those variables in their own scope instead of hand-rolling an
 * `<input>`. `variant` only picks a set of default paddings/sizing.
 */
@Component({
  selector: 'app-ui-input',
  standalone: true,
  host: {
    '[class.ui-input--search]': "variant() === 'search'",
    '[class.ui-input--filter]': "variant() === 'filter'",
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputComponent), multi: true },
  ],
  template: `
    <span class="ui-input" [class.ui-input--disabled]="disabled()">
      @if (icon()) {
        <span class="ms ui-input__icon" aria-hidden="true">{{ icon() }}</span>
      }
      <input
        class="ui-input__field"
        [id]="inputId()"
        [type]="type()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.autocomplete]="autocomplete()"
        [attr.inputmode]="inputmode() || null"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
    </span>
  `,
  styles: [
    `
      :host {
        /* Themeable surface — override these in a consuming scope. */
        --_bg: var(--ui-in-bg, var(--bg-primary));
        --_border: var(--ui-in-border, var(--border));
        --_border-hover: var(--ui-in-border-hover, var(--text-tertiary));
        --_radius: var(--ui-in-radius, var(--radius-sm, 8px));
        --_text: var(--ui-in-text, var(--text-primary));
        --_placeholder: var(--ui-in-placeholder, var(--text-tertiary));
        --_focus: var(--ui-in-focus, var(--color-red-ink, #e04a2f));
        --_focus-ring: var(
          --ui-in-focus-ring,
          0 0 0 3px color-mix(in srgb, var(--_focus) 18%, transparent)
        );
        --_icon: var(--ui-in-icon, var(--text-tertiary));
        --_icon-focus: var(--ui-in-icon-focus, var(--_focus));
        --_icon-size: var(--ui-in-icon-size, 18px);
        --_pad-y: var(--ui-in-pad-y, 10px);
        --_pad-x: var(--ui-in-pad-x, 12px);
        --_gap: var(--ui-in-gap, 8px);
        --_font-size: var(--ui-in-font-size, 0.92rem);
        --_font-family: var(--ui-in-font-family, inherit);
        --_min-width: var(--ui-in-min-width, 0);
        --_transition: border-color 150ms ease, box-shadow 150ms ease;
        display: block;
      }

      /* variant sizing presets (still overridable via --ui-in-*) */
      :host(.ui-input--search) {
        --_pad-y: var(--ui-in-pad-y, 8px);
        --_min-width: var(--ui-in-min-width, 200px);
      }
      :host(.ui-input--filter) {
        --_pad-y: var(--ui-in-pad-y, 5px);
        --_pad-x: var(--ui-in-pad-x, 8px);
        --_radius: var(--ui-in-radius, var(--radius-xs, 6px));
        --_font-size: var(--ui-in-font-size, 0.8rem);
        --_min-width: var(--ui-in-min-width, 84px);
      }

      .ui-input {
        display: flex;
        align-items: center;
        gap: var(--_gap);
        width: 100%;
        min-width: var(--_min-width);
        padding: var(--_pad-y) var(--_pad-x);
        background: var(--_bg);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        transition: var(--_transition);
      }

      .ui-input:hover:not(.ui-input--disabled):not(:focus-within) {
        border-color: var(--_border-hover);
      }

      .ui-input:focus-within {
        border-color: var(--_focus);
        box-shadow: var(--_focus-ring);
      }

      .ui-input--disabled {
        opacity: 0.6;
      }

      .ui-input__icon {
        flex: 0 0 auto;
        font-size: var(--_icon-size);
        color: var(--_icon);
        transition: color 150ms ease;
      }

      .ui-input:focus-within .ui-input__icon {
        color: var(--_icon-focus);
      }

      .ui-input__field {
        flex: 1 1 auto;
        min-width: 0;
        border: none;
        outline: none;
        background: none;
        padding: 0;
        color: var(--_text);
        font-family: var(--_font-family);
        font-size: var(--_font-size);
      }

      .ui-input__field::placeholder {
        color: var(--_placeholder);
      }

      .ui-input__field:disabled {
        cursor: not-allowed;
      }

      @media (prefers-reduced-motion: reduce) {
        .ui-input,
        .ui-input__icon {
          transition: none;
        }
      }
    `,
  ],
})
export class UiInputComponent implements ControlValueAccessor {
  private static seq = 0;
  /** DOM id for the native input; auto-generated so a wrapping `<label for>`
   * can associate with it (a custom element is not labelable). Overridable. */
  readonly inputId = input<string>(`ui-input-${++UiInputComponent.seq}`);
  readonly variant = input<UiInputVariant>('field');
  readonly type = input<string>('text');
  readonly icon = input<string>('');
  readonly placeholder = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly autocomplete = input<string>('off');
  readonly inputmode = input<string>('');

  readonly value = signal<string>('');
  readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }
}
