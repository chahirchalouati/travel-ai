# Project Workflow — Travel AI

Full-stack travel platform: **Spring Modulith backend** (`travel-ai-backend/`) + **Angular 19 frontend** (`web-app/`), backed by Docker services (postgres+pgvector, redis, mailpit, ollama, minio). See `CLAUDE.md` for the end-to-end local setup.

## Cross-cutting checklist for any feature

A full-stack feature usually touches all of these — don't stop at the backend:

1. **Backend module** — new/extended `@ApplicationModule` under `com.travelai.*` (see [backend-conventions.md](backend-conventions.md)).
2. **Flyway migration** — `V<max+1>__*.sql` if the schema changes. Check the current max first.
3. **Security allowlist** — new public endpoints added to `shared/config/SecurityConfig.java`.
4. **Frontend feature** — component under `web-app/src/app/features/` reusing `shared/ui` (see [frontend-conventions.md](frontend-conventions.md)).
5. **i18n** — new keys in **all four** `assets/i18n/{en,es,fr,it}.json`.
6. **Tests** — module/unit tests backend; verify FE in the browser preview.

## Running & verifying

- Infra: `cd travel-ai-backend && docker compose up -d` (needs Docker Desktop running).
- Backend: `./mvnw spring-boot:run` (dev profile default). Health: `/actuator/health`.
- Frontend: `cd web-app && npm start` → http://localhost:4200.
- The app reads/writes the Supabase DB in dev for some flows (price-watch, ingestion) — not always the local docker DB. Confirm which before debugging data.

## Conventions & memory

- Immutability, small files (<800 lines), explicit error handling — per the global rules.
- Commit style: `feat:`/`fix:`/`refactor:` etc. Only commit/push when asked. Branch off `master` first if needed.
- Deployment targets exist: `fly.toml`, `render.yaml`, backend `Dockerfile`.
- Long-lived project context lives in Claude memory (`memory/MEMORY.md`): catalog pagination, admin CRUD, booking funnel, revenue model, RAG/concierge config, etc. Consult it before re-deriving architecture.
