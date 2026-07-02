# Frontend Conventions — Travel AI (Angular 19)

Stack: **Angular 19 standalone components**, TypeScript 5.6, SCSS. Run dir: `web-app/`. Dev server proxies `/api` → `http://localhost:8080` via `proxy.conf.json`. Default UI language: **French**.

## Layout

```
web-app/src/app/
├── features/<feature>/          # one folder per screen/surface
│   └── <feature>.component.ts   # standalone component (+ .html/.scss when split out)
├── shared/
│   ├── ui/                      # reusable primitives: app-ui-select, ui-checkbox,
│   │                           #   ui-range, ui-autocomplete, ui-datepicker, ui-stepper…
│   │                           #   (barrel exported from shared/ui/index.ts)
│   ├── nav/, footer/, auth-modal/, language-switcher/, user-menu/
│   ├── infinite-scroll/         # directive for paginated catalog grids
│   ├── pipes/, reveal/, styles/
└── ...
```

## Rules

- **Standalone components only** — no NgModules. Use `standalone: true`, import deps directly. Signals for local state where it fits the existing style.
- **Reuse `shared/ui` primitives** for form controls and filters instead of hand-rolling inputs. Register new primitives in `shared/ui/index.ts`.
- **Naming**: components PascalCase (`AttractionsComponent`), files kebab-case (`attractions.component.ts`), CSS classes kebab-case.
- **Feature folders** map to a route; catalog grids use the `infinite-scroll` directive + server pagination (`PageSupport`), and must re-arm after each page load.
- **HTTP**: call `/api/...` (proxied). Auth uses a JWT stored in `localStorage.ai_access_token`.
- **No secrets in the bundle.** No hardcoded API keys.
- Animate compositor-friendly props (`transform`, `opacity`) — avoid animating layout props.

## i18n (CRITICAL — 4 languages, always in sync)

- Bundles: `web-app/src/assets/i18n/{en,es,fr,it}.json`.
- **Every new UI string needs a key added to ALL FOUR files** (en, es, fr, it) or the app breaks in the missing locales. `fr` is the default and must never be missing keys.
- Keep the same key path/nesting across all four files. When merging, watch brace depth — a mismatched `}` silently corrupts a whole namespace.
- Use existing top-level namespaces (`catalog`, etc.) rather than inventing parallel ones.

## Build & verify

```bash
cd web-app
npm start                 # ng serve on :4200 (see .claude/launch.json)
npm run build             # production build
```
Prefer the preview tooling (`.claude/launch.json` config `web`, port 4200) to verify changes in-browser rather than asking the user to check manually.
