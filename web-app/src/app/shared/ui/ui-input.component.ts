import { booleanAttribute, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Visual preset for {@link UiInputComponent}. */
export type UiInputVariant = 'field' | 'search' | 'filter';
/** Density preset. `md` is the default; `filter`/`search` variants nudge it. */
export type UiInputSize = 'sm' | 'md' | 'lg';

/**
 * Themeable single-line text input primitive — the canonical text field for the
 * whole app. Wraps a borderless native `<input>` in a Swiss-editorial box with:
 *
 * - an optional leading Material Symbol icon and a leading accent bar that wipes
 *   in on focus (the editorial signature);
 * - optional built-in `label` / `hint` / `error` chrome so callers stop
 *   hand-rolling `<label>` + helper markup around every field;
 * - a `clearable` affordance and an automatic password reveal toggle;
 * - an `invalid` state wired to `aria-invalid`.
 *
 * It implements {@link ControlValueAccessor} so it is a drop-in for `[ngModel]`
 * / reactive forms. Appearance is driven entirely by `--ui-in-*` custom
 * properties (defaulting to the global design tokens). Surfaces that need a
 * bespoke look — e.g. the admin panel with its `--ad-*` palette — override those
 * variables in their own scope instead of hand-rolling an `<input>`.
 */
@Component({
  selector: 'app-ui-input',
  standalone: true,
  host: {
    '[class.ui-in--search]': "variant() === 'search'",
    '[class.ui-in--filter]': "variant() === 'filter'",
    '[class.ui-in--sm]': "resolvedSize() === 'sm'",
    '[class.ui-in--lg]': "resolvedSize() === 'lg'",
    '[class.ui-in--invalid]': 'invalid() || !!error()',
    '[class.ui-in--disabled]': 'disabled()',
    '[class.ui-in--upper]': 'uppercase()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputComponent), multi: true },
  ],
  template: `
    @if (label()) {
      <label class="ui-in__label" [for]="inputId()">
        {{ label() }}@if (required()) {<span class="ui-in__req" aria-hidden="true">*</span>}
      </label>
    }

    <span class="ui-in__box">
      @if (icon()) {
        <span class="ms ui-in__lead" aria-hidden="true">{{ icon() }}</span>
      }

      <input
        class="ui-in__field"
        [id]="inputId()"
        [type]="resolvedType()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        [attr.required]="required() ? '' : null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-invalid]="invalid() || !!error() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [attr.autocomplete]="autocomplete()"
        [attr.inputmode]="inputmode() || null"
        [attr.maxlength]="maxlength() || null"
        [attr.minlength]="minlength() || null"
        [attr.min]="min() || null"
        [attr.max]="max() || null"
        [attr.step]="step() || null"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />

      @if (suffix()) {
        <span class="ui-in__suffix" aria-hidden="true">{{ suffix() }}</span>
      }

      @if (showClear()) {
        <button
          type="button"
          class="ui-in__act"
          [attr.aria-label]="clearLabel()"
          (click)="clear()"
        >
          <span class="ms" aria-hidden="true">close</span>
        </button>
      }

      @if (showReveal()) {
        <button
          type="button"
          class="ui-in__act"
          [attr.aria-label]="revealLabel()"
          [attr.aria-pressed]="revealed()"
          (click)="toggleReveal()"
        >
          <span class="ms" aria-hidden="true">{{ revealed() ? 'visibility_off' : 'visibility' }}</span>
        </button>
      } @else if (trailingIcon()) {
        <span class="ms ui-in__trail" aria-hidden="true">{{ trailingIcon() }}</span>
      }
    </span>

    @if (error()) {
      <p class="ui-in__msg ui-in__msg--err" [id]="inputId() + '-err'" role="alert">
        <span class="ms" aria-hidden="true">error</span>{{ error() }}
      </p>
    } @else if (hint()) {
      <p class="ui-in__msg" [id]="inputId() + '-hint'">{{ hint() }}</p>
    }
  `,
  styles: [
    `
      :host {
        /* Themeable surface — override these in a consuming scope. */
        --_bg: var(--ui-in-bg, var(--surface, #fff));
        --_bg-focus: var(--ui-in-bg-focus, var(--_bg));
        --_border: var(--ui-in-border, var(--border));
        --_border-hover: var(--ui-in-border-hover, var(--text-tertiary));
        --_radius: var(--ui-in-radius, var(--radius-md, 3px));
        --_border-width: var(--ui-in-border-width, 1.5px);
        --_text: var(--ui-in-text, var(--text-primary));
        --_placeholder: var(--ui-in-placeholder, var(--text-tertiary));
        --_focus: var(--ui-in-focus, var(--color-red-ink, #c42a22));
        --_invalid: var(--ui-in-invalid, var(--color-red, #e5352b));
        --_focus-ring: var(
          --ui-in-focus-ring,
          0 0 0 3px color-mix(in srgb, var(--_focus) 16%, transparent)
        );
        --_icon: var(--ui-in-icon, var(--text-tertiary));
        --_icon-focus: var(--ui-in-icon-focus, var(--_focus));
        --_icon-size: var(--ui-in-icon-size, 18px);
        --_bar-width: var(--ui-in-bar-width, 2px);
        --_bar-color: var(--ui-in-bar-color, var(--_focus));
        --_pad-y: var(--ui-in-pad-y, 10px);
        --_pad-x: var(--ui-in-pad-x, 12px);
        --_gap: var(--ui-in-gap, 9px);
        --_font-size: var(--ui-in-font-size, 0.92rem);
        --_font-family: var(--ui-in-font-family, inherit);
        --_label-color: var(--ui-in-label-color, var(--text-tertiary));
        --_min-width: var(--ui-in-min-width, 0);
        --_transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
        display: block;
      }

      /* ---- size presets (overridable via --ui-in-*) ------------------ */
      :host(.ui-in--sm) {
        --_pad-y: var(--ui-in-pad-y, 6px);
        --_pad-x: var(--ui-in-pad-x, 10px);
        --_gap: var(--ui-in-gap, 7px);
        --_font-size: var(--ui-in-font-size, 0.82rem);
        --_icon-size: var(--ui-in-icon-size, 16px);
      }
      :host(.ui-in--lg) {
        --_pad-y: var(--ui-in-pad-y, 13px);
        --_pad-x: var(--ui-in-pad-x, 14px);
        --_font-size: var(--ui-in-font-size, 1rem);
        --_icon-size: var(--ui-in-icon-size, 20px);
      }

      /* ---- variant presets ------------------------------------------ */
      :host(.ui-in--search) {
        --_min-width: var(--ui-in-min-width, 200px);
      }
      :host(.ui-in--filter) {
        --_pad-y: var(--ui-in-pad-y, 5px);
        --_pad-x: var(--ui-in-pad-x, 8px);
        --_radius: var(--ui-in-radius, var(--radius-sm, 2px));
        --_font-size: var(--ui-in-font-size, 0.8rem);
        --_min-width: var(--ui-in-min-width, 84px);
        --_bar-width: var(--ui-in-bar-width, 0px);
      }

      /* ---- label + messages ----------------------------------------- */
      .ui-in__label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--_label-color);
      }
      .ui-in__req {
        margin-left: 2px;
        color: var(--_invalid);
      }

      .ui-in__msg {
        display: flex;
        align-items: center;
        gap: 5px;
        margin: 6px 0 0;
        font-size: 0.76rem;
        line-height: 1.35;
        color: var(--text-tertiary);
      }
      .ui-in__msg .ms {
        font-size: 15px;
      }
      .ui-in__msg--err {
        color: var(--_invalid);
        font-weight: 500;
      }

      /* ---- the box -------------------------------------------------- */
      .ui-in__box {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--_gap);
        width: 100%;
        min-width: var(--_min-width);
        padding: var(--_pad-y) var(--_pad-x);
        background: var(--_bg);
        border: var(--_border-width) solid var(--_border);
        border-radius: var(--_radius);
        transition: var(--_transition);
      }

      /* Editorial accent bar on the leading edge, wiped in on focus. */
      .ui-in__box::before {
        content: '';
        position: absolute;
        top: calc(-1 * var(--_border-width));
        bottom: calc(-1 * var(--_border-width));
        left: calc(-1 * var(--_border-width));
        width: var(--_bar-width);
        background: var(--_bar-color);
        border-radius: var(--_radius) 0 0 var(--_radius);
        transform: scaleY(0);
        transform-origin: center;
        transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      }
      .ui-in__box:focus-within::before {
        transform: scaleY(1);
      }

      .ui-in__box:hover {
        border-color: var(--_border-hover);
      }
      :host(.ui-in--disabled) .ui-in__box:hover {
        border-color: var(--_border);
      }
      .ui-in__box:focus-within {
        border-color: var(--_focus);
        background: var(--_bg-focus);
        box-shadow: var(--_focus-ring);
      }

      :host(.ui-in--invalid) .ui-in__box {
        border-color: var(--_invalid);
      }
      :host(.ui-in--invalid) .ui-in__box::before {
        --_bar-color: var(--_invalid);
      }
      :host(.ui-in--invalid) .ui-in__box:focus-within {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--_invalid) 16%, transparent);
      }

      :host(.ui-in--disabled) .ui-in__box {
        opacity: 0.55;
        cursor: not-allowed;
      }

      /* ---- inner bits ----------------------------------------------- */
      .ui-in__lead,
      .ui-in__trail {
        flex: 0 0 auto;
        font-size: var(--_icon-size);
        color: var(--_icon);
        transition: color 150ms ease;
      }
      .ui-in__box:focus-within .ui-in__lead {
        color: var(--_icon-focus);
      }

      .ui-in__field {
        flex: 1 1 auto;
        min-width: 0;
        border: none;
        outline: none;
        background: none;
        padding: 0;
        color: var(--_text);
        font-family: var(--_font-family);
        font-size: var(--_font-size);
        line-height: 1.4;
      }
      .ui-in__field::placeholder {
        color: var(--_placeholder);
      }
      :host(.ui-in--upper) .ui-in__field {
        text-transform: uppercase;
      }
      .ui-in__field:disabled {
        cursor: not-allowed;
      }
      /* Kill the native reveal/clear affordances — we render our own. */
      .ui-in__field::-ms-reveal,
      .ui-in__field::-ms-clear {
        display: none;
      }
      .ui-in__field::-webkit-search-cancel-button {
        -webkit-appearance: none;
        appearance: none;
      }

      .ui-in__suffix {
        flex: 0 0 auto;
        font-family: var(--font-mono, monospace);
        font-size: 0.82em;
        color: var(--text-tertiary);
        white-space: nowrap;
      }

      .ui-in__act {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        margin: -4px -2px -4px 0;
        padding: 0;
        border: none;
        border-radius: var(--radius-sm, 2px);
        background: none;
        color: var(--text-tertiary);
        cursor: pointer;
        transition: color 150ms ease, background 150ms ease;
      }
      .ui-in__act .ms {
        font-size: 17px;
      }
      .ui-in__act:hover {
        color: var(--_text);
        background: var(--surface-hover, rgba(17, 17, 17, 0.05));
      }
      .ui-in__act:focus-visible {
        outline: 2px solid var(--_focus);
        outline-offset: 1px;
      }

      @media (prefers-reduced-motion: reduce) {
        .ui-in__box,
        .ui-in__lead,
        .ui-in__box::before,
        .ui-in__act {
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
  readonly size = input<UiInputSize | ''>('');
  readonly type = input<string>('text');
  readonly icon = input<string>('');
  readonly trailingIcon = input<string>('');
  /** Short trailing unit rendered in mono, e.g. "€", "km", "%". */
  readonly suffix = input<string>('');
  readonly placeholder = input<string>('');

  /** Built-in field chrome — pass to skip hand-rolling label/help markup. */
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });

  /** Force uppercase display (e.g. promo/voucher codes). Cosmetic only. */
  readonly uppercase = input(false, { transform: booleanAttribute });
  /** Show an inline clear (✕) button when there is a value. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** For `type="password"`, show the reveal toggle (on by default). */
  readonly revealToggle = input(true, { transform: booleanAttribute });

  readonly name = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly clearLabel = input<string>('Clear');
  readonly revealLabel = input<string>('Toggle password visibility');
  readonly autocomplete = input<string>('off');
  readonly inputmode = input<string>('');
  readonly maxlength = input<number | null>(null);
  readonly minlength = input<number | null>(null);
  readonly min = input<string | number | null>(null);
  readonly max = input<string | number | null>(null);
  readonly step = input<string | number | null>(null);

  readonly value = signal<string>('');
  readonly disabled = signal(false);
  readonly revealed = signal(false);

  /** Resolves `size` from the explicit input, falling back to variant defaults. */
  readonly resolvedSize = computed<UiInputSize>(() => {
    const s = this.size();
    if (s) return s;
    return this.variant() === 'filter' ? 'sm' : 'md';
  });

  readonly resolvedType = computed(() =>
    this.type() === 'password' && this.revealed() ? 'text' : this.type(),
  );

  readonly showClear = computed(
    () => this.clearable() && !this.disabled() && !this.readonly() && this.value().length > 0,
  );
  readonly showReveal = computed(
    () => this.type() === 'password' && this.revealToggle() && !this.disabled(),
  );

  readonly describedBy = computed(() => {
    if (this.error()) return `${this.inputId()}-err`;
    if (this.hint()) return `${this.inputId()}-hint`;
    return null;
  });

  private onChange: (value: string | number | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | number | null): void {
    this.value.set(value == null ? '' : String(value));
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
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
    this.onChange(this.emitValue(next));
  }

  clear(): void {
    this.value.set('');
    this.onChange(this.type() === 'number' ? null : '');
    this.onTouched();
  }

  /** For `type="number"`, hand the model a real number (or null when empty) so
   * numeric bindings don't silently become strings. Text types pass through. */
  private emitValue(raw: string): string | number | null {
    if (this.type() !== 'number') return raw;
    return raw === '' ? null : Number(raw);
  }

  toggleReveal(): void {
    this.revealed.update(v => !v);
  }
}
