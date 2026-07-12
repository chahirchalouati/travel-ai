# Frontend Conventions — Travel AI (Angular 19)

Stack: **Angular 19 standalone components**, TypeScript 5.6, SCSS, Signals + RxJS, Leaflet 1.9 (maps), Transloco (i18n), marked (markdown). Run dir: `web-app/`. Dev server proxies `/api` → `http://localhost:8080` via `proxy.conf.json`. Default UI language: **French**.

## Design direction

**Swiss International Typographic** — paper-white `#F6F5F1`, ink `#111`, International Red `#E5352B`. Flat (no decorative shadows), hairline rules, sharp radii (2-6px). Fonts: **Inter** (display, weight 800, tracking -0.035em) + **IBM Plex Mono** (labels, mono numerals). No blue/violet/navy. Green only for success/verified. All tokens in `styles.scss` as `:root` CSS custom properties.

## Layout

```
web-app/src/app/
├── features/                    # 56 feature folders, one per screen/route
│   ├── <feature>/               # standalone component (+ .html/.scss when split out)
│   └── admin/                   # shell + child-routes architecture
│       ├── admin-shell           # rail nav + topbar + Cmd+K + <router-outlet>
│       ├── admin.routes.ts       # lazy child routes
│       ├── admin.tokens.scss     # --ad-* CSS vars (global style in angular.json)
│       ├── catalog-configs.ts    # schema-driven entity configs (9 catalog types)
│       ├── ui/                   # admin-only primitives (data-table, drawer, charts, etc.)
│       ├── sections/             # 13 admin sections (overview, catalog, users, bookings, etc.)
│       └── state/                # list-query (URL-as-state), format utils
├── shared/
│   ├── ui/                      # 29 reusable primitives (barrel exported from index.ts)
│   ├── nav/, footer/, auth-modal/, language-switcher/, user-menu/
│   ├── impersonation-banner/    # admin impersonation warning bar
│   ├── infinite-scroll/         # directive for paginated catalog grids
│   ├── pipes/                   # markdown pipe
│   ├── reveal/                  # scroll-reveal animation directive
│   └── styles/                  # dashboard SCSS partials
├── core/
│   ├── guards/                  # admin.guard.ts (CanActivateFn, checks ADMIN role)
│   ├── interceptors/            # auth.interceptor.ts (JWT injection + 401 refresh queue)
│   ├── models/                  # api.models.ts (all TS interfaces/DTOs)
│   ├── i18n/                    # transloco-loader, lang-storage (key: ai_lang)
│   └── services/                # 42 HTTP services (one per backend domain)
└── app.component.ts             # root: nav + footer + router-outlet (chromeless for /admin)
```

## shared/ui primitives (use these, don't hand-roll)

**Form controls:** `app-ui-input` (text/number/email/password, variant="search", [uppercase], clearable, reveal toggle, suffix, size sm/md/lg — themed via `--ui-in-*`), `app-ui-textarea` (autoResize, maxlength counter), `app-ui-select` (needs `name` attr inside `<form>`), `app-ui-checkbox` (filter-pill style), `app-ui-datepicker`, `app-ui-range` (filled track slider), `app-ui-toggle`, `app-ui-autocomplete`, `app-ui-segmented`.

**Display:** `app-ui-kicker` (mono eyebrow), `app-ui-badge`, `app-ui-stat`, `app-ui-rating`, `app-ui-avatar` (image or initials), `app-ui-alert`, `app-ui-spinner`, `app-ui-skeleton`, `app-ui-empty`, `app-ui-button`.

**Rich data/form:** `app-ui-fare-grid` (price date strip, cheapest=red), `app-ui-spec-sheet` (comparison datasheet), `app-ui-sentence-brief` (editable sentence form, emits TripBrief).

**Intentionally left native** (don't force primitives onto these):
- Hero search (flagship pill with embedded red submit button)
- Chat/messages/features-section composers (send-on-enter bars)
- Admin command-palette (keyboard-nav search with template ref)
- Admin-confirm mono phrase input
- Profile file inputs (hidden + custom-triggered)
- Checkboxes in admin-data-table cells / booking-flow ancillary cards

## Rules

- **Standalone components only** — no NgModules. Use `standalone: true`, import deps directly. Signals for local state where it fits the existing style.
- **Reuse `shared/ui` primitives** for form controls and filters instead of hand-rolling inputs. Register new primitives in `shared/ui/index.ts`.
- **Naming**: components PascalCase (`AttractionsComponent`), files kebab-case (`attractions.component.ts`), CSS classes kebab-case.
- **Feature folders** map to a route; catalog grids use the `infinite-scroll` directive + server pagination (`PageSupport`), and must re-arm after each page load.
- **/planner is the only trip planner** — no `/trip-planner` (deleted). Everything backend-driven, no mocks. `TripPlannerService` kept for chat.
- **HTTP**: call `/api/...` (proxied). Auth uses a JWT stored in `localStorage.ai_access_token`.
- **No secrets in the bundle.** No hardcoded API keys. No hardcoded geo/reference data.
- Animate compositor-friendly props (`transform`, `opacity`) — avoid animating layout props.
- **Admin** uses Swiss LIGHT theme (same as app, not dark). Own token layer `--ad-*` in `admin.tokens.scss`.

## i18n (CRITICAL — 4 languages, always in sync)

- Bundles: `web-app/src/assets/i18n/{en,es,fr,it}.json` (~70-77KB each, ~52 top-level namespaces).
- **Every new UI string needs a key added to ALL FOUR files** (en, es, fr, it) or the app breaks in the missing locales. `fr` is the default and must never be missing keys.
- Keep the same key path/nesting across all four files. When merging, watch brace depth — a mismatched `}` silently corrupts a whole namespace.
- Use existing top-level namespaces (`catalog`, `admin`, `booking`, etc.) rather than inventing parallel ones.
- Language-reactive selects: use `toSignal(transloco.langChanges$, {initialValue})` + `computed()` to rebuild options on locale change.

## Build & verify

```bash
cd web-app
npm start                 # ng serve on :4200
npm run build             # production build (type check)
```
Prefer the preview tooling (`.claude/launch.json` configs: web :4200, web-preview :4211, web-verify :4400) to verify changes in-browser rather than asking the user to check manually.

**Gotcha**: if `ng serve` Vite watcher goes stale (serves cached modules), kill it, `rm -rf web-app/.angular/cache`, and relaunch. `ng build` (AOT) is the reliable typecheck.
