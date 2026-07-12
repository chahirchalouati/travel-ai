import { booleanAttribute, Component, computed, input, output } from '@angular/core';

/**
 * Swiss-styled range slider primitive. Value-in / value-out (not a
 * `ControlValueAccessor`) to match the app's existing `[value]` + change
 * usage — bind `[value]` and listen to `(valueChange)` for the new number.
 *
 * The filled portion of the track is driven by a `--ui-range-*` custom-property
 * set defaulting to the global tokens, so a consuming scope can retheme it.
 */
@Component({
  selector: 'app-ui-range',
  standalone: true,
  template: `
    <input
      type="range"
      class="ui-range__input"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [value]="value()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-valuetext]="valueText() || null"
      [style.--_pct.%]="pct()"
      (input)="onInput($event)"
    />
  `,
  styles: [
    `
      :host {
        --_track: var(--ui-range-track, var(--bg-tertiary, #eceae3));
        --_fill: var(--ui-range-fill, var(--color-red, #e5352b));
        --_thumb: var(--ui-range-thumb, var(--color-ink, #111));
        --_thumb-size: var(--ui-range-thumb-size, 18px);
        --_track-h: var(--ui-range-track-h, 4px);
        --_radius: var(--ui-range-radius, 2px);
        --_focus: var(--ui-range-focus, var(--color-red-ink, #c42a22));
        display: block;
        width: 100%;
      }

      .ui-range__input {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: var(--_thumb-size);
        margin: 0;
        background: transparent;
        cursor: pointer;
      }
      .ui-range__input:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      /* Track — filled up to --_pct with the accent, rest is the rail. */
      .ui-range__input::-webkit-slider-runnable-track {
        height: var(--_track-h);
        border-radius: var(--_radius);
        background: linear-gradient(
          to right,
          var(--_fill) 0 var(--_pct),
          var(--_track) var(--_pct) 100%
        );
      }
      .ui-range__input::-moz-range-track {
        height: var(--_track-h);
        border-radius: var(--_radius);
        background: var(--_track);
      }
      .ui-range__input::-moz-range-progress {
        height: var(--_track-h);
        border-radius: var(--_radius);
        background: var(--_fill);
      }

      /* Thumb — a small Swiss ink square. */
      .ui-range__input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: var(--_thumb-size);
        height: var(--_thumb-size);
        margin-top: calc((var(--_track-h) - var(--_thumb-size)) / 2);
        border: none;
        border-radius: var(--_radius);
        background: var(--_thumb);
        box-shadow: 0 1px 2px rgba(17, 17, 17, 0.25);
        transition: transform 120ms ease;
      }
      .ui-range__input::-moz-range-thumb {
        width: var(--_thumb-size);
        height: var(--_thumb-size);
        border: none;
        border-radius: var(--_radius);
        background: var(--_thumb);
        box-shadow: 0 1px 2px rgba(17, 17, 17, 0.25);
      }
      .ui-range__input:hover::-webkit-slider-thumb {
        transform: scale(1.08);
      }
      .ui-range__input:focus-visible {
        outline: none;
      }
      .ui-range__input:focus-visible::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--_focus) 22%, transparent);
      }
      .ui-range__input:focus-visible::-moz-range-thumb {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--_focus) 22%, transparent);
      }

      @media (prefers-reduced-motion: reduce) {
        .ui-range__input::-webkit-slider-thumb {
          transition: none;
        }
      }
    `,
  ],
})
export class UiRangeComponent {
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly value = input<number>(0);
  readonly ariaLabel = input<string>('');
  /** Optional human-readable value for assistive tech, e.g. "€2,000". */
  readonly valueText = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emits the new numeric value as the user drags. */
  readonly valueChange = output<number>();

  /** Filled-track percentage (0–100), clamped. */
  readonly pct = computed(() => {
    const span = this.max() - this.min();
    if (span <= 0) return 0;
    const raw = ((this.value() - this.min()) / span) * 100;
    return Math.max(0, Math.min(100, raw));
  });

  onInput(event: Event): void {
    this.valueChange.emit(Number((event.target as HTMLInputElement).value));
  }
}
