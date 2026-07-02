---
description: Build & test both the Spring Boot backend and the Angular frontend, report pass/fail
argument-hint: [backend | frontend | all (default)]
allowed-tools: Bash, Read
---

Run the Travel AI verification loop and report results honestly (show real output on failure).

Scope: **$ARGUMENTS** (default: all)

Backend (`travel-ai-backend/`):
1. `./mvnw -o compile` — must succeed (also triggers devtools hot-restart).
2. `./mvnw test` — run unit/module tests; report failures with the failing test names.

Frontend (`web-app/`):
3. `npm run build` — production build must succeed (type errors fail here).
4. If tests are configured, run them; otherwise note that and verify key screens via the browser preview (`.claude/launch.json` config `web`, port 4200) — check console/network for errors.

Report a concise PASS/FAIL summary per side. On failure: paste the relevant error, state the likely cause, and stop — do not mark work complete. Do not commit anything.
