---
description: Force a clean rebuild of the RAG vector store for the AI concierge (admin endpoint)
allowed-tools: Bash, Read
---

Trigger a clean, idempotent rebuild of the Travel AI RAG vector store. See the `travelai-rag-concierge` skill for background.

Endpoint: `POST /admin/rag/ingest` — requires an **ADMIN** JWT. `ingestAll()` clears the store first, so this is safe to re-run; a clean store is ≈ 367 docs.

Steps:
1. Confirm the backend is up: `curl -s http://localhost:8080/actuator/health` → expect `{"status":"UP"}`.
2. Obtain an admin bearer token. If the user hasn't provided one, ask for it (or the admin credentials to `POST /api/auth/login`). Do not hardcode or guess credentials.
3. Call:
   ```bash
   curl -s -X POST http://localhost:8080/admin/rag/ingest \
     -H "Authorization: Bearer <ADMIN_JWT>"
   ```
4. Report the response. Then sanity-check the store isn't duplicated (should be ~367 distinct docs, not a ~7× inflation) — if you have DB access, `SELECT count(*) FROM vector_store;`.
5. Remind that the concierge needs Ollama models pulled (`qwen2.5:7b`, `nomic-embed-text`) and `similarityThreshold` ~0.45 in ChatService/ConciergeService to actually ground answers.
