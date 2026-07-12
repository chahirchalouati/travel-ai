import { Component, computed, input, output, signal } from '@angular/core';
import { UiRangeComponent } from './ui-range.component';

export interface TripBrief {
  nights: number;
  place: string;
  travellers: number;
  budget: number;
  focus: string[];
}

type Token = 'nights' | 'place' | 'travellers' | 'budget' | 'focus';

/**
 * The form as a sentence. Each red value is an inline control; tapping one
 * opens its editor beneath the sentence. Emits a `TripBrief` on every change
 * and on `compose`. A conversational alternative to a stacked filter bar.
 */
@Component({
  selector: 'app-ui-sentence-brief',
  standalone: true,
  imports: [UiRangeComponent],
  template: `
    <div class="sb">
      <p class="sb__sentence">
        Plan a
        <button type="button" class="sb__tok" [class.sb__tok--on]="active() === 'nights'" (click)="toggle('nights')">{{ nights() }} {{ nights() === 1 ? 'night' : 'nights' }}</button>
        trip to
        <button type="button" class="sb__tok" [class.sb__tok--on]="active() === 'place'" (click)="toggle('place')">{{ place() }} <span class="sb__caret">▾</span></button>
        for
        <button type="button" class="sb__tok" [class.sb__tok--on]="active() === 'travellers'" (click)="toggle('travellers')">{{ travellers() }} {{ travellers() === 1 ? 'traveller' : 'travellers' }}</button>
        under
        <button type="button" class="sb__tok" [class.sb__tok--on]="active() === 'budget'" (click)="toggle('budget')">{{ money(budget()) }}</button>,
        focused on
        <button type="button" class="sb__tok" [class.sb__tok--on]="active() === 'focus'" (click)="toggle('focus')">{{ focusLabel() }} <span class="sb__caret">▾</span></button>.
      </p>

      @if (active()) {
        <div class="sb__editor">
          @switch (active()) {
            @case ('nights') {
              <div class="sb__stepper">
                <button type="button" (click)="bump('nights', -1)" aria-label="Fewer nights">−</button>
                <span>{{ nights() }} nights</span>
                <button type="button" (click)="bump('nights', 1)" aria-label="More nights">+</button>
              </div>
            }
            @case ('travellers') {
              <div class="sb__stepper">
                <button type="button" (click)="bump('travellers', -1)" aria-label="Fewer travellers">−</button>
                <span>{{ travellers() }} travellers</span>
                <button type="button" (click)="bump('travellers', 1)" aria-label="More travellers">+</button>
              </div>
            }
            @case ('place') {
              <div class="sb__chips">
                @for (p of placeOptions(); track p) {
                  <button type="button" class="sb__chip" [class.sb__chip--on]="place() === p" (click)="setPlace(p)">{{ p }}</button>
                }
              </div>
            }
            @case ('budget') {
              <div class="sb__range">
                <app-ui-range [min]="budgetMin()" [max]="budgetMax()" [step]="100" [value]="budget()" (valueChange)="setBudget($event)" [valueText]="money(budget())" />
                <span class="sb__range-val">{{ money(budget()) }}</span>
              </div>
            }
            @case ('focus') {
              <div class="sb__chips">
                @for (f of focusOptions(); track f) {
                  <button type="button" class="sb__chip" [class.sb__chip--on]="hasFocus(f)" (click)="toggleFocus(f)">{{ f }}</button>
                }
              </div>
            }
          }
        </div>
      }

      <div class="sb__foot">
        <button type="button" class="sb__go" (click)="compose.emit(brief())">Compose itinerary →</button>
        <span class="sb__hint">tap any red value to edit</span>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .sb { border: 1px solid var(--border); background: var(--surface); padding: 22px 20px; }
      .sb__sentence {
        margin: 0; font-size: clamp(1.1rem, 0.9rem + 0.9vw, 1.4rem); line-height: 1.7;
        font-weight: 500; letter-spacing: -0.01em; color: var(--text-primary);
      }
      .sb__tok {
        border: none; background: none; cursor: pointer; font: inherit;
        color: var(--color-red-ink, #C42A22); font-weight: 700;
        border-bottom: 2px dashed var(--color-red); padding: 0 3px; border-radius: 0;
        transition: background 140ms ease;
      }
      .sb__tok:hover { background: var(--color-red-tint); }
      .sb__tok--on { background: var(--color-red-tint); border-bottom-style: solid; }
      .sb__caret { font-size: 0.7em; }

      .sb__editor { margin-top: 16px; padding: 14px; border: 1px solid var(--border); background: var(--bg-secondary); }

      .sb__stepper { display: inline-flex; align-items: center; gap: 14px; font-weight: 600; font-size: 0.9rem; }
      .sb__stepper button {
        width: 36px; height: 36px; border: 1px solid var(--color-ink); background: var(--surface);
        border-radius: var(--radius-sm); cursor: pointer; font-size: 18px; line-height: 1; color: var(--color-ink);
      }
      .sb__stepper button:hover { background: var(--color-ink); color: #fff; }

      .sb__chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .sb__chip {
        border: 1px solid var(--border); background: var(--surface); cursor: pointer;
        padding: 7px 14px; border-radius: var(--radius-sm); font: inherit; font-size: 0.82rem; font-weight: 600;
        color: var(--text-secondary); transition: all 140ms ease;
      }
      .sb__chip:hover { border-color: var(--color-ink); color: var(--color-ink); }
      .sb__chip--on { background: var(--color-red); border-color: var(--color-red); color: #fff; }

      .sb__range { display: flex; align-items: center; gap: 14px; }
      .sb__range input { flex: 1; max-width: 320px; accent-color: var(--color-red); }
      .sb__range-val { font-weight: 800; font-size: 1rem; color: var(--color-ink); font-variant-numeric: tabular-nums; }

      .sb__foot { display: flex; align-items: center; gap: 14px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--color-ink); }
      .sb__go {
        background: var(--color-red); color: #fff; border: none; border-radius: var(--radius-sm);
        padding: 10px 18px; font: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer;
      }
      .sb__go:hover { background: var(--color-red-hover); }
      .sb__hint { font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-subtle, var(--text-tertiary)); }
    `,
  ],
})
export class UiSentenceBriefComponent {
  readonly placeOptions = input<string[]>(['Kyoto', 'Lisbon', 'Reykjavík', 'Amalfi', 'Marrakech']);
  readonly focusOptions = input<string[]>(['food', 'temples', 'nature', 'nightlife', 'art', 'beaches']);
  readonly currency = input<string>('EUR');
  readonly budgetMin = input<number>(500);
  readonly budgetMax = input<number>(5000);

  readonly briefChange = output<TripBrief>();
  readonly compose = output<TripBrief>();

  readonly active = signal<Token | null>(null);
  readonly nights = signal(7);
  readonly place = signal('Kyoto');
  readonly travellers = signal(2);
  readonly budget = signal(2000);
  readonly focus = signal<string[]>(['food', 'temples']);

  readonly focusLabel = computed(() => {
    const f = this.focus();
    return f.length ? f.join(' + ') : 'anything';
  });

  private readonly fmt = computed(
    () => new Intl.NumberFormat(undefined, { style: 'currency', currency: this.currency(), maximumFractionDigits: 0 })
  );

  money(v: number): string {
    return this.fmt().format(Math.round(v));
  }

  brief(): TripBrief {
    return {
      nights: this.nights(),
      place: this.place(),
      travellers: this.travellers(),
      budget: this.budget(),
      focus: this.focus(),
    };
  }

  toggle(t: Token): void {
    this.active.set(this.active() === t ? null : t);
  }

  bump(field: 'nights' | 'travellers', delta: number): void {
    const sig = field === 'nights' ? this.nights : this.travellers;
    const min = field === 'nights' ? 1 : 1;
    sig.set(Math.max(min, sig() + delta));
    this.emit();
  }

  setPlace(p: string): void {
    this.place.set(p);
    this.emit();
  }

  setBudget(v: string | number): void {
    this.budget.set(Math.round(Number(v)));
    this.emit();
  }

  hasFocus(f: string): boolean {
    return this.focus().includes(f);
  }

  toggleFocus(f: string): void {
    const cur = this.focus();
    this.focus.set(cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]);
    this.emit();
  }

  private emit(): void {
    this.briefChange.emit(this.brief());
  }
}
