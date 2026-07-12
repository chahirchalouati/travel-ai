import { Component, inject, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CareersService, JobPosition } from '../../core/services/careers.service';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <div class="careers">
      <header class="careers-hero">
        <div class="careers-hero__inner">
          <p class="eyebrow">{{ 'careers.eyebrow' | transloco }}</p>
          <h1>{{ 'careers.headline' | transloco }}</h1>
          <p class="hero-sub">{{ 'careers.sub' | transloco }}</p>
        </div>
      </header>

      <section class="section">
        <div class="section-inner">
          <h2>{{ 'careers.perks.title' | transloco }}</h2>
          <div class="perks-grid">
            @for (p of perks; track p.icon) {
              <div class="perk-card">
                <div class="perk-icon-wrap"><span class="ms">{{ p.icon }}</span></div>
                <h3>{{ p.titleKey | transloco }}</h3>
                <p>{{ p.bodyKey | transloco }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="section section--tinted">
        <div class="section-inner">
          <div class="positions-head">
            <h2>{{ 'careers.positions.title' | transloco }}</h2>
            <span class="positions-count">{{ positions().length }}</span>
          </div>
          @if (positions().length === 0) {
            <div class="empty-positions">
              <span class="ms">search_off</span>
              <p>{{ 'careers.positions.none' | transloco }}</p>
            </div>
          } @else {
            <div class="positions-list">
              @for (pos of positions(); track pos.id) {
                <div class="position-row">
                  <div class="position-info">
                    <h3>{{ pos.title }}</h3>
                    <div class="position-meta">
                      <span class="pos-tag">{{ pos.department }}</span>
                      <span class="pos-tag pos-tag--location"><span class="ms">location_on</span>{{ pos.location }}</span>
                      <span class="pos-tag pos-tag--type">{{ pos.employmentType }}</span>
                    </div>
                  </div>
                  <a [href]="'mailto:' + pos.applyEmail" class="apply-btn">{{ 'careers.positions.apply' | transloco }}</a>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <section class="section culture-band">
        <div class="section-inner culture-inner">
          <div class="culture-text">
            <p class="section-eye">{{ 'careers.culture.eye' | transloco }}</p>
            <h2>{{ 'careers.culture.title' | transloco }}</h2>
            <p>{{ 'careers.culture.body' | transloco }}</p>
            <a href="mailto:careers@travelai.com" class="contact-link">
              careers&#64;travelai.com <span class="ms">arrow_forward</span>
            </a>
          </div>
          <div class="culture-icons" aria-hidden="true">
            @for (c of cultureIcons; track c) {
              <div class="culture-bubble"><span class="ms">{{ c }}</span></div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    .careers-hero {
      background: linear-gradient(155deg, var(--teal-light) 0%, var(--bg-secondary) 60%, var(--bg-tertiary) 100%);
      padding: clamp(5rem, 11vw, 9rem) 1.5rem clamp(3.5rem, 7vw, 6rem);
      text-align: center;
    }
    .careers-hero__inner { max-width: 700px; margin: 0 auto; }
    .eyebrow { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-red-ink); margin: 0 0 1.1rem; }
    .careers-hero h1 { font-family: var(--font-display); font-size: clamp(2.6rem, 5.5vw, 5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin: 0 0 1.4rem; }
    .hero-sub { font-size: 1.1rem; color: var(--text-secondary); max-width: 560px; margin: 0 auto; line-height: 1.75; }

    .section { padding: clamp(3.5rem, 7vw, 6rem) 1.5rem; }
    .section--tinted { background: var(--bg-secondary); }
    .section-inner { max-width: 960px; margin: 0 auto; }
    .section-eye { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-red-ink); margin: 0 0 0.6rem; }
    .section-inner h2 { font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 2rem; }

    .perks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 1.25rem; }
    .perk-card { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 1.75rem 1.5rem; }
    .perk-icon-wrap { width: 48px; height: 48px; border-radius: 3px; background: var(--teal-light); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; .ms { font-size: 1.6rem; color: var(--teal); } }
    .perk-card h3 { font-size: 1rem; font-weight: 700; margin: 0 0 0.4rem; }
    .perk-card p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }

    .positions-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .positions-head h2 { margin: 0; }
    .positions-count { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 8px; border-radius: 2px; background: var(--brand); color: #fff; font-size: 0.82rem; font-weight: 800; }

    .positions-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .position-row { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 1.4rem 1.6rem; }
    .position-row h3 { font-size: 1rem; font-weight: 700; margin: 0 0 0.5rem; }
    .position-meta { display: flex; flex-wrap: wrap; gap: 6px; }
    .pos-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 2px; background: var(--bg-secondary); color: var(--text-secondary); .ms { font-size: 13px; } }
    .pos-tag--location { background: var(--bg-secondary); color: var(--text-secondary); }
    .pos-tag--type { background: var(--color-red-tint); color: var(--color-red-ink); }
    .apply-btn { flex-shrink: 0; background: var(--brand); color: #fff; text-decoration: none; font-weight: 700; font-size: 0.88rem; padding: 10px 20px; border-radius: 2px; white-space: nowrap; transition: background 140ms ease; &:hover { background: var(--brand-hover); } }

    .empty-positions { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 1rem; text-align: center; color: var(--text-secondary); .ms { font-size: 40px; opacity: 0.4; } p { margin: 0; font-size: 1rem; } }

    .culture-band { background: var(--text-primary); }
    .culture-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
    .culture-text h2 { color: var(--bg-primary); font-family: var(--font-display); }
    .culture-text p { color: var(--text-tertiary); line-height: 1.75; margin: 0 0 1.5rem; font-size: 1rem; }
    .contact-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-red-ink); font-weight: 700; text-decoration: none; font-size: 0.95rem; .ms { font-size: 18px; transition: transform 140ms ease; } &:hover .ms { transform: translateX(3px); } }
    .culture-icons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .culture-bubble { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; display: flex; align-items: center; justify-content: center; aspect-ratio: 1; .ms { font-size: 2rem; color: rgba(255,255,255,0.5); } }

    @media (max-width: 700px) { .culture-inner { grid-template-columns: 1fr; } .culture-icons { display: none; } .position-row { flex-direction: column; align-items: flex-start; } }
  `]
})
export class CareersComponent {
  perks = [
    { icon: 'rocket_launch', titleKey: 'careers.perks.mission.title', bodyKey: 'careers.perks.mission.body' },
    { icon: 'trending_up', titleKey: 'careers.perks.growth.title', bodyKey: 'careers.perks.growth.body' },
    { icon: 'home_work', titleKey: 'careers.perks.remote.title', bodyKey: 'careers.perks.remote.body' },
    { icon: 'health_and_safety', titleKey: 'careers.perks.benefits.title', bodyKey: 'careers.perks.benefits.body' },
    { icon: 'flight', titleKey: 'careers.perks.travel.title', bodyKey: 'careers.perks.travel.body' },
    { icon: 'groups', titleKey: 'careers.perks.team.title', bodyKey: 'careers.perks.team.body' },
  ];

  cultureIcons = ['code', 'flight', 'people', 'lightbulb', 'diversity_3', 'rocket_launch', 'explore', 'psychology', 'eco'];

  private readonly careersService = inject(CareersService);
  positions = signal<JobPosition[]>([]);

  constructor() {
    this.careersService.getPositions().subscribe({
      next: list => this.positions.set(list),
      error: () => {},
    });
  }
}
