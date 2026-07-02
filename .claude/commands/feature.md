---
description: Plan and implement a full-stack Travel AI feature end-to-end (backend module + migration + security + Angular feature + i18n + tests)
argument-hint: <feature description>
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task
---

Implement a full-stack feature for Travel AI: **$ARGUMENTS**

Read `.claude/rules/project-workflow.md`, `.claude/rules/backend-conventions.md`, and `.claude/rules/frontend-conventions.md` first. Consult Claude memory (`memory/MEMORY.md`) for related existing architecture before building anything new.

Work the cross-cutting checklist — do not stop at the backend:

1. **Plan briefly**: which module(s), endpoints, schema changes, and screens are involved. Surface risks.
2. **Backend** — create/extend the `@ApplicationModule` under `com.travelai.*` (entity → repo → service → thin controller at `/api/<module>`). Cross-module via events. You may delegate this to the `travelai-module-builder` agent.
3. **Migration** — if the schema changes, add `V<max+1>__*.sql` (check the real current max first).
4. **Security** — allow-list any new public endpoint in `shared/config/SecurityConfig.java`.
5. **Frontend** — Angular standalone feature under `features/`, reusing `shared/ui`. You may delegate to the `travelai-feature-builder` agent.
6. **i18n** — add every new string to all four `assets/i18n/{en,es,fr,it}.json`.
7. **Verify** — `./mvnw -o compile && ./mvnw test` for backend; `npm run build` + browser preview for frontend.

Finish with a summary: modules touched, migration number, endpoints + their SecurityConfig entries, i18n keys added, and verification results. Only commit if the user explicitly asks.
