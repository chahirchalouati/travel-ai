# Implementation Plan: Reactive Living Itinerary — Completion & Hardening

> **Premise correction (verified against the codebase):** This feature is **not spec-only**.
> It is ~95% shipped end-to-end. The stale `competitive-roadmap` memory ("flagship, spec only")
> is wrong. This plan is therefore a **verification + hardening + close-out** plan, not a
> greenfield build.
>
> **Multi-model note:** `~/.claude/bin/codeagent-wrapper` is **not installed**, so the literal
> Codex/Gemini collaboration in `/ccg:plan` could not run. This plan was synthesised by Claude
> from a direct read of the implementation. No `CODEX_SESSION` / `GEMINI_SESSION` exist.

---

## Current State (verified)

**Backend — `com.travelai.itinerary` (~1,070 LOC, complete):**
- Migration `V27__reactive_living_itinerary.sql` (note: shipped as V27, spec said V25)
- Entities: `LiveItinerary`, `ItinerarySegment`, `ItineraryEvent`, `ItineraryProposal`, `ProposedChange` + enums (`SegmentType`, `SegmentStatus`, `EventSource`, `ItineraryProposalStatus`, `ProposedChangeType`)
- 5 repositories
- `LiveItineraryService` — `initForBooking` (via `BookingConfirmedEvent` listener), `recordManualEvent`, `recordWebhookEvent`, `approve`/`reject` gate, `expireStaleProposals`, `touchWatchedItineraries`
- `ReactivePlanningListener` — `@ApplicationModuleListener @Async`, reuses `FlightAgent`/`HotelAgent`/`RestaurantAgent` + `ChatClient` summary, persists `PENDING_APPROVAL` proposal
- `ReactivePlanningScheduler`, `ItineraryWebhookController`, `ItineraryStreamService` (SSE), `ItineraryStreamListener`, `LiveItineraryController` (REST + `/stream`)
- Events: `ItineraryEventDetectedEvent`, `ItineraryProposalReadyEvent`, `ItineraryApprovedEvent`
- DTOs: `LiveItineraryResponse`, `ItineraryProposalResponse`, `ProposedChangeResponse`, `SegmentResponse`, `ReportEventRequest`
- `JwtAuthFilter` **already** accepts `access_token` query param for `/itinerary/stream` (SSE auth works)

**Frontend (complete):**
- `core/services/itinerary.service.ts` — REST + `openStream()` SSE
- `features/itinerary-live/` component (TS/HTML/SCSS) — segment timeline, report-issue, proposal approve/reject, SSE + 20s poll fallback
- Route `trips/:id/live` wired in `app.routes.ts`
- Entry point: "Live" badge button in `bookings.component.ts`
- i18n: 20 `itinerary.*` keys present in **all four** langs (en/es/fr/it) ✅

**Tests:** `LiveItineraryServiceTest` (5 tests: init, idempotency, manual event, approve, reject).

### Task Type
- [x] Fullstack — but **close-out only** (no new feature surface)

---

## Gaps Worth Closing (prioritised)

| # | Severity | Gap | Why it matters |
|---|----------|-----|----------------|
| G1 | HIGH (security) | `ItineraryWebhookController` is `@RequestMapping("/webhooks/itinerary")`, unauthenticated (`permitAll`), and triggers AI re-plans. SecurityConfig permits `/api/webhooks/**`. | Unauthenticated endpoint that spends AI tokens + writes proposals = abuse/DoS. Confirm the path is actually permit-listed under the `/api` context-path, and add a shared-secret/signature header check + rate limit. |
| G2 | HIGH (test) | No test for `ReactivePlanningListener` (the core AI re-plan branch logic), the controller web layer, or any frontend spec. | Flagship differentiator's most complex logic is untested; violates 80% coverage target. |
| G3 | MEDIUM | SSE JWT travels as `access_token` query param → lands in server access logs / proxy logs. | Token leakage via logs. Mitigate: short-lived token, scrub query string from access logs, or document the accepted risk. |
| G4 | MEDIUM | No live end-to-end verification that the full loop runs against the running stack (booking→segment→manual event→AI proposal→approve→segment rebooked→SSE push). | "Looks built" ≠ "works". Needs a smoke run. |
| G5 | LOW | "Live" indicator exists only on `bookings.component`; spec also wanted it on `trips.component` cards. | Discoverability of the flagship feature. |
| G6 | LOW (docs) | Stale `competitive-roadmap` memory + `docs/Analisi_Funzionale_Stato_Implementazione.md` likely still mark this "spec/pending". | Misleads future planning (it just misled this command). |

---

## Implementation Steps

1. **Verify the loop end-to-end (G4)** — start backend + Docker per CLAUDE.md, register a user, confirm a booking, hit `POST /api/itinerary/{id}/events`, confirm a `PENDING_APPROVAL` proposal + SSE `proposal` event, approve, confirm segment flips to `REBOOKED`. *Deliverable: a verified run log; any defects found feed back into steps below.*

2. **Harden the webhook (G1)** —
   - Confirm `/webhooks/itinerary/**` is genuinely reachable + permit-listed under the context-path (or fix the matcher).
   - Add a `X-Webhook-Secret` header check against a config value (`itinerary.webhook.secret`, env-injected), reject with 401 if absent/mismatched.
   - Apply `AiRateLimiter` (or a per-segment cooldown) before publishing the detected event, mirroring `recordManualEvent`. *Deliverable: authenticated, rate-limited webhook.*

3. **Backend tests (G2)** —
   - `ReactivePlanningListenerTest` (Mockito): flight/hotel/restaurant branch each yields the right `ProposedChangeType`; empty agent result → no proposal; `ChatClient` failure → fallback summary; cost-delta math.
   - `LiveItineraryControllerTest` (MockMvc + Spring Security): ownership enforcement (403 on foreign booking), approve/reject happy + invalid-status paths, report-event validation.
   - *Deliverable: ≥80% coverage on the `itinerary` package via JaCoCo.*

4. **Frontend test + trips indicator (G2, G5)** —
   - `itinerary-live.component.spec.ts`: renders segments, opens report form, calls approve/reject, reflects pending-proposal alert state.
   - Add the "Live / pending re-plan" badge to `trips.component.ts` cards, navigating to `trips/:id/live` (reuse the `bookings` pattern + existing i18n `itinerary.liveBadge`). *Deliverable: parity discoverability + a component spec.*

5. **SSE token-leak mitigation (G3)** — scrub `access_token` from access-log output (or switch to a short-lived stream ticket). Minimal: document the accepted trade-off in the controller javadoc + ops notes. *Deliverable: decision recorded + log scrub if cheap.*

6. **Docs + memory close-out (G6)** — update `docs/Analisi_Funzionale_Stato_Implementazione.md` to mark the living itinerary **shipped (V1 + automation layers)**, and correct the `competitive-roadmap` memory. *Deliverable: docs reflect reality.*

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `itinerary/ItineraryWebhookController.java` | Modify | Add shared-secret header check + rate limit (G1) |
| `shared/config/SecurityConfig.java:51` | Verify/Modify | Confirm webhook matcher vs context-path (G1) |
| `auth/JwtAuthFilter.java:40-44` | Verify | SSE query-param path already correct — no change expected (G3) |
| `itinerary/LiveItineraryController.java` | Modify (test only) | Add `LiveItineraryControllerTest` (G2) |
| `src/test/java/com/travelai/itinerary/ReactivePlanningListenerTest.java` | Create | Mockito branch tests (G2) |
| `web-app/src/app/features/trips/trips.component.ts` | Modify | Add live badge → `trips/:id/live` (G5) |
| `web-app/src/app/features/itinerary-live/itinerary-live.component.spec.ts` | Create | Component spec (G2) |
| `docs/Analisi_Funzionale_Stato_Implementazione.md` | Modify | Mark feature shipped (G6) |
| `~/.claude/.../memory/competitive-roadmap.md` | Modify | Correct "spec only" → shipped (G6) |

---

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Webhook secret change breaks existing integrators | None exist yet (no airline/venue wired) — safe to add now before launch |
| Adding context-path fix to SecurityConfig opens/closes wrong paths | Cover with a MockMvc test asserting 401 unauth vs 200 with secret |
| Live smoke run needs Ollama models (~5GB) | Manual-event path + `ChatClient` fallback works even if summary AI is degraded; verify core loop without requiring perfect AI output |
| Scope creep into rebuilding spec's separate `proposal-drawer`/`alert-banner` components | Out of scope — current single-component impl is functional and <200 LOC; do not refactor without cause |

---

## SESSION_ID (for /ccg:execute use)
- CODEX_SESSION: _unavailable — codeagent-wrapper not installed_
- GEMINI_SESSION: _unavailable — codeagent-wrapper not installed_

> `/ccg:execute` will run Claude-only (no external model prototype/audit) unless the wrapper is installed.
