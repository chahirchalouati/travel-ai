---
name: travelai-rag-concierge
description: How the Travel AI AI concierge/chat RAG pipeline works — Ollama models (qwen2.5:7b + nomic-embed-text), pgvector store, the ~0.45 similarity threshold, idempotent ingestion, and the admin re-ingest endpoint. Use when touching ChatService, ConciergeService, RagIngestionService, embeddings, the vector_store, or debugging hallucinated/ungrounded concierge answers.
---

# Travel AI — RAG Concierge

The concierge (AI chat) is the product's differentiation bet. It's a retrieval-augmented pipeline over the catalog/content, served by a local Ollama.

> Point-in-time notes (verified 2026-06-29). Verify against current code before asserting — models, thresholds, and file names may have moved.

## Stack

- **Ollama** at `:11434` (docker service `travelai-ollama`).
  - Chat model: **`qwen2.5:7b`** (replaced `llama3.2:3b`, which was too weak / hallucinated).
  - Embeddings: **`nomic-embed-text`** (768-dim).
- **pgvector** store: table `vector_store`. In dev this often points at a **remote Supabase** Postgres, not the local docker DB — DB creds come from the IntelliJ run-config env, not tracked files. Confirm which DB you're on before debugging data.
- Backend usually run from IntelliJ (logs in its console, no log files). Read a running process's env with `ps eww -p <pid on :8080>`.

## Critical tuning facts

- **Similarity threshold ≈ 0.45.** nomic scores relevant matches at ~0.45–0.70 cosine. The original `0.7` filtered out *everything* (a correct Paris match scored 0.68). Set `similarityThreshold` ~0.45 in **`ChatService`** and **`ConciergeService`**.
- **Idempotent ingestion (bug was fixed).** `RagIngestionService.ingestOnStartup` used to re-run every boot and append with no clearing → each doc duplicated ~7× (topK=5 then returned 5 copies of ONE doc → ungrounded, hallucinated answers, 0 attachments). Now: startup ingestion **skips if the store is non-empty**, and `ingestAll()` **clears first**. A clean store is ≈ 367 docs.
- **Force a clean rebuild:** `POST /admin/rag/ingest` (ADMIN role). See the `/reingest` command.
- **Reviews** are ~52% of docs and `RagEntityResolver` does **not** resolve `type=review` to an attachment (only destination/hotel/restaurant). Open improvement: resolve reviews to their target via metadata `targetType`/`targetId`, or down-weight them.
- Prompt uses real roles (`SystemMessage`/`UserMessage`/`AssistantMessage`) — an earlier bug flattened everything into one string and duplicated the user message.

## Debugging checklist for bad concierge answers

1. Is the store populated and de-duplicated? (`SELECT count(*), count(distinct ...) FROM vector_store;` — expect ~367 distinct, no ~7× inflation.) If inflated, re-ingest via `/reingest`.
2. Is `similarityThreshold` ~0.45 (not 0.7) in ChatService/ConciergeService?
3. Are the Ollama models pulled? (`qwen2.5:7b`, `nomic-embed-text` — see CLAUDE.md Step 2.)
4. Which DB is the app actually using (Supabase vs local docker)?
5. Are results dominated by unresolved `review` docs?
