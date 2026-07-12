import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Styled date input that replaces the native `<input type="date">`.
 * Shows a calendar icon, consistent border/focus treatment matching the
 * design system, and implements {@link ControlValueAccessor} for ngModel.
 */
@Component({
  selector: 'app-ui-datepicker',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiDatepickerComponent), multi: true },
  ],
  template: `
    <div class="ui-date" [class.ui-date--focus]="focused()" [class.ui-date--disabled]="disabled()">
      <span class="ui-date__icon ms" aria-hidden="true">calendar_today</span>
      <input
        class="ui-date__input"
        type="date"
        [value]="value()"
        [disabled]="disabled()"
        [min]="min()"
        [max]="max()"
        [attr.aria-label]="ariaLabel() || null"
        (input)="onInput($any($event.target).value)"
        (focus)="focused.set(true)"
        (blur)="onBlur()"
      />
      @if (value() && !disabled()) {
        <button type="button" class="ui-date__clear" tabindex="-1"
                aria-label="Clear date" (click)="clear()">
          <span class="ms">close</span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .ui-date {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm, 8px);
        padding: 0 10px 0 12px;
        background: var(--bg-primary);
        transition: border-color 150ms ease, box-shadow 150ms ease;
        cursor: text;
      }

      .ui-date:hover:not(.ui-date--disabled) {
        border-color: var(--text-tertiary);
      }

      .ui-date--focus {
        border-color: var(--color-red-ink) !important;
        box-shadow: 0 0 0 3px rgba(224, 74, 47, 0.15);
      }

      .ui-date--disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .ui-date__icon {
        font-size: 18px;
        color: var(--color-red-ink);
        flex: 0 0 auto;
        pointer-events: none;
      }

      .ui-date__input {
        flex: 1;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        padding: 10px 0;
        font-family: inherit;
        font-size: 0.92rem;
        color: var(--text-primary);
        cursor: inherit;
      }

      .ui-date__input::-webkit-calendar-picker-indicator {
        opacity: 0;
        width: 20px;
        height: 20px;
        position: absolute;
        right: 10px;
        cursor: pointer;
      }

      .ui-date__input:disabled {
        cursor: not-allowed;
      }

      .ui-date__clear {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border: none;
        border-radius: 50%;
        background: var(--bg-tertiary);
        color: var(--text-tertiary);
        cursor: pointer;
        padding: 0;
        flex: 0 0 auto;
        transition: background 120ms ease, color 120ms ease;
      }

      .ui-date__clear:hover {
        background: var(--brand-light);
        color: var(--color-red-ink);
      }

      .ui-date__clear .ms {
        font-size: 14px;
      }
    `,
  ],
})
export class UiDatepickerComponent implements ControlValueAccessor {
  readonly ariaLabel = input<string>('');
  readonly min = input<string>('');
  readonly max = input<string>('');

  readonly value = signal('');
  readonly disabled = signal(false);
  readonly focused = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
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

  onInput(raw: string): void {
    this.value.set(raw);
    this.onChange(raw);
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }

  clear(): void {
    this.value.set('');
    this.onChange('');
  }
}
