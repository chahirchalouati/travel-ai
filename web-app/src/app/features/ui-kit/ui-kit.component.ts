import { Component, signal } from '@angular/core';
import {
  UiKickerComponent,
  UiBadgeComponent,
  UiButtonComponent,
  UiToggleComponent,
  UiSegmentedComponent,
  UiStatComponent,
  UiRatingComponent,
  UiAlertComponent,
  UiSpinnerComponent,
  UiSkeletonComponent,
  UiAvatarComponent,
  UiEmptyComponent,
  UiCheckboxComponent,
  type UiSegment,
} from '../../shared/ui';

interface Swatch {
  name: string;
  value: string;
  ink?: boolean;
}

/** Living style guide for the Swiss Grid UI kit. Route: /ui-kit */
@Component({
  selector: 'app-ui-kit',
  standalone: true,
  imports: [
    UiKickerComponent, UiBadgeComponent, UiButtonComponent, UiToggleComponent,
    UiSegmentedComponent, UiStatComponent, UiRatingComponent, UiAlertComponent,
    UiSpinnerComponent, UiSkeletonComponent, UiAvatarComponent, UiEmptyComponent,
    UiCheckboxComponent,
  ],
  template: `
    <div class="kit">
      <header class="kit-hero">
        <app-ui-kicker [rule]="true">Design system · v2</app-ui-kicker>
        <h1 class="kit-title display">Swiss Grid UI kit</h1>
        <p class="kit-sub">Paper white · ink · one International Red. Flat, squared, precise —
          every component below is a reusable <code>shared/ui</code> primitive.</p>
      </header>

      <!-- Foundations -->
      <section class="kit-sec">
        <app-ui-kicker>Foundations · colour</app-ui-kicker>
        <div class="swatches">
          @for (s of swatches; track s.name) {
            <div class="swatch">
              <span class="swatch__chip" [style.background]="s.value" [class.swatch__chip--bd]="s.ink"></span>
              <span class="swatch__name">{{ s.name }}</span>
              <span class="swatch__val">{{ s.value }}</span>
            </div>
          }
        </div>
        <div class="type-row">
          <span class="display" style="font-size:2.4rem">Aa</span>
          <div>
            <p class="type-name">Inter — display / body</p>
            <p class="type-mono">IBM PLEX MONO — TECHNICAL LABELS</p>
          </div>
        </div>
      </section>

      <!-- Buttons -->
      <section class="kit-sec">
        <app-ui-kicker>Actions · button</app-ui-kicker>
        <div class="row">
          <app-ui-button variant="primary">Primary</app-ui-button>
          <app-ui-button variant="outline">Outline</app-ui-button>
          <app-ui-button variant="ghost">Ghost</app-ui-button>
          <app-ui-button variant="ai" icon="auto_awesome">AI action</app-ui-button>
        </div>
        <div class="row">
          <app-ui-button size="sm" icon="add">Small</app-ui-button>
          <app-ui-button size="md">Medium</app-ui-button>
          <app-ui-button size="lg">Large</app-ui-button>
          <app-ui-button [loading]="true">Loading</app-ui-button>
          <app-ui-button [disabled]="true">Disabled</app-ui-button>
        </div>
      </section>

      <!-- Badges -->
      <section class="kit-sec">
        <app-ui-kicker>Display · badge</app-ui-kicker>
        <div class="row">
          <app-ui-badge variant="neutral">Neutral</app-ui-badge>
          <app-ui-badge variant="ink">Ink</app-ui-badge>
          <app-ui-badge variant="red" icon="bolt">New</app-ui-badge>
          <app-ui-badge variant="success" icon="check">Available</app-ui-badge>
          <app-ui-badge variant="warning">Limited</app-ui-badge>
          <app-ui-badge variant="outline">Outline</app-ui-badge>
        </div>
      </section>

      <!-- Selection controls -->
      <section class="kit-sec">
        <app-ui-kicker>Controls · selection</app-ui-kicker>
        <div class="row row--mid">
          <app-ui-segmented [options]="segments" [(value)]="segvalue" />
          <span class="hint">value: {{ segvalue() }}</span>
        </div>
        <div class="row row--mid">
          <app-ui-toggle label="Instant replan" [(value)]="toggleA" />
          <app-ui-toggle label="Price alerts" [(value)]="toggleB" />
          <app-ui-checkbox label="Sea view" [(checked)]="checkA" />
          <app-ui-checkbox label="Pet friendly" [(checked)]="checkB" />
        </div>
      </section>

      <!-- Stats -->
      <section class="kit-sec">
        <app-ui-kicker>Display · statistic</app-ui-kicker>
        <div class="stat-grid">
          <app-ui-stat label="Destinations" value="150+" />
          <app-ui-stat label="Reviews" value="2.4M" [accent]="true" />
          <app-ui-stat label="Avg rating" value="9.3" delta="+0.2" trend="up" />
          <app-ui-stat label="Service fee" value="0%" delta="−6%" trend="down" />
        </div>
      </section>

      <!-- Rating + avatars -->
      <section class="kit-sec">
        <app-ui-kicker>Display · rating & avatar</app-ui-kicker>
        <div class="row row--mid">
          <app-ui-rating [value]="4.6" count="1,204 reviews" />
          <app-ui-rating [value]="3.2" />
        </div>
        <div class="row row--mid">
          <app-ui-avatar name="Wow Test" [size]="44" />
          <app-ui-avatar name="Marco Bianchi" [size]="44" shape="square" />
          <app-ui-avatar name="Stefano Fabbri" [size]="32" />
        </div>
      </section>

      <!-- Alerts -->
      <section class="kit-sec">
        <app-ui-kicker>Feedback · alert</app-ui-kicker>
        <div class="stack">
          <app-ui-alert variant="info" title="Heads up">Your itinerary rebuilds instantly when you change the budget.</app-ui-alert>
          <app-ui-alert variant="success" title="Booked">Reservation confirmed — a receipt is on its way.</app-ui-alert>
          <app-ui-alert variant="warning">Only 2 rooms left at this price.</app-ui-alert>
          <app-ui-alert variant="danger" title="Payment failed" [dismissible]="true">That card was declined. Try another.</app-ui-alert>
        </div>
      </section>

      <!-- Loading -->
      <section class="kit-sec">
        <app-ui-kicker>Feedback · loading</app-ui-kicker>
        <div class="row row--mid">
          <app-ui-spinner [size]="18" />
          <app-ui-spinner [size]="28" />
          <div class="skel-card">
            <app-ui-skeleton height="88px" />
            <app-ui-skeleton width="70%" />
            <app-ui-skeleton width="40%" />
          </div>
        </div>
      </section>

      <!-- Empty state -->
      <section class="kit-sec">
        <app-ui-kicker>Feedback · empty state</app-ui-kicker>
        <div class="card-frame">
          <app-ui-empty icon="luggage" title="No trips yet" message="Plan your first trip and it will show up here.">
            <app-ui-button variant="primary" icon="add">New trip</app-ui-button>
          </app-ui-empty>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host { display: block; background: var(--bg-primary); }
      .kit { max-width: 960px; margin: 0 auto; padding: 96px 24px 80px; }

      .kit-hero { padding-bottom: 28px; margin-bottom: 8px; }
      .kit-title { margin: 16px 0 10px; font-size: clamp(2.2rem, 1.4rem + 3vw, 3.4rem); color: var(--text-primary); }
      .kit-sub { max-width: 52ch; font-size: 1.02rem; line-height: 1.6; color: var(--text-secondary); }
      .kit-sub code { font-family: var(--font-mono); font-size: 0.85em; color: var(--color-red); }

      .kit-sec { padding: 28px 0; border-top: 1px solid var(--border); }
      .kit-sec > app-ui-kicker { margin-bottom: 20px; }

      .row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
      .row + .row { margin-top: 14px; }
      .row--mid { align-items: center; gap: 20px; }
      .hint { font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-secondary); }
      .stack { display: flex; flex-direction: column; gap: 12px; max-width: 560px; }

      .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; margin-bottom: 24px; }
      .swatch { display: flex; flex-direction: column; gap: 4px; }
      .swatch__chip { height: 46px; border-radius: var(--radius-sm); }
      .swatch__chip--bd { border: 1px solid var(--border); }
      .swatch__name { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
      .swatch__val { font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-secondary); }

      .type-row { display: flex; align-items: center; gap: 18px; padding-top: 6px; }
      .type-name { margin: 0 0 4px; font-weight: 700; color: var(--text-primary); }
      .type-mono { margin: 0; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; color: var(--text-secondary); }

      .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0; border: 1px solid var(--border); }
      .stat-grid app-ui-stat { padding: 20px; border-right: 1px solid var(--border); }
      .stat-grid app-ui-stat:last-child { border-right: none; }

      .skel-card { flex: 1; min-width: 220px; max-width: 280px; display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
      .card-frame { border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
    `,
  ],
})
export class UiKitComponent {
  readonly swatches: Swatch[] = [
    { name: 'Paper', value: '#F6F5F1', ink: true },
    { name: 'Surface', value: '#FFFFFF', ink: true },
    { name: 'Ink', value: '#111111' },
    { name: 'International Red', value: '#E5352B' },
    { name: 'Red tint', value: '#FDECEA', ink: true },
    { name: 'Success', value: '#1F7A4D' },
    { name: 'Warning', value: '#C25A17' },
    { name: 'Hairline', value: '#E4E1D9', ink: true },
  ];

  readonly segments: UiSegment[] = [
    { value: 'stays', label: 'Stays', icon: 'hotel' },
    { value: 'flights', label: 'Flights', icon: 'flight' },
    { value: 'dining', label: 'Dining', icon: 'restaurant' },
  ];

  readonly segvalue = signal('stays');
  readonly toggleA = signal(true);
  readonly toggleB = signal(false);
  readonly checkA = signal(true);
  readonly checkB = signal(false);
}
