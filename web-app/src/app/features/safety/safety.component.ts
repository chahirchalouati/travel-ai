import { Component, inject, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { SiteContentService, SiteContentItem } from '../../core/services/site-content.service';

@Component({
  selector: 'app-safety',
  standalone: true,
  imports: [TranslocoModule, RouterLink],
  template: `
    <div class="safety">
      <header class="safety-hero">
        <div class="safety-hero__inner">
          <span class="ms hero-icon">security</span>
          <h1>{{ 'safety.headline' | transloco }}</h1>
          <p class="hero-sub">{{ 'safety.sub' | transloco }}</p>
        </div>
      </header>

      <div class="safety-body">
        <div class="safety-inner">

          <!-- Safety tips -->
          <section class="tips-section">
            <h2>{{ 'safety.tips.title' | transloco }}</h2>
            <div class="tips-grid">
              @for (tip of tips(); track tip.title) {
                <div class="tip-card">
                  <div class="tip-icon-wrap"><span class="ms">{{ tip.icon }}</span></div>
                  <div class="tip-body">
                    <h3>{{ tip.title }}</h3>
                    <p>{{ tip.body }}</p>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Platform safety -->
          <section class="platform-section">
            <div class="platform-card">
              <div class="platform-content">
                <p class="section-eye">{{ 'safety.platform.eye' | transloco }}</p>
                <h2>{{ 'safety.platform.title' | transloco }}</h2>
                <ul class="platform-list">
                  @for (item of platformFeatures(); track item.body) {
                    <li><span class="ms">check_circle</span>{{ item.body }}</li>
                  }
                </ul>
              </div>
              <div class="platform-vis" aria-hidden="true">
                <div class="shield-icon"><span class="ms">shield</span></div>
                <div class="trust-badges">
                  @for (b of trustBadges(); track b.title) {
                    <div class="trust-badge">
                      <span class="ms">{{ b.icon }}</span>
                      <span>{{ b.title }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </section>

          <!-- Emergency -->
          <section class="emergency-section">
            <h2>{{ 'safety.emergency.title' | transloco }}</h2>
            <p class="emergency-body">{{ 'safety.emergency.body' | transloco }}</p>
            <div class="emergency-cards">
              @for (em of emergency(); track em.title) {
                <div class="emergency-card">
                  <span class="ms em-icon">{{ em.icon }}</span>
                  <h3>{{ em.title }}</h3>
                  <p>{{ em.body }}</p>
                </div>
              }
            </div>
          </section>

          <div class="report-band">
            <span class="ms">flag</span>
            <div>
              <h3>{{ 'safety.report.title' | transloco }}</h3>
              <p>{{ 'safety.report.body' | transloco }}</p>
            </div>
            <a routerLink="/contact" class="report-btn">{{ 'safety.report.cta' | transloco }}</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    .safety-hero {
      background: linear-gradient(155deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
      padding: clamp(4.5rem, 10vw, 8rem) 1.5rem clamp(3rem, 7vw, 5.5rem);
      text-align: center;
    }
    .safety-hero__inner { max-width: 660px; margin: 0 auto; }
    .hero-icon { font-size: 3rem; color: var(--color-ink); display: block; margin-bottom: 1rem; }
    .safety-hero h1 { font-family: var(--font-display); font-size: clamp(2.4rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.06; margin: 0 0 1.2rem; }
    .hero-sub { font-size: 1.05rem; color: var(--text-secondary); margin: 0; line-height: 1.7; }

    .safety-body { padding: clamp(3rem, 6vw, 5.5rem) 1.5rem; }
    .safety-inner { max-width: 920px; margin: 0 auto; display: flex; flex-direction: column; gap: 3.5rem; }

    .tips-section h2,
    .platform-content h2,
    .emergency-section h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 1.5rem; }
    .section-eye { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-red-ink); margin: 0 0 0.6rem; }

    .tips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .tip-card { display: flex; gap: 1.1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 1.4rem; }
    .tip-icon-wrap { width: 44px; height: 44px; flex-shrink: 0; border-radius: 3px; background: var(--color-red-tint); display: flex; align-items: center; justify-content: center; .ms { font-size: 1.4rem; color: var(--color-red-ink); } }
    .tip-body h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.35rem; }
    .tip-body p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }

    .platform-card { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: clamp(2rem, 4vw, 3rem); display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
    .platform-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; .ms { font-size: 18px; color: var(--teal); flex-shrink: 0; margin-top: 1px; } } }
    .platform-vis { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
    .shield-icon { width: 100px; height: 100px; border-radius: var(--radius-md); background: var(--color-ink); display: flex; align-items: center; justify-content: center; .ms { font-size: 3rem; color: #fff; } }
    .trust-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
    .trust-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 2px; background: var(--bg-secondary); border: 1px solid var(--border-light); font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); .ms { font-size: 15px; color: var(--teal); } }

    .emergency-body { font-size: 1rem; color: var(--text-secondary); margin: 0 0 1.5rem; line-height: 1.7; }
    .emergency-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .emergency-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 3px; padding: 1.5rem; }
    .em-icon { font-size: 1.8rem; color: var(--color-red-ink); display: block; margin-bottom: 0.75rem; }
    .emergency-card h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.4rem; }
    .emergency-card p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }

    .report-band { display: flex; align-items: center; gap: 1.25rem; background: var(--brand-light); border: 1px solid var(--brand); border-radius: 3px; padding: 1.5rem 1.75rem; .ms { font-size: 2rem; color: var(--color-red-ink); flex-shrink: 0; } h3 { font-size: 1rem; font-weight: 700; margin: 0 0 4px; } p { font-size: 0.88rem; color: var(--text-secondary); margin: 0; } }
    .report-btn { margin-left: auto; flex-shrink: 0; background: var(--brand); color: #fff; text-decoration: none; font-weight: 700; font-size: 0.88rem; padding: 10px 20px; border-radius: 2px; white-space: nowrap; transition: background 140ms ease; &:hover { background: var(--brand-hover); } }

    @media (max-width: 640px) { .platform-card { grid-template-columns: 1fr; } .platform-vis { display: none; } .report-band { flex-wrap: wrap; .ms { display: none; } .report-btn { margin-left: 0; } } }
  `]
})
export class SafetyComponent {
  private readonly siteContent = inject(SiteContentService);

  tips = signal<SiteContentItem[]>([]);
  platformFeatures = signal<SiteContentItem[]>([]);
  trustBadges = signal<SiteContentItem[]>([]);
  emergency = signal<SiteContentItem[]>([]);

  constructor() {
    this.siteContent.getPage('safety').subscribe({
      next: items => {
        this.tips.set(items.filter(i => i.section === 'tips'));
        this.platformFeatures.set(items.filter(i => i.section === 'platform'));
        this.trustBadges.set(items.filter(i => i.section === 'badges'));
        this.emergency.set(items.filter(i => i.section === 'emergency'));
      },
      error: () => {},
    });
  }
}
