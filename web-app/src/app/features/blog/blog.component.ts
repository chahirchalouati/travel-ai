import { Component, inject, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { BlogService, BlogPost } from '../../core/services/blog.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <div class="blog">
      <header class="blog-hero">
        <div class="blog-hero__inner">
          <p class="eyebrow">{{ 'blog.eyebrow' | transloco }}</p>
          <h1>{{ 'blog.headline' | transloco }}</h1>
          <p class="hero-sub">{{ 'blog.sub' | transloco }}</p>
        </div>
      </header>

      <div class="blog-body">
        <div class="blog-inner">
          @if (posts().length) {
          <!-- Featured -->
          <section class="featured-section">
            <p class="section-label">{{ 'blog.featured' | transloco }}</p>
            <div class="featured-card">
              <div class="featured-vis" [style.background]="posts()[0].accent" aria-hidden="true">
                <span class="ms featured-icon">{{ posts()[0].icon }}</span>
              </div>
              <div class="featured-body">
                <span class="cat-badge">{{ posts()[0].category }}</span>
                <h2>{{ posts()[0].title }}</h2>
                <p>{{ posts()[0].excerpt }}</p>
                <div class="post-meta">
                  <span>{{ posts()[0].dateLabel }}</span>
                  <span class="dot" aria-hidden="true"></span>
                  <span>{{ posts()[0].readMin }} {{ 'blog.minRead' | transloco }}</span>
                </div>
                <a href="#" class="read-more">{{ 'blog.readMore' | transloco }} <span class="ms">arrow_forward</span></a>
              </div>
            </div>
          </section>

          <!-- Grid -->
          <section class="grid-section">
            <p class="section-label">{{ 'blog.latest' | transloco }}</p>
            <div class="posts-grid">
              @for (p of rest(); track p.slug) {
                <article class="post-card">
                  <div class="post-vis" [style.background]="p.accent" aria-hidden="true">
                    <span class="ms post-icon">{{ p.icon }}</span>
                  </div>
                  <div class="post-body">
                    <span class="cat-badge cat-badge--sm">{{ p.category }}</span>
                    <h3>{{ p.title }}</h3>
                    <p class="post-excerpt">{{ p.excerpt }}</p>
                    <div class="post-meta">
                      <span>{{ p.dateLabel }}</span>
                      <span class="dot"></span>
                      <span>{{ p.readMin }} {{ 'blog.minRead' | transloco }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          </section>
          }

          <!-- Newsletter -->
          <section class="newsletter">
            <div class="newsletter-inner">
              <span class="ms nl-icon">mail</span>
              <h2>{{ 'blog.newsletter.title' | transloco }}</h2>
              <p>{{ 'blog.newsletter.sub' | transloco }}</p>
              <form class="nl-form" (submit)="$event.preventDefault()">
                <input type="email" [placeholder]="'blog.newsletter.placeholder' | transloco" class="nl-input" />
                <button type="submit" class="nl-btn">{{ 'blog.newsletter.cta' | transloco }}</button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    .blog-hero {
      background: linear-gradient(155deg, var(--bg-secondary) 0%, var(--gold-light) 100%);
      padding: clamp(4rem, 9vw, 8rem) 1.5rem clamp(3rem, 6vw, 5rem);
      text-align: center;
    }
    .blog-hero__inner { max-width: 680px; margin: 0 auto; }
    .eyebrow { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-red-ink); margin: 0 0 1rem; }
    .blog-hero h1 { font-family: var(--font-display); font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.06; margin: 0 0 1.2rem; }
    .hero-sub { font-size: 1.1rem; color: var(--text-secondary); margin: 0; line-height: 1.7; }

    .blog-body { padding: clamp(2.5rem, 5vw, 4.5rem) 1.5rem; }
    .blog-inner { max-width: 1100px; margin: 0 auto; }
    .section-label { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-ink); margin: 0 0 1.25rem; }
    .section-label::before { content: ''; width: 8px; height: 8px; background: var(--color-red); flex: 0 0 auto; }

    /* Featured */
    .featured-section { margin-bottom: 3.5rem; }
    .featured-card { display: grid; grid-template-columns: 400px 1fr; border-radius: 3px; overflow: hidden; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 8px 32px rgba(33,27,20,0.08); }
    .featured-vis { min-height: 280px; display: flex; align-items: center; justify-content: center; }
    .featured-icon { font-size: 5rem; color: rgba(255,255,255,0.85); }
    .featured-body { padding: 2.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .featured-body h2 { font-family: var(--font-display); font-size: clamp(1.4rem, 2.5vw, 2rem); font-weight: 800; margin: 0; line-height: 1.2; }
    .featured-body p { font-size: 1rem; color: var(--text-secondary); line-height: 1.7; margin: 0; flex: 1; }
    .read-more { display: inline-flex; align-items: center; gap: 6px; color: var(--color-red-ink); font-weight: 700; font-size: 0.9rem; text-decoration: none; margin-top: 0.5rem; .ms { font-size: 18px; transition: transform 140ms ease; } &:hover .ms { transform: translateX(3px); } }

    /* Grid */
    .posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .post-card { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; overflow: hidden; transition: transform 150ms ease, box-shadow 150ms ease; &:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(33,27,20,0.1); } }
    .post-vis { height: 140px; display: flex; align-items: center; justify-content: center; }
    .post-icon { font-size: 3.5rem; color: rgba(255,255,255,0.82); }
    .post-body { padding: 1.4rem; display: flex; flex-direction: column; gap: 0.6rem; }
    .post-body h3 { font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.35; }
    .post-excerpt { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

    /* Common */
    .cat-badge { display: inline-block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 9px; border-radius: 2px; background: var(--brand-light); color: var(--color-red-ink); }
    .cat-badge--sm { font-size: 0.62rem; }
    .post-meta { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-tertiary); }
    .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-tertiary); display: inline-block; }

    /* Newsletter */
    .newsletter { margin-top: 3.5rem; background: var(--color-red); border-radius: 3px; padding: clamp(2.5rem, 5vw, 4rem) 2rem; }
    .newsletter-inner { max-width: 540px; margin: 0 auto; text-align: center; }
    .nl-icon { font-size: 2.5rem; color: rgba(255,255,255,0.7); display: block; margin-bottom: 1rem; }
    .newsletter h2 { font-family: var(--font-display); font-size: clamp(1.6rem, 3vw, 2.2rem); color: #fff; margin: 0 0 0.75rem; font-weight: 800; }
    .newsletter p { color: rgba(255,255,255,0.82); margin: 0 0 1.75rem; font-size: 1rem; }
    .nl-form { display: flex; gap: 0.5rem; max-width: 420px; margin: 0 auto; }
    .nl-input { flex: 1; border: none; border-radius: 2px; padding: 12px 20px; font-family: inherit; font-size: 0.95rem; background: rgba(255,255,255,0.95); &:focus { outline: 2px solid rgba(255,255,255,0.6); outline-offset: 2px; } }
    .nl-btn { background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: 2px; padding: 12px 22px; font-family: inherit; font-weight: 700; font-size: 0.9rem; cursor: pointer; white-space: nowrap; transition: background 140ms ease; &:hover { background: #000; } }

    @media (max-width: 800px) { .featured-card { grid-template-columns: 1fr; } .featured-vis { min-height: 180px; } }
    @media (max-width: 480px) { .nl-form { flex-direction: column; } .nl-input, .nl-btn { border-radius: 3px; } }
  `]
})
export class BlogComponent {
  private readonly blogService = inject(BlogService);

  posts = signal<BlogPost[]>([]);
  rest = signal<BlogPost[]>([]);

  constructor() {
    this.blogService.getPosts().subscribe({
      next: list => {
        this.posts.set(list);
        this.rest.set(list.slice(1));
      },
      error: () => {},
    });
  }
}
