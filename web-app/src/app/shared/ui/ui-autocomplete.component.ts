import {
  Component,
  ElementRef,
  HostListener,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subject, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import type { Suggestion } from '../../core/models/api.models';

/** Function that fetches suggestions for a query. */
export type SuggestFetch = (query: string) => Observable<Suggestion[]>;

/**
 * Debounced typeahead input ("suggest when filter"). Free text is always
 * allowed — the bound value follows what the user types — but picking a
 * suggestion applies its canonical `value` while showing its friendly `label`.
 * Implements {@link ControlValueAccessor} for `[(ngModel)]`.
 */
@Component({
  selector: 'app-ui-autocomplete',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiAutocompleteComponent), multi: true },
  ],
  template: `
    <div class="ui-ac__field" [class.ui-ac__field--open]="open()">
      @if (icon()) {
        <span class="ui-ac__icon ms" aria-hidden="true">{{ icon() }}</span>
      }
      <input
        class="ui-ac__input"
        type="text"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="ariaLabel() || null"
        [placeholder]="placeholder()"
        [value]="display()"
        [disabled]="disabled()"
        [style.text-transform]="uppercase() ? 'uppercase' : null"
        (input)="onInput($any($event.target).value)"
        (focus)="onFocus()"
        (keydown)="onKeydown($event)"
      />
      @if (loading()) {
        <span class="ui-ac__spinner" aria-hidden="true"></span>
      }
    </div>

    @if (open() && suggestions().length > 0) {
      <ul class="ui-ac__menu" role="listbox">
        @for (s of suggestions(); track s.value; let i = $index) {
          <li
            class="ui-ac__option"
            role="option"
            [class.ui-ac__option--active]="i === activeIndex()"
            [attr.aria-selected]="i === activeIndex()"
            (mousedown)="$event.preventDefault(); choose(s)"
            (mouseenter)="activeIndex.set(i)"
          >
            <span class="ui-ac__opt-icon ms" aria-hidden="true">{{ optionIcon() }}</span>
            <span class="ui-ac__opt-text">
              <span class="ui-ac__opt-label">{{ s.label }}</span>
              @if (s.hint) {
                <span class="ui-ac__opt-hint">{{ s.hint }}</span>
              }
            </span>
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

      .ui-ac__field {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--border, #e0e0e0);
        border-radius: var(--radius-sm, 8px);
        padding: 0 12px;
        background: var(--bg-primary, #fff);
        transition: border-color 150ms ease, box-shadow 150ms ease;
      }

      .ui-ac__field:focus-within,
      .ui-ac__field--open {
        border-color: var(--brand, #e04a2f);
        box-shadow: 0 0 0 3px rgba(224, 74, 47, 0.15);
      }

      .ui-ac__icon {
        font-size: 20px;
        color: var(--brand, #e04a2f);
        flex: 0 0 auto;
      }

      .ui-ac__input {
        flex: 1;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        padding: 10px 0;
        font-family: inherit;
        font-size: 0.92rem;
        color: var(--text-primary, #1a1a1a);
      }

      .ui-ac__input::placeholder {
        color: var(--text-tertiary, #8a8a8a);
        text-transform: none;
      }

      .ui-ac__spinner {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        border: 2px solid var(--border, #e0e0e0);
        border-top-color: var(--brand, #e04a2f);
        animation: ui-ac-spin 0.7s linear infinite;
        flex: 0 0 auto;
      }

      @keyframes ui-ac-spin {
        to { transform: rotate(360deg); }
      }

      .ui-ac__menu {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        z-index: 50;
        margin: 0;
        padding: 6px;
        list-style: none;
        max-height: 300px;
        overflow-y: auto;
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border, #e0e0e0);
        border-radius: var(--radius-md, 12px);
        box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.3);
        animation: ui-ac-in 140ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes ui-ac-in {
        from { opacity: 0; transform: translateY(-4px); }
      }

      .ui-ac__option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 10px;
        border-radius: var(--radius-sm, 8px);
        cursor: pointer;
        transition: background 120ms ease;
      }

      .ui-ac__option--active {
        background: var(--bg-secondary, #f7f7f7);
      }

      .ui-ac__opt-icon {
        font-size: 19px;
        color: var(--text-tertiary, #8a8a8a);
        flex: 0 0 auto;
      }

      .ui-ac__option--active .ui-ac__opt-icon {
        color: var(--brand, #e04a2f);
      }

      .ui-ac__opt-text {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
        min-width: 0;
      }

      .ui-ac__opt-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-primary, #1a1a1a);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ui-ac__opt-hint {
        font-size: 0.76rem;
        color: var(--text-tertiary, #8a8a8a);
      }

      @media (prefers-reduced-motion: reduce) {
        .ui-ac__menu { animation: none; }
        .ui-ac__spinner { animation-duration: 1.6s; }
      }
    `,
  ],
})
export class UiAutocompleteComponent implements ControlValueAccessor {
  readonly fetch = input<SuggestFetch | null>(null);
  readonly placeholder = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly icon = input<string>('');
  readonly optionIcon = input<string>('location_on');
  readonly uppercase = input<boolean>(false);

  readonly selected = output<Suggestion>();

  readonly display = signal('');
  readonly value = signal('');
  readonly suggestions = signal<readonly Suggestion[]>([]);
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly activeIndex = signal(-1);
  readonly disabled = signal(false);

  private readonly query$ = new Subject<string>();
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    this.query$
      .pipe(
        debounceTime(180),
        distinctUntilChanged(),
        tap(() => this.loading.set(true)),
        switchMap(q => {
          const fn = this.fetch();
          return fn ? fn(q) : of<Suggestion[]>([]);
        }),
        takeUntilDestroyed(),
      )
      .subscribe(list => {
        this.suggestions.set(list);
        this.loading.set(false);
        this.open.set(list.length > 0);
        this.activeIndex.set(-1);
      });
  }

  writeValue(value: string): void {
    const v = value ?? '';
    this.value.set(v);
    this.display.set(v);
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

  onInput(text: string): void {
    const next = this.uppercase() ? text.toUpperCase() : text;
    this.display.set(next);
    this.value.set(next);
    this.onChange(next);
    this.query$.next(next.trim());
  }

  onFocus(): void {
    if (this.suggestions().length > 0) {
      this.open.set(true);
    }
  }

  choose(s: Suggestion): void {
    this.value.set(s.value);
    this.display.set(s.label);
    this.onChange(s.value);
    this.selected.emit(s);
    this.close();
  }

  close(): void {
    if (this.open()) {
      this.open.set(false);
      this.onTouched();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.suggestions();
    if (!this.open() || items.length === 0) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(items.length - 1, this.activeIndex() + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(0, this.activeIndex() - 1));
        break;
      case 'Enter': {
        const active = items[this.activeIndex()];
        if (active) {
          event.preventDefault();
          this.choose(active);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
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
