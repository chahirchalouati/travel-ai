import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';

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
              @for (tip of tips; track tip.icon) {
                <div class="tip-card">
                  <div class="tip-icon-wrap"><span class="ms">{{ tip.icon }}</span></div>
                  <div class="tip-body">
                    <h3>{{ tip.titleKey | transloco }}</h3>
                    <p>{{ tip.bodyKey | transloco }}</p>
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
                  @for (item of platformFeatures; track item) {
                    <li><span class="ms">check_circle</span>{{ item | transloco }}</li>
                  }
                </ul>
              </div>
              <div class="platform-vis" aria-hidden="true">
                <div class="shield-icon"><span class="ms">shield</span></div>
                <div class="trust-badges">
                  @for (b of trustBadges; track b.icon) {
                    <div class="trust-badge">
                      <span class="ms">{{ b.icon }}</span>
                      <span>{{ b.labelKey | transloco }}</span>
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
              @for (em of emergency; track em.icon) {
                <div class="emergency-card">
                  <span class="ms em-icon">{{ em.icon }}</span>
                  <h3>{{ em.titleKey | transloco }}</h3>
                  <p>{{ em.bodyKey | transloco }}</p>
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
      background: linear-gradient(155deg, var(--teal-light) 0%, var(--bg-secondary) 100%);
      padding: clamp(4.5rem, 10vw, 8rem) 1.5rem clamp(3rem, 7vw, 5.5rem);
      text-align: center;
    }
    .safety-hero__inner { max-width: 660px; margin: 0 auto; }
    .hero-icon { font-size: 3rem; color: var(--teal); display: block; margin-bottom: 1rem; }
    .safety-hero h1 { font-family: var(--font-display); font-size: clamp(2.4rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.06; margin: 0 0 1.2rem; }
    .hero-sub { font-size: 1.05rem; color: var(--text-secondary); margin: 0; line-height: 1.7; }

    .safety-body { padding: clamp(3rem, 6vw, 5.5rem) 1.5rem; }
    .safety-inner { max-width: 920px; margin: 0 auto; display: flex; flex-direction: column; gap: 3.5rem; }

    .tips-section h2,
    .platform-content h2,
    .emergency-section h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 1.5rem; }
    .section-eye { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--teal); margin: 0 0 0.6rem; }

    .tips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .tip-card { display: flex; gap: 1.1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.4rem; }
    .tip-icon-wrap { width: 44px; height: 44px; flex-shrink: 0; border-radius: 10px; background: var(--teal-light); display: flex; align-items: center; justify-content: center; .ms { font-size: 1.4rem; color: var(--teal); } }
    .tip-body h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.35rem; }
    .tip-body p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }

    .platform-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: clamp(2rem, 4vw, 3rem); display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
    .platform-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; .ms { font-size: 18px; color: var(--teal); flex-shrink: 0; margin-top: 1px; } } }
    .platform-vis { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
    .shield-icon { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, var(--teal-light), var(--teal)); display: flex; align-items: center; justify-content: center; .ms { font-size: 3rem; color: #fff; } }
    .trust-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
    .trust-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 999px; background: var(--bg-secondary); border: 1px solid var(--border-light); font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); .ms { font-size: 15px; color: var(--teal); } }

    .emergency-body { font-size: 1rem; color: var(--text-secondary); margin: 0 0 1.5rem; line-height: 1.7; }
    .emergency-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .emergency-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 14px; padding: 1.5rem; }
    .em-icon { font-size: 1.8rem; color: var(--brand); display: block; margin-bottom: 0.75rem; }
    .emergency-card h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.4rem; }
    .emergency-card p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }

    .report-band { display: flex; align-items: center; gap: 1.25rem; background: var(--brand-light); border: 1px solid var(--brand); border-radius: 16px; padding: 1.5rem 1.75rem; .ms { font-size: 2rem; color: var(--brand); flex-shrink: 0; } h3 { font-size: 1rem; font-weight: 700; margin: 0 0 4px; } p { font-size: 0.88rem; color: var(--text-secondary); margin: 0; } }
    .report-btn { margin-left: auto; flex-shrink: 0; background: var(--brand); color: #fff; text-decoration: none; font-weight: 700; font-size: 0.88rem; padding: 10px 20px; border-radius: 999px; white-space: nowrap; transition: background 140ms ease; &:hover { background: var(--brand-hover); } }

    @media (max-width: 640px) { .platform-card { grid-template-columns: 1fr; } .platform-vis { display: none; } .report-band { flex-wrap: wrap; .ms { display: none; } .report-btn { margin-left: 0; } } }
  `]
})
export class SafetyComponent {
  tips = [
    { icon: 'lock', titleKey: 'safety.tips.account.title', bodyKey: 'safety.tips.account.body' },
    { icon: 'verified_user', titleKey: 'safety.tips.bookings.title', bodyKey: 'safety.tips.bookings.body' },
    { icon: 'travel_explore', titleKey: 'safety.tips.research.title', bodyKey: 'safety.tips.research.body' },
    { icon: 'location_on', titleKey: 'safety.tips.location.title', bodyKey: 'safety.tips.location.body' },
    { icon: 'credit_card_off', titleKey: 'safety.tips.payments.title', bodyKey: 'safety.tips.payments.body' },
    { icon: 'health_and_safety', titleKey: 'safety.tips.health.title', bodyKey: 'safety.tips.health.body' },
  ];

  platformFeatures = [
    'safety.platform.ssl',
    'safety.platform.2fa',
    'safety.platform.fraud',
    'safety.platform.reviews',
    'safety.platform.gdpr',
  ];

  trustBadges = [
    { icon: 'https', labelKey: 'safety.badge.ssl' },
    { icon: 'verified', labelKey: 'safety.badge.verified' },
    { icon: 'gpp_good', labelKey: 'safety.badge.gdpr' },
  ];

  emergency = [
    { icon: 'phone_in_talk', titleKey: 'safety.emergency.contact.title', bodyKey: 'safety.emergency.contact.body' },
    { icon: 'local_hospital', titleKey: 'safety.emergency.medical.title', bodyKey: 'safety.emergency.medical.body' },
    { icon: 'local_police', titleKey: 'safety.emergency.police.title', bodyKey: 'safety.emergency.police.body' },
    { icon: 'support_agent', titleKey: 'safety.emergency.support.title', bodyKey: 'safety.emergency.support.body' },
  ];
}
