---
name: travelai-conventions
description: Canonical conventions for the Travel AI codebase — Spring Modulith backend (com.travelai.* modules, Flyway numbering, SecurityConfig allowlist, server-authoritative pricing) and Angular 19 standalone frontend (features/, shared/ui, 4-language i18n). Use when adding or modifying backend modules, REST endpoints, migrations, Angular features, or i18n strings in this repo.
---

# Travel AI — Conventions Reference

Full-stack platform: **Spring Modulith backend** (`travel-ai-backend/`, Spring Boot 3.5 / Java 21) + **Angular 19 standalone frontend** (`web-app/`). Infra via Docker: postgres+pgvector, redis, mailpit, ollama, minio. See `CLAUDE.md` for local setup. Deep architecture notes live in Claude memory (`memory/MEMORY.md`).

## Backend — Spring Modulith

- **One capability = one `@ApplicationModule` package** under `com.travelai.<module>` with `package-info.java`:
  ```java
  @org.springframework.modulith.ApplicationModule
  package com.travelai.<module>;
  ```
  Existing modules: auth, booking, payment, catalog, admin, user, destination, loyalty, ancillary, subscription, partner, forum, stories, ai, review, tripcollab, revenue, itinerary, attraction, pricewatch, messaging, promo, invoice, media, notification, stats, audit, travel, shared.
- **Files are flat** inside the package: `<Entity>.java`, `<Entity>Repository.java`, `<Module>Service.java`, `<Module>Controller.java`, `<X>Listener.java`, enums, plus a `dto/` subpackage of `record`s. No `service/`/`controller/` folders.
- **Layering**: Entity → Repository → Service (business logic) → Controller (thin, base path `/api/<module>`).
- **Cross-module** comms via domain events + `@ApplicationModuleListener` — do NOT import another module's internals.
- **Enums persisted as VARCHAR** (migration V7 converted them). Keep new enum columns as VARCHAR.
- **Pricing/money is server-authoritative** (revenue/commission model, V53) — never trust client-supplied amounts.
- `com.travelai.shared` (`config`/`domain`/`exception`) holds cross-cutting code, not business logic.

### Flyway migrations
- Dir: `travel-ai-backend/src/main/resources/db/migration/`, named `V<n>__<snake>.sql`.
- **Next number = numeric max + 1** (V54 > V9 — compare numerically). `ls` first. Migrations are immutable once applied; fix forward.
- `V6__spring_modulith_event_publication.sql` is the event registry — leave it alone.

### Security
- New public endpoint → add to `com/travelai/shared/config/SecurityConfig.java`:
  `.requestMatchers("/api/<path>/**").permitAll()` (public) or `.authenticated()` (gated). Missing entry → 401.
- JWT: register via `POST /api/auth/register`; token used as `localStorage.ai_access_token` on the frontend.

### Build / run / verify
```bash
cd travel-ai-backend
./mvnw -o compile        # fast; devtools hot-restart
./mvnw test              # JUnit 5 + Mockito, @ApplicationModuleTest
./mvnw spring-boot:run   # dev profile default
```
Health `/actuator/health` · Swagger `/swagger-ui.html`.

## Frontend — Angular 19

- **Standalone components only** (no NgModules). Screens under `web-app/src/app/features/<feature>/`; components PascalCase, files kebab-case.
- **Reuse `shared/ui`** primitives (`app-ui-select`, `ui-checkbox`, `ui-range`, `ui-autocomplete`, `ui-datepicker`, `ui-stepper`) and the `infinite-scroll` directive. Register new primitives in `shared/ui/index.ts`.
- **Catalog grids**: server pagination (`PageSupport`) + `infinite-scroll`, re-armed after each page (known gotcha).
- **HTTP** to `/api/...` (proxied to :8080 via `proxy.conf.json`). No secrets in the bundle.
- Animate `transform`/`opacity` only; avoid layout-property animation.

### i18n (4 languages, always synced)
- Bundles: `web-app/src/assets/i18n/{en,es,fr,it}.json`. **Default UI language is French.**
- **Every new string → a key in ALL FOUR files**, identical key path/nesting. `fr` must never miss keys.
- Watch brace depth when hand-editing/merging JSON — a stray `}` silently corrupts a namespace.

### Build / verify
```bash
cd web-app
npm start          # ng serve :4200 (.claude/launch.json config "web")
npm run build      # prod build = type check
```
Verify UI changes in the browser preview (not by asking the user).

## Full-stack feature checklist
1. Backend module (`@ApplicationModule`) 2. Flyway `V<max+1>` if schema changes 3. SecurityConfig allowlist for new public endpoints 4. Angular feature reusing `shared/ui` 5. i18n keys in all four locales 6. Backend module/unit tests + frontend browser verification.
