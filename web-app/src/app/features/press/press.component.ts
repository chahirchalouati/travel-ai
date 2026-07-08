import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-press',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <div class="press">
      <header class="press-hero">
        <div class="press-hero__inner">
          <p class="eyebrow">{{ 'press.eyebrow' | transloco }}</p>
          <h1>{{ 'press.headline' | transloco }}</h1>
          <p class="hero-sub">{{ 'press.sub' | transloco }}</p>
        </div>
      </header>

      <div class="press-body">
        <div class="press-inner">
          <!-- Coverage -->
          <section class="coverage-section">
            <h2>{{ 'press.coverage.title' | transloco }}</h2>
            <div class="coverage-grid">
              @for (c of coverage; track c.outlet) {
                <a href="#" class="coverage-card" rel="noopener noreferrer">
                  <div class="coverage-vis" aria-hidden="true">
                    <span class="ms">{{ c.icon }}</span>
                  </div>
                  <div class="coverage-body">
                    <span class="outlet">{{ c.outlet }}</span>
                    <h3>{{ c.headlineKey | transloco }}</h3>
                    <span class="coverage-date">{{ c.date }}</span>
                  </div>
                  <span class="ms coverage-arrow">open_in_new</span>
                </a>
              }
            </div>
          </section>

          <div class="press-two-col">
            <!-- Media Kit -->
            <section class="kit-card">
              <span class="ms kit-icon">download</span>
              <h2>{{ 'press.kit.title' | transloco }}</h2>
              <p>{{ 'press.kit.body' | transloco }}</p>
              <ul class="kit-list">
                @for (item of kitItems; track item) {
                  <li><span class="ms">check_circle</span>{{ item | transloco }}</li>
                }
              </ul>
              <a href="#" class="kit-btn">
                <span class="ms">download</span>
                {{ 'press.kit.download' | transloco }}
              </a>
            </section>

            <!-- Press Contact -->
            <section class="contact-card">
              <span class="ms contact-icon">alternate_email</span>
              <h2>{{ 'press.contact.title' | transloco }}</h2>
              <p>{{ 'press.contact.body' | transloco }}</p>
              <a href="mailto:press@travelai.com" class="contact-email">press&#64;travelai.com</a>
              <div class="response-badge">
                <span class="ms">schedule</span>
                {{ 'press.contact.response' | transloco }}
              </div>
            </section>
          </div>

          <!-- Brand assets strip -->
          <section class="brand-strip">
            <h2>{{ 'press.brand.title' | transloco }}</h2>
            <div class="brand-assets">
              @for (a of brandAssets; track a.label) {
                <div class="brand-asset">
                  <div class="brand-preview" [class]="'brand-preview--' + a.variant" aria-hidden="true">
                    <span class="brand-logo-text">Travel<span>AI</span></span>
                  </div>
                  <span class="asset-label">{{ a.label | transloco }}</span>
                </div>
              }
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    .press-hero {
      background: linear-gradient(155deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
      padding: clamp(5rem, 10vw, 8.5rem) 1.5rem clamp(3.5rem, 7vw, 5.5rem);
      text-align: center;
    }
    .press-hero__inner { max-width: 680px; margin: 0 auto; }
    .eyebrow { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-tertiary); margin: 0 0 1rem; }
    .press-hero h1 { font-family: var(--font-display); font-size: clamp(2.6rem, 5vw, 4.5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.06; margin: 0 0 1.2rem; }
    .hero-sub { font-size: 1.05rem; color: var(--text-secondary); margin: 0; line-height: 1.7; }

    .press-body { padding: clamp(3rem, 6vw, 5.5rem) 1.5rem; }
    .press-inner { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 3.5rem; }

    .coverage-section h2,
    .kit-card h2,
    .contact-card h2,
    .brand-strip h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 1.5rem; }

    .coverage-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .coverage-card { display: grid; grid-template-columns: 64px 1fr auto; align-items: center; gap: 1.25rem; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem 1.5rem; text-decoration: none; color: inherit; transition: box-shadow 150ms ease, transform 150ms ease; &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(33,27,20,0.08); } }
    .coverage-vis { width: 56px; height: 56px; border-radius: 12px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; .ms { font-size: 1.8rem; color: var(--text-tertiary); } }
    .outlet { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-tertiary); margin-bottom: 4px; }
    .coverage-body h3 { font-size: 0.98rem; font-weight: 700; margin: 0 0 4px; }
    .coverage-date { font-size: 0.8rem; color: var(--text-tertiary); }
    .coverage-arrow { font-size: 18px; color: var(--text-tertiary); flex-shrink: 0; }

    .press-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .kit-card, .contact-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .kit-icon, .contact-icon { font-size: 2.2rem; color: var(--brand); }

    .kit-card p, .contact-card p { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
    .kit-list { list-style: none; margin: 0.25rem 0; padding: 0; display: flex; flex-direction: column; gap: 6px; li { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-secondary); .ms { font-size: 17px; color: var(--teal); } } }
    .kit-btn { display: inline-flex; align-items: center; gap: 8px; margin-top: 0.5rem; background: var(--brand); color: #fff; text-decoration: none; font-weight: 700; font-size: 0.9rem; padding: 11px 22px; border-radius: 999px; transition: background 140ms ease; .ms { font-size: 18px; } &:hover { background: var(--brand-hover); } }

    .contact-email { color: var(--brand); font-weight: 700; font-size: 1rem; text-decoration: none; &:hover { text-decoration: underline; } }
    .response-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-tertiary); margin-top: 0.25rem; .ms { font-size: 16px; } }

    .brand-assets { display: flex; gap: 1rem; flex-wrap: wrap; }
    .brand-asset { display: flex; flex-direction: column; gap: 0.6rem; align-items: center; }
    .brand-preview { width: 160px; height: 80px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); }
    .brand-preview--light { background: var(--surface); }
    .brand-preview--dark { background: var(--text-primary); }
    .brand-preview--brand { background: var(--brand); }
    .brand-logo-text { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: var(--text-primary); span { color: var(--brand); } }
    .brand-preview--dark .brand-logo-text { color: var(--bg-primary); span { color: var(--brand); } }
    .brand-preview--brand .brand-logo-text { color: #fff; span { color: rgba(255,255,255,0.7); } }
    .asset-label { font-size: 0.8rem; color: var(--text-tertiary); font-weight: 600; }

    @media (max-width: 640px) { .press-two-col { grid-template-columns: 1fr; } .coverage-card { grid-template-columns: 48px 1fr; } .coverage-arrow { display: none; } }
  `]
})
export class PressComponent {
  coverage = [
    { outlet: 'TechCrunch', icon: 'newspaper', headlineKey: 'press.coverage.tc', date: 'June 2025' },
    { outlet: 'The Guardian', icon: 'article', headlineKey: 'press.coverage.guardian', date: 'May 2025' },
    { outlet: 'Forbes', icon: 'business', headlineKey: 'press.coverage.forbes', date: 'Apr 2025' },
    { outlet: 'Wired', icon: 'developer_mode', headlineKey: 'press.coverage.wired', date: 'Mar 2025' },
  ];

  kitItems = ['press.kit.logos', 'press.kit.screenshots', 'press.kit.brandGuide', 'press.kit.boilerplate'];

  brandAssets = [
    { label: 'press.brand.light', variant: 'light' },
    { label: 'press.brand.dark', variant: 'dark' },
    { label: 'press.brand.color', variant: 'brand' },
  ];
}
