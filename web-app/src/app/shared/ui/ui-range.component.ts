import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * A styled "up to" price slider that is a drop-in replacement for a numeric
 * max-price `<input>`. It implements {@link ControlValueAccessor}, so it binds
 * with `[(ngModel)]`. When the thumb is at the far right the value is emitted as
 * `undefined` ("no cap"), preserving the semantics of the original inputs.
 */
@Component({
  selector: 'app-ui-range',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiRangeComponent), multi: true },
  ],
  template: `
    <div class="ui-range">
      <div class="ui-range__head">
        <span class="ui-range__value" [class.ui-range__value--any]="isAny()">{{ displayLabel() }}</span>
      </div>
      <input
        type="range"
        class="ui-range__input"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [value]="sliderValue()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-valuetext]="displayLabel()"
        [style.--fill]="fillPct() + '%'"
        (input)="onInput($any($event.target).value)"
        (blur)="onBlur()"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .ui-range__head {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 4px;
      }

      .ui-range__value {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--brand, #e04a2f);
      }

      .ui-range__value--any {
        color: var(--text-tertiary, #8a8a8a);
      }

      .ui-range__input {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 999px;
        background: linear-gradient(
          to right,
          var(--brand, #e04a2f) 0%,
          var(--brand, #e04a2f) var(--fill, 0%),
          var(--border, #e0e0e0) var(--fill, 0%),
          var(--border, #e0e0e0) 100%
        );
        outline: none;
        cursor: pointer;
        margin: 8px 0 4px;
      }

      .ui-range__input:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .ui-range__input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        border: 2px solid var(--brand, #e04a2f);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        transition: transform 120ms ease;
      }

      .ui-range__input::-webkit-slider-thumb:hover {
        transform: scale(1.12);
      }

      .ui-range__input:focus-visible::-webkit-slider-thumb {
        box-shadow: 0 0 0 4px rgba(224, 74, 47, 0.2);
      }

      .ui-range__input::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        border: 2px solid var(--brand, #e04a2f);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        cursor: pointer;
      }

      @media (prefers-reduced-motion: reduce) {
        .ui-range__input::-webkit-slider-thumb {
          transition: none;
        }
      }
    `,
  ],
})
export class UiRangeComponent implements ControlValueAccessor {
  readonly min = input<number>(0);
  readonly max = input<number>(1000);
  readonly step = input<number>(50);
  readonly unit = input<string>('€');
  readonly ariaLabel = input<string>('');
  readonly anyLabel = input<string>('Any');

  readonly value = signal<number | undefined>(undefined);
  readonly disabled = signal(false);

  /** Slider position defaults to the far right when no cap is set. */
  readonly sliderValue = computed(() => this.value() ?? this.max());
  readonly isAny = computed(() => {
    const v = this.value();
    return v === undefined || v >= this.max();
  });
  readonly displayLabel = computed(() =>
    this.isAny() ? this.anyLabel() : `${this.unit()}${this.sliderValue().toLocaleString()}`,
  );
  readonly fillPct = computed(() => {
    const range = this.max() - this.min();
    return range <= 0 ? 0 : ((this.sliderValue() - this.min()) / range) * 100;
  });

  private onChange: (value: number | undefined) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | undefined): void {
    this.value.set(value ?? undefined);
  }

  registerOnChange(fn: (value: number | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(raw: string): void {
    const n = Number(raw);
    const next = n >= this.max() ? undefined : n;
    this.value.set(next);
    this.onChange(next);
  }

  onBlur(): void {
    this.onTouched();
  }
}
