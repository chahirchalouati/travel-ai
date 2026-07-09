import { Component, Input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

export interface LegalSection {
  title: string;
  /** One or more paragraphs rendered under the section heading. */
  paragraphs: string[];
}

@Component({
  selector: 'app-legal-layout',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <div class="legal">
      <header class="legal-hero">
        <div class="legal-hero__inner">
          <p class="eyebrow">{{ 'legal.eyebrow' | transloco }}</p>
          <h1>{{ title }}</h1>
          <p class="updated">{{ 'legal.lastUpdated' | transloco }} {{ updated }}</p>
        </div>
      </header>

      <div class="legal-body">
        <article class="legal-inner">
          @if (intro) {
            <p class="lead">{{ intro }}</p>
          }
          @for (s of sections; track s.title; let i = $index) {
            <section class="legal-section">
              <h2><span class="sec-num">{{ i + 1 }}.</span>{{ s.title }}</h2>
              @for (p of s.paragraphs; track p) {
                <p>{{ p }}</p>
              }
            </section>
          }
          <div class="legal-foot">
            <span class="ms">mail</span>
            <p>{{ 'legal.contactLine' | transloco }} <a href="mailto:legal&#64;travelai.com">legal&#64;travelai.com</a></p>
          </div>
        </article>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    .legal-hero {
      background: linear-gradient(155deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
      padding: clamp(4.5rem, 9vw, 7.5rem) 1.5rem clamp(3rem, 6vw, 4.5rem);
      border-bottom: 1px solid var(--border-light);
    }
    .legal-hero__inner { max-width: 760px; margin: 0 auto; }
    .eyebrow { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-red-ink); margin: 0 0 0.9rem; }
    .legal-hero h1 { font-family: var(--font-display); font-size: clamp(2.2rem, 4.5vw, 3.6rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.08; margin: 0 0 0.9rem; }
    .updated { font-size: 0.9rem; color: var(--text-tertiary); margin: 0; font-weight: 600; }

    .legal-body { padding: clamp(2.5rem, 5vw, 4rem) 1.5rem clamp(3.5rem, 7vw, 6rem); }
    .legal-inner { max-width: 760px; margin: 0 auto; }
    .lead { font-size: 1.1rem; color: var(--text-secondary); line-height: 1.75; margin: 0 0 2.5rem; }

    .legal-section { margin-bottom: 2.25rem; }
    .legal-section h2 { font-family: var(--font-display); font-size: clamp(1.25rem, 2.4vw, 1.6rem); font-weight: 800; letter-spacing: -0.01em; margin: 0 0 0.9rem; display: flex; gap: 0.6rem; align-items: baseline; }
    .sec-num { color: var(--color-red-ink); font-size: 0.85em; }
    .legal-section p { font-size: 0.98rem; color: var(--text-secondary); line-height: 1.8; margin: 0 0 0.9rem; &:last-child { margin-bottom: 0; } }

    .legal-foot { display: flex; align-items: center; gap: 0.85rem; margin-top: 3rem; padding: 1.4rem 1.6rem; background: var(--surface); border: 1px solid var(--border); border-radius: 3px;
      .ms { font-size: 1.5rem; color: var(--color-red-ink); flex-shrink: 0; }
      p { margin: 0; font-size: 0.92rem; color: var(--text-secondary); }
      a { color: var(--color-red-ink); font-weight: 700; text-decoration: none; &:hover { text-decoration: underline; } }
    }
  `]
})
export class LegalLayoutComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) updated = '';
  @Input() intro?: string;
  @Input({ required: true }) sections: LegalSection[] = [];
}
