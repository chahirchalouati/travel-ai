import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { computeMenuPosition } from './menu-position.util';

/** A single option in a {@link UiSelectComponent}. */
export interface UiSelectOption {
  readonly value: unknown;
  readonly label: string;
}

/**
 * Accessible custom dropdown that is a drop-in replacement for a native
 * `<select>` — it implements {@link ControlValueAccessor} so it works with
 * `[(ngModel)]` / reactive forms while giving full control over styling and
 * keyboard behaviour (arrow keys, Enter, Escape, type-ahead-free navigation).
 */
@Component({
  selector: 'app-ui-select',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSelectComponent), multi: true },
  ],
  template: `
    <button
      #trigger
      type="button"
      class="ui-select__trigger"
      [class.ui-select__trigger--open]="open()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-expanded]="open()"
      aria-haspopup="listbox"
      [disabled]="disabled()"
      (click)="toggle()"
      (keydown)="onKeydown($event)"
    >
      <span class="ui-select__value" [class.ui-select__value--placeholder]="!selectedLabel()">
        {{ selectedLabel() || placeholder() }}
      </span>
      <span class="ui-select__chevron ms" aria-hidden="true">expand_more</span>
    </button>

    @if (open()) {
      <ul class="ui-select__menu" role="listbox" [attr.aria-label]="ariaLabel() || null"
          [style.top.px]="menuPosition().top" [style.left.px]="menuPosition().left"
          [style.width.px]="menuPosition().width" [style.max-height.px]="menuPosition().maxHeight">
        @for (opt of options(); track $index) {
          <li
            class="ui-select__option"
            role="option"
            [class.ui-select__option--active]="$index === activeIndex()"
            [class.ui-select__option--selected]="same(opt.value, value())"
            [attr.aria-selected]="same(opt.value, value())"
            (click)="select(opt)"
            (mouseenter)="activeIndex.set($index)"
          >
            <span>{{ opt.label }}</span>
            @if (same(opt.value, value())) {
              <span class="ms ui-select__check" aria-hidden="true">check</span>
            }
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      :host {
        position: relative;
        display: block;
        width: 100%;
      }

      .ui-select__trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm, 8px);
        padding: 10px 12px;
        font-family: inherit;
        font-size: 0.92rem;
        color: var(--text-primary);
        background: var(--bg-primary);
        cursor: pointer;
        text-align: left;
        transition: border-color 150ms ease, box-shadow 150ms ease;
      }

      .ui-select__trigger:hover:not(:disabled) {
        border-color: var(--text-tertiary);
      }

      .ui-select__trigger:focus-visible,
      .ui-select__trigger--open {
        outline: none;
        border-color: var(--color-red-ink);
        box-shadow: 0 0 0 3px rgba(224, 74, 47, 0.15);
      }

      .ui-select__trigger:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .ui-select__value {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ui-select__value--placeholder {
        color: var(--text-tertiary);
      }

      .ui-select__chevron {
        font-size: 20px;
        color: var(--text-tertiary);
        transition: transform 150ms ease;
        flex: 0 0 auto;
      }

      .ui-select__trigger--open .ui-select__chevron {
        transform: rotate(180deg);
      }

      .ui-select__menu {
        position: fixed;
        z-index: 300;
        margin: 0;
        padding: 6px;
        list-style: none;
        overflow-y: auto;
        background: var(--bg-primary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md, 12px);
        box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.28);
        animation: ui-select-in 140ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes ui-select-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
      }

      .ui-select__option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 9px 10px;
        border-radius: var(--radius-sm, 8px);
        font-size: 0.9rem;
        color: var(--text-primary);
        cursor: pointer;
        transition: background 120ms ease;
      }

      .ui-select__option--active {
        background: var(--bg-secondary);
      }

      .ui-select__option--selected {
        color: var(--color-red-ink);
        font-weight: 600;
      }

      .ui-select__check {
        font-size: 18px;
        flex: 0 0 auto;
      }

      @media (prefers-reduced-motion: reduce) {
        .ui-select__menu {
          animation: none;
        }
        .ui-select__chevron {
          transition: none;
        }
      }
    `,
  ],
})
export class UiSelectComponent implements ControlValueAccessor {
  readonly options = input<readonly UiSelectOption[]>([]);
  readonly placeholder = input<string>('Select');
  readonly ariaLabel = input<string>('');

  @ViewChild('trigger') private readonly triggerRef!: ElementRef<HTMLButtonElement>;

  readonly open = signal(false);
  readonly value = signal<unknown>(undefined);
  readonly disabled = signal(false);
  readonly activeIndex = signal(-1);
  /** Viewport-relative position for the fixed-position menu, so it escapes
   * any ancestor with `overflow: hidden` (e.g. the hero header). */
  readonly menuPosition = signal({ top: 0, left: 0, width: 0, maxHeight: 260 });

  readonly selectedLabel = computed(() => {
    const current = this.value();
    return this.options().find(o => this.same(o.value, current))?.label ?? '';
  });

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  writeValue(value: unknown): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /** Value equality used for selection highlighting. */
  same(a: unknown, b: unknown): boolean {
    return a === b;
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.open.update(o => !o);
    if (this.open()) {
      this.activeIndex.set(this.options().findIndex(o => this.same(o.value, this.value())));
      const rect = this.triggerRef.nativeElement.getBoundingClientRect();
      this.menuPosition.set(computeMenuPosition(rect));
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.close();
  }

  close(): void {
    if (this.open()) {
      this.open.set(false);
      this.onTouched();
    }
  }

  select(opt: UiSelectOption): void {
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.close();
  }

  onKeydown(event: KeyboardEvent): void {
    const opts = this.options();
    if (!this.open()) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.toggle();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(opts.length - 1, this.activeIndex() + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(0, this.activeIndex() - 1));
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const opt = opts[this.activeIndex()];
        if (opt) {
          this.select(opt);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
