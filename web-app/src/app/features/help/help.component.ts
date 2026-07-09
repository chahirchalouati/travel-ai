import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { HelpService, HelpFaq } from '../../core/services/help.service';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [FormsModule, TranslocoModule, RouterLink],
  template: `
    <div class="help">
      <header class="help-hero">
        <div class="help-hero__inner">
          <h1>{{ 'help.headline' | transloco }}</h1>
          <p class="hero-sub">{{ 'help.sub' | transloco }}</p>
          <div class="search-bar">
            <span class="ms search-icon">search</span>
            <input type="text" [placeholder]="'help.search' | transloco" class="search-input" [(ngModel)]="query" />
          </div>
        </div>
      </header>

      <div class="help-body">
        <div class="help-inner">
          <!-- Topic cards -->
          <section class="topics-section">
            <h2>{{ 'help.topics.title' | transloco }}</h2>
            <div class="topics-grid">
              @for (t of topics; track t.icon) {
                <div class="topic-card">
                  <div class="topic-icon-wrap"><span class="ms">{{ t.icon }}</span></div>
                  <h3>{{ t.titleKey | transloco }}</h3>
                  <p>{{ t.bodyKey | transloco }}</p>
                </div>
              }
            </div>
          </section>

          <!-- FAQs -->
          <section class="faq-section">
            <h2>{{ 'help.faqs.title' | transloco }}</h2>
            <div class="faq-list">
              @for (faq of faqs(); track faq.id) {
                <div class="faq-item" [class.is-open]="openFaq() === faq.id">
                  <button class="faq-btn" (click)="toggleFaq(faq.id)" [attr.aria-expanded]="openFaq() === faq.id">
                    <span>{{ faq.question }}</span>
                    <span class="ms faq-chevron">{{ openFaq() === faq.id ? 'expand_less' : 'expand_more' }}</span>
                  </button>
                  @if (openFaq() === faq.id) {
                    <div class="faq-answer"><p>{{ faq.answer }}</p></div>
                  }
                </div>
              }
            </div>
          </section>

          <!-- Still need help -->
          <section class="still-help">
            <div class="still-inner">
              <span class="ms still-icon">support_agent</span>
              <h2>{{ 'help.contact.title' | transloco }}</h2>
              <p>{{ 'help.contact.sub' | transloco }}</p>
              <div class="still-btns">
                <a routerLink="/contact" class="btn-primary">{{ 'help.contact.cta' | transloco }}</a>
                <a routerLink="/chat" class="btn-secondary">{{ 'help.contact.chat' | transloco }}</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    .help-hero {
      background: linear-gradient(155deg, var(--bg-secondary) 0%, var(--teal-light) 100%);
      padding: clamp(4.5rem, 10vw, 8rem) 1.5rem clamp(3rem, 7vw, 5.5rem);
      text-align: center;
    }
    .help-hero__inner { max-width: 680px; margin: 0 auto; }
    .help-hero h1 { font-family: var(--font-display); font-size: clamp(2.4rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.06; margin: 0 0 1rem; }
    .hero-sub { font-size: 1.05rem; color: var(--text-secondary); margin: 0 0 2rem; line-height: 1.7; }

    .search-bar { display: flex; align-items: center; background: var(--surface); border: 1.5px solid var(--border); border-radius: 2px; padding: 14px 20px; gap: 12px; max-width: 520px; margin: 0 auto; box-shadow: 0 4px 20px rgba(33,27,20,0.07); transition: border-color 140ms ease; &:focus-within { border-color: var(--teal); } }
    .search-icon { font-size: 22px; color: var(--text-tertiary); }
    .search-input { flex: 1; border: none; background: none; font-family: inherit; font-size: 1rem; color: var(--text-primary); &:focus { outline: none; } &::placeholder { color: var(--text-tertiary); } }

    .help-body { padding: clamp(3rem, 6vw, 5.5rem) 1.5rem; }
    .help-inner { max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 3.5rem; }

    .topics-section h2,
    .faq-section h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 1.5rem; }

    .topics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1rem; }
    .topic-card { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 1.5rem; cursor: default; transition: box-shadow 150ms ease, transform 150ms ease; &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(33,27,20,0.08); } }
    .topic-icon-wrap { width: 44px; height: 44px; border-radius: 3px; background: var(--teal-light); display: flex; align-items: center; justify-content: center; margin-bottom: 0.85rem; .ms { font-size: 1.4rem; color: var(--teal); } }
    .topic-card h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.35rem; }
    .topic-card p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }

    .faq-list { display: flex; flex-direction: column; }
    .faq-item { border-bottom: 1px solid var(--border-light); &:first-child { border-top: 1px solid var(--border-light); } }
    .faq-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: none; border: none; padding: 1.25rem 0; font-family: inherit; font-size: 1rem; font-weight: 700; color: var(--text-primary); cursor: pointer; text-align: left; }
    .faq-chevron { font-size: 22px; color: var(--text-tertiary); flex-shrink: 0; }
    .faq-answer { padding: 0 0 1.25rem; p { margin: 0; font-size: 0.96rem; color: var(--text-secondary); line-height: 1.75; } }

    .still-help { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 3px; padding: clamp(2.5rem, 5vw, 4rem) 2rem; }
    .still-inner { text-align: center; max-width: 480px; margin: 0 auto; }
    .still-icon { font-size: 2.8rem; color: var(--color-red-ink); display: block; margin-bottom: 1rem; }
    .still-inner h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; margin: 0 0 0.75rem; letter-spacing: -0.02em; }
    .still-inner p { color: var(--text-secondary); margin: 0 0 1.75rem; line-height: 1.65; font-size: 1rem; }
    .still-btns { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
    .btn-primary { display: inline-flex; background: var(--brand); color: #fff; text-decoration: none; font-weight: 700; padding: 12px 26px; border-radius: 2px; font-size: 0.92rem; transition: background 140ms ease; &:hover { background: var(--brand-hover); } }
    .btn-secondary { display: inline-flex; background: var(--surface); color: var(--text-primary); text-decoration: none; font-weight: 700; padding: 12px 26px; border-radius: 2px; font-size: 0.92rem; border: 1px solid var(--border); transition: background 140ms ease; &:hover { background: var(--bg-tertiary); } }
  `]
})
export class HelpComponent {
  query = '';
  openFaq = signal<string | null>(null);

  topics = [
    { icon: 'flight_takeoff', titleKey: 'help.topics.bookings.title', bodyKey: 'help.topics.bookings.body' },
    { icon: 'account_circle', titleKey: 'help.topics.account.title', bodyKey: 'help.topics.account.body' },
    { icon: 'payments', titleKey: 'help.topics.payments.title', bodyKey: 'help.topics.payments.body' },
    { icon: 'cancel', titleKey: 'help.topics.cancellations.title', bodyKey: 'help.topics.cancellations.body' },
    { icon: 'smart_toy', titleKey: 'help.topics.ai.title', bodyKey: 'help.topics.ai.body' },
    { icon: 'security', titleKey: 'help.topics.security.title', bodyKey: 'help.topics.security.body' },
  ];

  private readonly helpService = inject(HelpService);
  faqs = signal<HelpFaq[]>([]);

  constructor() {
    this.helpService.getFaqs().subscribe({
      next: list => this.faqs.set(list),
      error: () => {},
    });
  }

  toggleFaq(q: string): void {
    this.openFaq.set(this.openFaq() === q ? null : q);
  }
}
