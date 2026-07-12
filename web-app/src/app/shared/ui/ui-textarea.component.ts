import { booleanAttribute, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Multi-line text primitive — the textarea sibling of {@link UiInputComponent}.
 * Shares the exact same Swiss box + `--ui-in-*` theming (so admin `--ad-*`
 * overrides apply identically), with built-in `label` / `hint` / `error` chrome,
 * an `invalid` state wired to `aria-invalid`, optional `maxlength` counter, and
 * an opt-in `autoResize` that grows the field to fit its content.
 *
 * Implements {@link ControlValueAccessor}, so it is a drop-in for `[ngModel]`
 * and reactive forms.
 */
@Component({
  selector: 'app-ui-textarea',
  standalone: true,
  host: {
    '[class.ui-ta--invalid]': 'invalid() || !!error()',
    '[class.ui-ta--disabled]': 'disabled()',
    '[class.ui-ta--autoresize]': 'autoResize()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiTextareaComponent), multi: true },
  ],
  template: `
    @if (label()) {
      <label class="ui-ta__label" [for]="inputId()">
        {{ label() }}@if (required()) {<span class="ui-ta__req" aria-hidden="true">*</span>}
      </label>
    }

    <span class="ui-ta__box">
      <textarea
        #ta
        class="ui-ta__field"
        [id]="inputId()"
        [rows]="rows()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        [attr.required]="required() ? '' : null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-invalid]="invalid() || !!error() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [attr.maxlength]="maxlength() || null"
        (input)="onInput($event)"
        (blur)="onTouched()"
      ></textarea>
    </span>

    <span class="ui-ta__foot">
      @if (error()) {
        <span class="ui-ta__msg ui-ta__msg--err" [id]="inputId() + '-err'" role="alert">
          <span class="ms" aria-hidden="true">error</span>{{ error() }}
        </span>
      } @else if (hint()) {
        <span class="ui-ta__msg" [id]="inputId() + '-hint'">{{ hint() }}</span>
      }
      @if (maxlength() && showCounter()) {
        <span class="ui-ta__count">{{ value().length }}/{{ maxlength() }}</span>
      }
    </span>
  `,
  styles: [
    `
      :host {
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
        --_bar-width: var(--ui-in-bar-width, 2px);
        --_bar-color: var(--ui-in-bar-color, var(--_focus));
        --_pad-y: var(--ui-in-pad-y, 10px);
        --_pad-x: var(--ui-in-pad-x, 12px);
        --_font-size: var(--ui-in-font-size, 0.92rem);
        --_font-family: var(--ui-in-font-family, inherit);
        --_label-color: var(--ui-in-label-color, var(--text-tertiary));
        display: block;
      }

      .ui-ta__label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--_label-color);
      }
      .ui-ta__req {
        margin-left: 2px;
        color: var(--_invalid);
      }

      .ui-ta__box {
        position: relative;
        display: block;
        background: var(--_bg);
        border: var(--_border-width) solid var(--_border);
        border-radius: var(--_radius);
        transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
      }
      .ui-ta__box::before {
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
      .ui-ta__box:focus-within::before {
        transform: scaleY(1);
      }
      .ui-ta__box:hover {
        border-color: var(--_border-hover);
      }
      :host(.ui-ta--disabled) .ui-ta__box:hover {
        border-color: var(--_border);
      }
      .ui-ta__box:focus-within {
        border-color: var(--_focus);
        background: var(--_bg-focus);
        box-shadow: var(--_focus-ring);
      }
      :host(.ui-ta--invalid) .ui-ta__box {
        border-color: var(--_invalid);
      }
      :host(.ui-ta--invalid) .ui-ta__box::before {
        --_bar-color: var(--_invalid);
      }
      :host(.ui-ta--invalid) .ui-ta__box:focus-within {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--_invalid) 16%, transparent);
      }
      :host(.ui-ta--disabled) .ui-ta__box {
        opacity: 0.55;
      }

      .ui-ta__field {
        display: block;
        width: 100%;
        box-sizing: border-box;
        min-height: 0;
        margin: 0;
        padding: var(--_pad-y) var(--_pad-x);
        border: none;
        outline: none;
        background: none;
        resize: vertical;
        color: var(--_text);
        font-family: var(--_font-family);
        font-size: var(--_font-size);
        line-height: 1.5;
      }
      .ui-ta__field::placeholder {
        color: var(--_placeholder);
      }
      .ui-ta__field:disabled {
        cursor: not-allowed;
      }
      :host(.ui-ta--autoresize) .ui-ta__field {
        resize: none;
        overflow: hidden;
      }

      .ui-ta__foot {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 6px;
        min-height: 0;
      }
      .ui-ta__msg {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.76rem;
        line-height: 1.35;
        color: var(--text-tertiary);
      }
      .ui-ta__msg .ms {
        font-size: 15px;
      }
      .ui-ta__msg--err {
        color: var(--_invalid);
        font-weight: 500;
      }
      .ui-ta__count {
        margin-left: auto;
        font-size: 0.72rem;
        font-variant-numeric: tabular-nums;
        color: var(--text-tertiary);
      }
      .ui-ta__foot:empty {
        display: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .ui-ta__box,
        .ui-ta__box::before {
          transition: none;
        }
      }
    `,
  ],
})
export class UiTextareaComponent implements ControlValueAccessor {
  private static seq = 0;
  readonly inputId = input<string>(`ui-textarea-${++UiTextareaComponent.seq}`);
  readonly rows = input<number>(4);
  readonly placeholder = input<string>('');

  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Show the `n/max` character counter (only when `maxlength` is set). */
  readonly showCounter = input(true, { transform: booleanAttribute });
  /** Grow the field to fit content instead of scrolling. */
  readonly autoResize = input(false, { transform: booleanAttribute });

  readonly name = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly maxlength = input<number | null>(null);

  readonly value = signal<string>('');
  readonly disabled = signal(false);

  readonly describedBy = computed(() => {
    if (this.error()) return `${this.inputId()}-err`;
    if (this.hint()) return `${this.inputId()}-hint`;
    return null;
  });

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
    const el = event.target as HTMLTextAreaElement;
    this.value.set(el.value);
    this.onChange(el.value);
    if (this.autoResize()) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }
}
