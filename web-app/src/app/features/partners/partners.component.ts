import { Component, inject, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SiteContentService, SiteContentItem } from '../../core/services/site-content.service';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <div class="partners">
      <header class="partners-hero">
        <div class="partners-hero__inner">
          <p class="eyebrow">{{ 'partners.eyebrow' | transloco }}</p>
          <h1>{{ 'partners.headline' | transloco }}</h1>
          <p class="hero-sub">{{ 'partners.sub' | transloco }}</p>
          <div class="hero-stats">
            @for (s of stats(); track s.title) {
              <div class="hero-stat">
                <strong>{{ s.value }}</strong>
                <span>{{ s.title }}</span>
              </div>
            }
          </div>
        </div>
      </header>

      <section class="section">
        <div class="section-inner">
          <p class="section-eye">{{ 'partners.types.eye' | transloco }}</p>
          <h2>{{ 'partners.types.title' | transloco }}</h2>
          <div class="types-grid">
            @for (t of partnerTypes(); track t.title) {
              <div class="type-card">
                <div class="type-icon-wrap" [style.background]="t.accent"><span class="ms">{{ t.icon }}</span></div>
                <h3>{{ t.title }}</h3>
                <p>{{ t.body }}</p>
                <ul class="type-benefits">
                  @for (b of t.bullets; track b) {
                    <li><span class="ms">check</span>{{ b }}</li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="section section--tinted">
        <div class="section-inner">
          <p class="section-eye">{{ 'partners.process.eye' | transloco }}</p>
          <h2>{{ 'partners.process.title' | transloco }}</h2>
          <div class="steps-row">
            @for (step of steps(); track step.value) {
              <div class="step">
                <div class="step-num">{{ step.value }}</div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.body }}</p>
              </div>
              @if (!$last) { <div class="step-divider" aria-hidden="true"><span class="ms">arrow_forward</span></div> }
            }
          </div>
        </div>
      </section>

      <section class="apply-band">
        <div class="apply-inner">
          <p class="section-eye">{{ 'partners.apply.eye' | transloco }}</p>
          <h2>{{ 'partners.apply.title' | transloco }}</h2>
          <p>{{ 'partners.apply.sub' | transloco }}</p>
          <a href="mailto:partners@travelai.com" class="apply-btn">
            <span class="ms">handshake</span>
            {{ 'partners.apply.cta' | transloco }}
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    .partners-hero {
      background: linear-gradient(155deg, var(--bg-secondary) 0%, var(--bg-primary) 55%, var(--bg-tertiary) 100%);
      padding: clamp(5rem, 11vw, 9rem) 1.5rem clamp(3.5rem, 7vw, 6rem);
      text-align: center;
    }
    .partners-hero__inner { max-width: 740px; margin: 0 auto; }
    .eyebrow { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-red-ink); margin: 0 0 1.1rem; }
    .partners-hero h1 { font-family: var(--font-display); font-size: clamp(2.6rem, 5.5vw, 5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin: 0 0 1.4rem; }
    .hero-sub { font-size: 1.1rem; color: var(--text-secondary); max-width: 560px; margin: 0 auto 2.5rem; line-height: 1.75; }
    .hero-stats { display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap; }
    .hero-stat { text-align: center; strong { display: block; font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--color-red-ink); letter-spacing: -0.02em; } span { font-size: 0.88rem; color: var(--text-secondary); font-weight: 600; } }

    .section { padding: clamp(3.5rem, 7vw, 6rem) 1.5rem; }
    .section--tinted { background: var(--bg-secondary); }
    .section-inner { max-width: 960px; margin: 0 auto; }
    .section-eye { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-red-ink); margin: 0 0 0.6rem; }
    .section-inner h2 { font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 2rem; }

    .types-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .type-card { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .type-icon-wrap { width: 52px; height: 52px; border-radius: 3px; display: flex; align-items: center; justify-content: center; .ms { font-size: 1.7rem; color: #fff; } }
    .type-card h3 { font-size: 1.05rem; font-weight: 700; margin: 0; }
    .type-card p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }
    .type-benefits { list-style: none; margin: 0.25rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 5px; li { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text-secondary); .ms { font-size: 15px; color: var(--teal); } } }

    .steps-row { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; align-items: start; gap: 1rem; }
    .step { text-align: center; }
    .step-num { width: 44px; height: 44px; border-radius: var(--radius-sm); background: var(--color-red); color: #fff; font-family: var(--font-mono); font-weight: 500; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem; }
    .step h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.35rem; }
    .step p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
    .step-divider { display: flex; align-items: flex-start; justify-content: center; padding-top: 14px; .ms { font-size: 20px; color: var(--text-tertiary); } }

    .apply-band { background: var(--color-ink); padding: clamp(4rem, 8vw, 7rem) 1.5rem; }
    .apply-inner { max-width: 620px; margin: 0 auto; text-align: center; }
    .apply-band .section-eye { color: rgba(255,255,255,0.7); }
    .apply-band h2 { font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 3rem); color: #fff; font-weight: 800; margin: 0 0 0.75rem; letter-spacing: -0.02em; }
    .apply-band p { color: rgba(255,255,255,0.85); font-size: 1.05rem; margin: 0 0 2rem; line-height: 1.7; }
    .apply-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--color-red); color: #fff; text-decoration: none; font-weight: 700; font-size: 1rem; padding: 14px 32px; border-radius: var(--radius-sm); transition: background 140ms ease; .ms { font-size: 22px; } &:hover { background: var(--color-red-hover); } }

    @media (max-width: 640px) { .steps-row { grid-template-columns: 1fr; } .step-divider { display: none; } }
  `]
})
export class PartnersComponent {
  private readonly siteContent = inject(SiteContentService);

  stats = signal<SiteContentItem[]>([]);
  partnerTypes = signal<SiteContentItem[]>([]);
  steps = signal<SiteContentItem[]>([]);

  constructor() {
    this.siteContent.getPage('partners').subscribe({
      next: items => {
        this.stats.set(items.filter(i => i.section === 'stats'));
        this.partnerTypes.set(items.filter(i => i.section === 'types'));
        this.steps.set(items.filter(i => i.section === 'steps'));
      },
      error: () => {},
    });
  }
}
