# Project Workflow — Travel AI

Full-stack travel platform: **Spring Modulith backend** (40 modules, `travel-ai-backend/`) + **Angular 19 frontend** (56 features, `web-app/`), backed by Docker services (postgres+pgvector, redis, mailpit, ollama, minio). See `CLAUDE.md` for the end-to-end local setup.

## Cross-cutting checklist for any feature

A full-stack feature usually touches all of these — don't stop at the backend:

1. **Backend module** — new/extended `@ApplicationModule` under `com.travelai.*` (see [backend-conventions.md](backend-conventions.md)).
2. **Flyway migration** — `V<max+1>__*.sql` if the schema changes. Current max is V63; next is V64. Always `ls` to confirm.
3. **Security allowlist** — new public endpoints added to `shared/config/SecurityConfig.java`. Admin endpoints don't need this (they use `@PreAuthorize`).
4. **Frontend feature** — component under `web-app/src/app/features/` reusing `shared/ui` primitives (see [frontend-conventions.md](frontend-conventions.md)).
5. **i18n** — new keys in **all four** `assets/i18n/{en,es,fr,it}.json`. Use existing namespaces.
6. **Tests** — module/unit tests backend (~209 tests); verify FE with `npm run build` + browser preview.

## Running & verifying

- Infra: `cd travel-ai-backend && docker compose up -d` (needs Docker Desktop running). Services: postgres :5432, redis :6379, mailpit :8025, ollama :11434, minio :9000/9001.
- Backend: `./mvnw spring-boot:run` (dev profile default). Health: `/actuator/health`. Swagger: `/swagger-ui.html`.
- Frontend: `cd web-app && npm start` → http://localhost:4200.
- AI models: `docker exec -it travelai-ollama ollama pull qwen2.5:7b` + `nomic-embed-text` (one-time).

## Conventions & memory

- Immutability, small files (<800 lines), explicit error handling — per the global rules.
- Commit style: `feat:`/`fix:`/`refactor:` etc. No `Co-Authored-By` trailers. Only commit/push when asked.
- No hardcoded reference data (coords, city lists, rates) — use DB or open APIs.
- `/planner` is the only trip planner (no `/trip-planner`). Everything backend-driven.
- Admin is Swiss LIGHT (not dark). Token layer `--ad-*`.
- Deployment targets exist: `fly.toml`, `render.yaml`, backend `Dockerfile`.
- Long-lived project context lives in Claude memory (`memory/MEMORY.md`):
  - `01-overview` — tech stack, infra, design direction, deploy targets, business config
  - `02-backend-modules` — all 40 Spring Modulith modules (classes, purpose, relationships)
  - `03-frontend-features` — all 56 feature folders (routes, sub-components, admin shell)
  - `04-frontend-core-shared` — 42 core services, 29 shared/ui primitives, design tokens
  - `05-feedback` — behavioral rules (no attribution, no hardcoded data, planner canonical, admin light, ui kit boundaries)
  Consult it before re-deriving architecture.
