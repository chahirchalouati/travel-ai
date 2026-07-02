---
description: Bring up the full Travel AI dev stack — Docker infra, backend, frontend — and report health
allowed-tools: Bash, Read
---

Start the Travel AI local stack in the right order (see CLAUDE.md for the full guide). Requires Docker Desktop running.

Do this step by step, checking each before moving on:

1. **Infra** (postgres+pgvector, redis, mailpit, ollama, minio):
   ```bash
   cd travel-ai-backend && docker compose up -d && docker compose ps
   ```
   Verify services are `Up`. If Docker isn't running, tell the user to start Docker Desktop and stop.

2. **Backend** (Spring Boot, dev profile default) — start in the background and wait for health:
   ```bash
   cd travel-ai-backend && ./mvnw spring-boot:run
   ```
   Poll `curl -s http://localhost:8080/actuator/health` until `{"status":"UP"}`. First run downloads deps (slow).

3. **Frontend** (Angular on :4200) — prefer the preview tooling (`.claude/launch.json` config `web`) so it can be verified in-browser; otherwise `cd web-app && npm start`.

4. Report the URLs: app http://localhost:4200 · health http://localhost:8080/actuator/health · Swagger http://localhost:8080/swagger-ui.html · Mailpit http://localhost:8025 · MinIO http://localhost:9001.

Notes: the AI concierge additionally needs the Ollama models pulled (`qwen2.5:7b`, `nomic-embed-text`). Don't `docker compose down -v` (that wipes data) unless the user asks for a fresh start.
