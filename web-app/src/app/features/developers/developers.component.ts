import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <div class="devs">
      <header class="devs-hero">
        <div class="devs-hero__inner">
          <p class="eyebrow">{{ 'developers.eyebrow' | transloco }}</p>
          <h1>{{ 'developers.headline' | transloco }}</h1>
          <p class="hero-sub">{{ 'developers.sub' | transloco }}</p>
          <div class="hero-actions">
            <a href="mailto:api@travelai.com" class="btn-primary">{{ 'developers.start.cta' | transloco }}</a>
            <a href="#features" class="btn-ghost">{{ 'developers.start.explore' | transloco }}</a>
          </div>
        </div>
        <!-- Code preview -->
        <div class="hero-code" aria-hidden="true">
          <div class="code-bar">
            <span class="dot dot--red"></span>
            <span class="dot dot--amber"></span>
            <span class="dot dot--green"></span>
            <span class="code-file">travelai-api.js</span>
          </div>
          <pre class="code-block"><span class="c-kw">const</span> <span class="c-var">client</span> <span class="c-op">=</span> <span class="c-fn">TravelAI</span>(<span class="c-str">'your-api-key'</span>);

<span class="c-kw">const</span> <span class="c-var">results</span> <span class="c-op">=</span> <span class="c-kw">await</span> client<span class="c-op">.</span>search<span class="c-op">.</span><span class="c-fn">hotels</span>(&#123;
  city<span class="c-op">:</span> <span class="c-str">'Paris'</span>,
  checkIn<span class="c-op">:</span> <span class="c-str">'2025-09-15'</span>,
  guests<span class="c-op">:</span> <span class="c-num">2</span>,
  maxBudget<span class="c-op">:</span> <span class="c-num">250</span>,
&#125;);

console<span class="c-op">.</span><span class="c-fn">log</span>(results<span class="c-op">.</span>data<span class="c-op">.</span>hotels);
<span class="c-comment">// → [&#123; name, price, rating, ... &#125;]</span></pre>
        </div>
      </header>

      <div class="devs-body" id="features">
        <div class="devs-inner">

          <!-- Features -->
          <section class="features-section">
            <p class="section-eye">{{ 'developers.features.eye' | transloco }}</p>
            <h2>{{ 'developers.features.title' | transloco }}</h2>
            <div class="features-grid">
              @for (f of features; track f.icon) {
                <div class="feature-card">
                  <div class="feature-icon-wrap"><span class="ms">{{ f.icon }}</span></div>
                  <h3>{{ f.titleKey | transloco }}</h3>
                  <p>{{ f.bodyKey | transloco }}</p>
                </div>
              }
            </div>
          </section>

          <!-- Endpoints -->
          <section class="endpoints-section">
            <h2>{{ 'developers.endpoints.title' | transloco }}</h2>
            <div class="endpoints-list">
              @for (ep of endpoints; track ep.method + ep.path) {
                <div class="endpoint-row">
                  <span class="method" [class]="'method--' + ep.method.toLowerCase()">{{ ep.method }}</span>
                  <code class="ep-path">{{ ep.path }}</code>
                  <span class="ep-desc">{{ ep.descKey | transloco }}</span>
                </div>
              }
            </div>
          </section>

          <!-- SDKs -->
          <section class="sdks-section">
            <h2>{{ 'developers.sdks.title' | transloco }}</h2>
            <div class="sdks-grid">
              @for (sdk of sdks; track sdk.lang) {
                <div class="sdk-card">
                  <div class="sdk-icon" [style.background]="sdk.color">{{ sdk.emoji }}</div>
                  <div>
                    <h3>{{ sdk.lang }}</h3>
                    <code>{{ sdk.install }}</code>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- CTA -->
          <section class="cta-section">
            <div class="cta-inner">
              <span class="ms cta-icon">api</span>
              <h2>{{ 'developers.cta.title' | transloco }}</h2>
              <p>{{ 'developers.cta.body' | transloco }}</p>
              <a href="mailto:api@travelai.com" class="cta-btn">{{ 'developers.cta.btn' | transloco }}</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }

    .devs-hero {
      background: var(--text-primary);
      padding: clamp(4rem, 8vw, 7rem) clamp(1.5rem, 4vw, 4rem);
      display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
    }
    .devs-hero__inner { max-width: 540px; }
    .eyebrow { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--brand); margin: 0 0 1rem; }
    .devs-hero h1 { font-family: var(--font-display); font-size: clamp(2.4rem, 4.5vw, 4.5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.06; margin: 0 0 1.2rem; color: var(--bg-primary); }
    .hero-sub { font-size: 1.05rem; color: var(--text-tertiary); margin: 0 0 2rem; line-height: 1.7; }
    .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
    .btn-primary { display: inline-flex; background: var(--brand); color: #fff; text-decoration: none; font-weight: 700; padding: 13px 26px; border-radius: 999px; font-size: 0.92rem; transition: background 140ms ease; &:hover { background: var(--brand-hover); } }
    .btn-ghost { display: inline-flex; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); text-decoration: none; font-weight: 700; padding: 13px 26px; border-radius: 999px; font-size: 0.92rem; border: 1px solid rgba(255,255,255,0.15); transition: background 140ms ease; &:hover { background: rgba(255,255,255,0.14); } }

    /* Code block */
    .hero-code { border-radius: 16px; overflow: hidden; background: #0d1117; border: 1px solid rgba(255,255,255,0.1); }
    .code-bar { display: flex; align-items: center; gap: 6px; padding: 12px 16px; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08); }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot--red { background: #ff5f57; }
    .dot--amber { background: #febc2e; }
    .dot--green { background: #28c840; }
    .code-file { margin-left: auto; font-size: 0.75rem; color: rgba(255,255,255,0.35); font-family: 'SFMono-Regular', ui-monospace, monospace; }
    .code-block { margin: 0; padding: 1.5rem; font-family: 'SFMono-Regular', ui-monospace, monospace; font-size: 0.82rem; line-height: 1.75; overflow-x: auto; color: #e6edf3; }
    .c-kw { color: #ff7b72; }
    .c-var { color: #e6edf3; }
    .c-fn { color: #d2a8ff; }
    .c-str { color: #a5d6ff; }
    .c-num { color: #79c0ff; }
    .c-op { color: #ff7b72; }
    .c-comment { color: #8b949e; }

    /* Body */
    .devs-body { padding: clamp(3rem, 6vw, 5.5rem) 1.5rem; }
    .devs-inner { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 3.5rem; }
    .section-eye { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--brand); margin: 0 0 0.6rem; }

    .features-section h2,
    .endpoints-section h2,
    .sdks-section h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 1.5rem; }

    .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }
    .feature-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.5rem; }
    .feature-icon-wrap { width: 44px; height: 44px; border-radius: 10px; background: var(--brand-light); display: flex; align-items: center; justify-content: center; margin-bottom: 0.85rem; .ms { font-size: 1.4rem; color: var(--brand); } }
    .feature-card h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.35rem; }
    .feature-card p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }

    .endpoints-list { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
    .endpoint-row { display: grid; grid-template-columns: 72px 240px 1fr; align-items: center; gap: 1rem; padding: 0.9rem 1.25rem; background: var(--surface); border-bottom: 1px solid var(--border-light); &:last-child { border-bottom: none; } }
    .method { font-family: 'SFMono-Regular', ui-monospace, monospace; font-size: 0.72rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-align: center; }
    .method--get { background: #e1f5e8; color: #15803d; }
    .method--post { background: var(--brand-light); color: var(--brand); }
    .method--patch { background: var(--gold-light); color: var(--gold); }
    .method--delete { background: #fde8e8; color: #c0392b; }
    .ep-path { font-family: 'SFMono-Regular', ui-monospace, monospace; font-size: 0.82rem; color: var(--text-primary); }
    .ep-desc { font-size: 0.85rem; color: var(--text-secondary); }

    .sdks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .sdk-card { display: flex; align-items: center; gap: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem; }
    .sdk-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
    .sdk-card h3 { font-size: 0.92rem; font-weight: 700; margin: 0 0 4px; }
    .sdk-card code { font-family: 'SFMono-Regular', ui-monospace, monospace; font-size: 0.78rem; color: var(--text-tertiary); }

    .cta-section { background: linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%); border-radius: 20px; padding: clamp(2.5rem, 5vw, 4rem) 2rem; }
    .cta-inner { max-width: 500px; margin: 0 auto; text-align: center; }
    .cta-icon { font-size: 2.5rem; color: rgba(255,255,255,0.7); display: block; margin-bottom: 1rem; }
    .cta-section h2 { font-family: var(--font-display); font-size: clamp(1.6rem, 3vw, 2.2rem); color: #fff; margin: 0 0 0.75rem; font-weight: 800; }
    .cta-section p { color: rgba(255,255,255,0.82); margin: 0 0 1.75rem; font-size: 1rem; }
    .cta-btn { display: inline-flex; background: #fff; color: var(--brand); font-weight: 800; text-decoration: none; padding: 13px 28px; border-radius: 999px; font-size: 0.95rem; transition: background 140ms ease; &:hover { background: var(--bg-primary); } }

    @media (max-width: 880px) { .devs-hero { grid-template-columns: 1fr; } .hero-code { display: none; } }
    @media (max-width: 600px) { .endpoint-row { grid-template-columns: 60px 1fr; } .ep-desc { display: none; } }
  `]
})
export class DevelopersComponent {
  features = [
    { icon: 'api', titleKey: 'developers.features.rest.title', bodyKey: 'developers.features.rest.body' },
    { icon: 'search', titleKey: 'developers.features.search.title', bodyKey: 'developers.features.search.body' },
    { icon: 'webhook', titleKey: 'developers.features.webhooks.title', bodyKey: 'developers.features.webhooks.body' },
    { icon: 'smart_toy', titleKey: 'developers.features.ai.title', bodyKey: 'developers.features.ai.body' },
    { icon: 'speed', titleKey: 'developers.features.speed.title', bodyKey: 'developers.features.speed.body' },
    { icon: 'gpp_good', titleKey: 'developers.features.security.title', bodyKey: 'developers.features.security.body' },
  ];

  endpoints = [
    { method: 'GET', path: '/api/hotels', descKey: 'developers.ep.hotels' },
    { method: 'GET', path: '/api/flights', descKey: 'developers.ep.flights' },
    { method: 'GET', path: '/api/destinations', descKey: 'developers.ep.destinations' },
    { method: 'POST', path: '/api/bookings', descKey: 'developers.ep.createBooking' },
    { method: 'GET', path: '/api/bookings/{id}', descKey: 'developers.ep.getBooking' },
    { method: 'PATCH', path: '/api/bookings/{id}', descKey: 'developers.ep.updateBooking' },
  ];

  sdks = [
    { lang: 'JavaScript / TypeScript', emoji: '🟨', color: '#f7df1e22', install: 'npm install @travelai/sdk' },
    { lang: 'Python', emoji: '🐍', color: '#3776ab22', install: 'pip install travelai' },
    { lang: 'Java', emoji: '☕', color: '#ed8b0022', install: 'implementation "com.travelai:sdk"' },
    { lang: 'Go', emoji: '🐹', color: '#00add822', install: 'go get travelai.com/sdk' },
  ];
}
