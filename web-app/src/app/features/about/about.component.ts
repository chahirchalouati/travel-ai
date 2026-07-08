import { Component, inject, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { SiteContentService, SiteContentItem } from '../../core/services/site-content.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [TranslocoModule, RouterLink],
  template: `
    <div class="about">
      <section class="hero">
        <div class="hero-inner">
          <p class="eyebrow">{{ 'about.eyebrow' | transloco }}</p>
          <h1 class="hero-h1">{{ 'about.headline' | transloco }}</h1>
          <p class="hero-sub">{{ 'about.tagline' | transloco }}</p>
          <a routerLink="/chat" class="hero-cta">
            <span class="ms">explore</span>
            {{ 'about.heroCta' | transloco }}
          </a>
        </div>
      </section>

      <div class="stats-row">
        @for (s of stats(); track s.title) {
          <div class="stat">
            <strong class="stat-val">{{ s.value }}</strong>
            <span class="stat-label">{{ s.title }}</span>
          </div>
        }
      </div>

      <section class="section">
        <div class="section-inner two-col">
          <div class="mission-text">
            <p class="section-eye">{{ 'about.mission.eye' | transloco }}</p>
            <h2>{{ 'about.mission.title' | transloco }}</h2>
            <p class="body-lg">{{ 'about.mission.body' | transloco }}</p>
          </div>
          <div class="mission-img" aria-hidden="true">
            <div class="img-stack">
              <div class="img-card img-card--1"><span class="ms">flight</span></div>
              <div class="img-card img-card--2"><span class="ms">hotel</span></div>
              <div class="img-card img-card--3"><span class="ms">map</span></div>
            </div>
          </div>
        </div>
      </section>

      <section class="section section--tinted">
        <div class="section-inner">
          <p class="section-eye">{{ 'about.values.eye' | transloco }}</p>
          <h2>{{ 'about.values.title' | transloco }}</h2>
          <div class="values-grid">
            @for (v of values(); track v.title) {
              <div class="value-card">
                <div class="value-icon-wrap"><span class="ms value-icon">{{ v.icon }}</span></div>
                <h3>{{ v.title }}</h3>
                <p>{{ v.body }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="section cta-band">
        <div class="section-inner cta-inner">
          <h2>{{ 'about.cta.headline' | transloco }}</h2>
          <p>{{ 'about.cta.sub' | transloco }}</p>
          <div class="cta-btns">
            <a routerLink="/chat" class="btn-primary">{{ 'about.cta.chat' | transloco }}</a>
            <a routerLink="/planner" class="btn-secondary">{{ 'about.cta.planner' | transloco }}</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    /* Hero */
    .hero {
      background: linear-gradient(155deg, var(--bg-tertiary) 0%, var(--brand-light) 60%, var(--gold-light) 100%);
      padding: clamp(5rem, 12vw, 10rem) 1.5rem clamp(4rem, 8vw, 7rem);
      text-align: center;
    }
    .hero-inner { max-width: 780px; margin: 0 auto; }
    .eyebrow { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--brand); margin: 0 0 1.1rem; }
    .hero-h1 {
      font-family: var(--font-display);
      font-size: clamp(2.8rem, 6vw, 5.5rem);
      font-weight: 800; letter-spacing: -0.03em; line-height: 1.04; margin: 0 0 1.4rem;
    }
    .hero-sub { font-size: clamp(1.05rem, 2vw, 1.25rem); color: var(--text-secondary); max-width: 580px; margin: 0 auto 2.2rem; line-height: 1.75; }
    .hero-cta {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--brand); color: #fff; text-decoration: none;
      font-weight: 700; font-size: 0.95rem; padding: 14px 28px; border-radius: 999px;
      transition: background 140ms ease, transform 140ms ease;
      .ms { font-size: 20px; }
      &:hover { background: var(--brand-hover); transform: translateY(-1px); }
    }

    /* Stats */
    .stats-row {
      display: flex; justify-content: center; flex-wrap: wrap;
      background: var(--surface); border-bottom: 1px solid var(--border);
    }
    .stat { flex: 1; min-width: 160px; max-width: 240px; text-align: center; padding: 2.5rem 1.5rem; border-right: 1px solid var(--border-light); }
    .stat:last-child { border-right: none; }
    .stat-val { display: block; font-family: var(--font-display); font-size: clamp(2.2rem, 4vw, 3.2rem); font-weight: 800; color: var(--brand); letter-spacing: -0.02em; }
    .stat-label { font-size: 0.88rem; color: var(--text-secondary); font-weight: 600; }

    /* Sections */
    .section { padding: clamp(4rem, 8vw, 7rem) 1.5rem; }
    .section--tinted { background: var(--bg-secondary); }
    .section-inner { max-width: 960px; margin: 0 auto; }
    .section-eye { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--brand); margin: 0 0 0.75rem; }
    .section-inner h2 { font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 1.5rem; line-height: 1.15; }

    /* Mission two-col */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
    .mission-text .body-lg { font-size: 1.1rem; line-height: 1.8; color: var(--text-secondary); margin: 0; }
    .img-stack { position: relative; height: 280px; }
    .img-card {
      position: absolute; border-radius: 20px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 12px 40px rgba(33,27,20,0.14);
      .ms { font-size: 3rem; color: #fff; }
    }
    .img-card--1 { background: var(--brand); width: 160px; height: 160px; top: 0; left: 40px; }
    .img-card--2 { background: var(--teal); width: 140px; height: 140px; bottom: 0; left: 0; }
    .img-card--3 { background: var(--gold); width: 120px; height: 120px; bottom: 20px; right: 0; }

    /* Values */
    .values-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; margin-top: 2rem; }
    .value-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.75rem 1.5rem; }
    .value-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: var(--brand-light); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
    .value-icon { font-size: 1.6rem; color: var(--brand); }
    .value-card h3 { font-size: 1rem; font-weight: 700; margin: 0 0 0.5rem; }
    .value-card p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }

    /* CTA band */
    .cta-band { background: var(--text-primary); }
    .cta-inner { text-align: center; }
    .cta-band h2 { color: var(--bg-primary); font-family: var(--font-display); }
    .cta-band p { color: var(--text-tertiary); font-size: 1.05rem; margin: 0 0 2rem; }
    .cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn-primary {
      background: var(--brand); color: #fff; text-decoration: none; font-weight: 700;
      padding: 13px 28px; border-radius: 999px; font-size: 0.95rem;
      transition: background 140ms ease; &:hover { background: var(--brand-hover); }
    }
    .btn-secondary {
      background: rgba(255,255,255,0.08); color: var(--bg-secondary); text-decoration: none;
      font-weight: 700; padding: 13px 28px; border-radius: 999px; font-size: 0.95rem;
      border: 1px solid rgba(255,255,255,0.18); transition: background 140ms ease;
      &:hover { background: rgba(255,255,255,0.14); }
    }

    @media (max-width: 720px) {
      .two-col { grid-template-columns: 1fr; }
      .mission-img { display: none; }
      .stat { min-width: 120px; }
    }
  `]
})
export class AboutComponent {
  private readonly siteContent = inject(SiteContentService);

  stats = signal<SiteContentItem[]>([]);
  values = signal<SiteContentItem[]>([]);

  constructor() {
    this.siteContent.getPage('about').subscribe({
      next: items => {
        this.stats.set(items.filter(i => i.section === 'stats'));
        this.values.set(items.filter(i => i.section === 'values'));
      },
      error: () => {},
    });
  }
}
