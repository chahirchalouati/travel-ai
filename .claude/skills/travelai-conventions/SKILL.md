---
name: travelai-conventions
description: Canonical conventions for the Travel AI codebase — Spring Modulith backend (40 modules under com.travelai.*, Flyway V1-V63, SecurityConfig allowlist, event-driven cross-module, server-authoritative pricing) and Angular 19 standalone frontend (56 features, 29 shared/ui primitives, 4-language i18n, Swiss design system). Use when adding or modifying backend modules, REST endpoints, migrations, Angular features, or i18n strings.
---

# Travel AI — Conventions Reference

Full-stack platform: **Spring Modulith backend** (`travel-ai-backend/`, Spring Boot 3.5 / Java 21) + **Angular 19 standalone frontend** (`web-app/`). Infra via Docker: postgres+pgvector, redis, mailpit, ollama, minio. See `CLAUDE.md` for local setup. Full project structure tree (40 backend modules, 56 frontend features, 29 UI primitives, behavioral rules) lives in Claude memory (`memory/MEMORY.md`).

## Backend — Spring Modulith

- **One capability = one `@ApplicationModule` package** under `com.travelai.<module>` with `package-info.java`:
  ```java
  @org.springframework.modulith.ApplicationModule
  package com.travelai.<module>;
  ```
  **40 modules:** admin, ai (chat/concierge/planning/rag), ancillary, attraction, audit, auth, blog, booking, careers, catalog (flight/hotel/cruise/restaurant/suggest), contact, destination, event, featureflag, forum, help, invoice, itinerary, loyalty, media, messaging, notification, partner, payment, press, pricewatch, promo, revenue, review, shared, sitecontent, stats, stories, subscription, travel (budget), tripcollab, user.
- **Files are flat** inside the package: `<Entity>.java`, `<Entity>Repository.java`, `<Module>Service.java`, `<Module>Controller.java`, `<X>Listener.java`, enums, plus a `dto/` subpackage of `record`s. No `service/`/`controller/` folders.
- **Layering**: Entity → Repository → Service (business logic) → Controller (thin, base path `/api/<module>`).
- **Cross-module** comms via domain events in `com.travelai.event` + `@ApplicationModuleListener` — do NOT import another module's internals. Key flows: PaymentCompletedEvent → BookingPaymentListener + LoyaltyPaymentListener + InvoiceEmailListener.
- **Admin endpoints** use `/admin/*` (global `/api` prefix), class-level `@PreAuthorize("hasRole('ADMIN')")`. They do NOT need SecurityConfig entries. Roles: TRAVELER, PARTNER, OPERATIONS, ADMIN.
- **Enums persisted as VARCHAR** (migration V7 converted them). Keep new enum columns as VARCHAR.
- **Pricing/money is server-authoritative** (hotel commission 10%, other 3%, V53) — never trust client-supplied amounts.
- `com.travelai.shared` (`config`/`domain`/`exception`) holds cross-cutting code: SecurityConfig, JwtService, WebConfig, BaseEntity, ApiResponse, PageSupport, EntitySpecifications, GlobalExceptionHandler.

### Flyway migrations
- Dir: `travel-ai-backend/src/main/resources/db/migration/`, named `V<n>__<snake>.sql`.
- **63 migrations exist (V1–V63). Next = V64.** Always `ls` first. Migrations are immutable once applied; fix forward.
- `V6__spring_modulith_event_publication.sql` is the event registry — leave it alone.

### Security
- New public endpoint → add to `com/travelai/shared/config/SecurityConfig.java`:
  `.requestMatchers("/api/<path>/**").permitAll()` (public) or `.authenticated()` (gated). Missing entry → 401.
- JWT: 24h access, 7d refresh. Token stored as `localStorage.ai_access_token` on the frontend.
- Auth supports: email/password, TOTP 2FA (RFC 6238), Google OAuth.

### AI subsystem
- Spring AI 1.0 + Ollama at :11434 (docker service `travelai-ollama`)
- Chat: `qwen2.5:7b` (temperature 0.4). Embeddings: `nomic-embed-text` (768-dim, pgvector HNSW cosine)
- RAG similarity threshold: ~0.45. Clean store ~367 docs. Rebuild: `POST /admin/rag/ingest`
- Multi-agent planning: OrchestratorAgent → FlightAgent, HotelAgent, RestaurantAgent, RankingAgent
- Rate limit: 60 req/min, max 3 proposals, 10s agent timeout
- Concierge activates 3 days before departure

### Build / run / verify
```bash
cd travel-ai-backend
./mvnw -o compile        # fast; devtools hot-restart
./mvnw test              # JUnit 5 + Mockito, ~209 tests
./mvnw spring-boot:run   # dev profile default
```
Health `/actuator/health` · Swagger `/swagger-ui.html`.

## Frontend — Angular 19

- **Standalone components only** (no NgModules). Screens under `web-app/src/app/features/<feature>/`; components PascalCase, files kebab-case.
- **Design: Swiss International Typographic** — paper-white `#F6F5F1`, ink `#111`, red `#E5352B`, Inter + IBM Plex Mono. All tokens in `styles.scss`. Admin uses same light theme with `--ad-*` overrides.
- **56 feature folders**, ~85 routes. `/planner` is the only trip planner (no `/trip-planner`). Admin is shell + lazy child-routes (13 sections).
- **Reuse `shared/ui`** primitives (29 components): `app-ui-input` (text/number/password/search), `app-ui-textarea`, `app-ui-select`, `app-ui-checkbox`, `app-ui-datepicker`, `app-ui-range`, `app-ui-toggle`, `app-ui-autocomplete`, `app-ui-segmented`, `app-ui-button`, `app-ui-kicker`, `app-ui-badge`, `app-ui-stat`, `app-ui-rating`, `app-ui-avatar`, `app-ui-alert`, `app-ui-spinner`, `app-ui-skeleton`, `app-ui-empty`, `app-ui-fare-grid`, `app-ui-spec-sheet`, `app-ui-sentence-brief`. Register new ones in `shared/ui/index.ts`.
- **42 core services** (one per domain) in `core/services/`. Admin guard, auth interceptor in `core/`.
- **Catalog grids**: server pagination (`PageSupport`) + `infinite-scroll` directive, re-armed after each page.
- **HTTP** to `/api/...` (proxied to :8080). No secrets in the bundle. No hardcoded geo/reference data.
- Animate `transform`/`opacity` only; avoid layout-property animation.

### i18n (4 languages, always synced)
- Bundles: `web-app/src/assets/i18n/{en,es,fr,it}.json` (~52 namespaces). **Default UI language is French.**
- **Every new string → a key in ALL FOUR files**, identical key path/nesting. `fr` must never miss keys.
- Watch brace depth when hand-editing JSON — a stray `}` silently corrupts a namespace.
- Use `toSignal(transloco.langChanges$)` + `computed()` for language-reactive select options.

### Build / verify
```bash
cd web-app
npm start          # ng serve :4200
npm run build      # prod build = type check
```
Verify UI changes in the browser preview (not by asking the user). Gotcha: stale Vite cache → kill, `rm -rf .angular/cache`, relaunch.

## Full-stack feature checklist
1. Backend module (`@ApplicationModule`) 2. Flyway `V<max+1>` if schema changes (next: V64) 3. SecurityConfig allowlist for new public endpoints (admin uses `@PreAuthorize` instead) 4. Angular feature reusing `shared/ui` 5. i18n keys in all four locales 6. Backend tests + frontend build + browser verification.
