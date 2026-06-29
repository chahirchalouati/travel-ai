# Architecture: Reactive Living Itinerary

## Context and Boundaries

This spec is grounded in the patterns observed in the existing codebase. Key conventions to maintain:

- **Events**: Spring Modulith `@ApplicationModuleListener` + `ApplicationEventPublisher` for all cross-module communication (see `PlanningOrchestrator`, `NotificationService`, `TravelRequestService`)
- **Entities**: extend `BaseEntity` (UUID PK, `createdAt`/`updatedAt` via `AuditingEntityListener`), JPA with Lombok `@Getter @Setter`
- **Controllers**: return `ApiResponse<T>`, use `@AuthenticationPrincipal UserDetails` for the current user, `@RequestMapping` at class level
- **Services**: constructor injection via `@RequiredArgsConstructor`, `@Transactional`, throw `TravelAiException` with `ErrorCode`
- **AI calls**: `ChatClient.prompt(prompt).call().content()` wrapped in try/catch with a fallback string
- **Scheduling**: `@Scheduled(cron = ...)` in a dedicated `*Scheduler` `@Component`
- **Migrations**: Flyway, `V{N}__{snake_case_description}.sql`, next is V25
- **Frontend**: standalone Angular components, signals + computed, `inject()`, services in `core/services/`, models in `core/models/api.models.ts`, lazy-loaded routes in `app.routes.ts`
- **Frontend HTTP**: services return `Observable<T>` using `.pipe(map(res => res.data))`

---

## Design Decisions

- **No new AI model**: The re-planning loop reuses `OrchestratorAgent.orchestrate(AgentContext)` directly — the same code path that handles initial planning. The "reactive" layer is a thin coordinator that builds the context and writes the result as a `ReplannedSegment`.
- **Proposal diff model, not mutating bookings**: Approved re-plans are stored as `ReplannedSegment` rows that overlay the original `Booking`. The booking row is only mutated when the user explicitly confirms. This keeps the audit trail clean.
- **Event-driven triggers, not a polling monolith**: Three trigger paths — scheduled poll (cron), user-reported manual event, and external webhook — all converge to publish a single `ItineraryEventDetectedEvent`. One listener handles re-planning regardless of origin.
- **User-approval gate via `ItineraryProposal` status**: Re-plans are persisted in `PENDING_APPROVAL` status. The user accepts/rejects via a controller endpoint. Consequential actions (re-messaging a partner, adjusting reservation) only execute after transition to `APPROVED`.
- **SSE for real-time push**: The frontend polls or subscribes to a Server-Sent Events endpoint for live itinerary alerts. This fits the existing Spring Boot stack without adding WebSocket infrastructure.
- **New top-level domain `itinerary`**: Lives alongside `travel`, `booking`, `ai` — not nested inside them — consistent with how the existing domain packages are laid out.
- **`READY` proposal status reused**: The existing `ProposalStatus` enum already has a `READY` value. The new domain introduces its own simpler status enum (`ItineraryProposalStatus`) to avoid coupling the travel-request flow to the reactive flow.

---

## Data Model

### New Entities and Their Relationships

```
Booking (existing)
  └── LiveItinerary               1:1, created when a booking is confirmed
        ├── ItinerarySegment      1:N, one per bookable component (flight, hotel, restaurant)
        │     └── ItineraryEvent  1:N, events that affected this segment
        └── ItineraryProposal     1:N, AI re-plan proposals waiting for approval
              └── ProposedChange  1:N, per-segment diff inside one proposal
```

### Entity Descriptions

**`LiveItinerary`**
Tracks the reactive state for one confirmed booking. Created by `BookingConfirmedEvent` listener. Holds the `watchEnabled` flag (users can pause reactivity).

**`ItinerarySegment`**
One row per bookable item in the trip: the booked flight, hotel stay, and each restaurant booking. Carries the `currentStatus` field that mirrors real-world state (`ON_SCHEDULE`, `DELAYED`, `CANCELLED`, `CLOSED`).

**`ItineraryEvent`**
An immutable audit record of a detected real-world disruption. Source can be `MANUAL` (user-reported), `SCHEDULED_POLL`, or `WEBHOOK`. Stores the raw disruption payload as JSONB.

**`ItineraryProposal`**
An AI-generated re-plan for one or more affected segments. Status lifecycle: `PENDING_APPROVAL` → `APPROVED` | `REJECTED` | `EXPIRED`. Consequential actions are executed only on transition to `APPROVED`.

**`ProposedChange`**
One row per segment inside an `ItineraryProposal`. Records what would change: `changeType` (`REPLACE_FLIGHT`, `REPLACE_HOTEL`, `REPLACE_RESTAURANT`, `ADJUST_TIME`, `CANCEL_SEGMENT`), the new entity UUID (if replacing), and the cost delta.

### Migration File

`V25__reactive_living_itinerary.sql`

```sql
-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE itinerary_segment_status AS ENUM (
    'ON_SCHEDULE', 'DELAYED', 'CANCELLED', 'CLOSED', 'REBOOKED'
);
CREATE TYPE itinerary_event_source AS ENUM (
    'MANUAL', 'SCHEDULED_POLL', 'WEBHOOK'
);
CREATE TYPE itinerary_proposal_status AS ENUM (
    'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED'
);
CREATE TYPE proposed_change_type AS ENUM (
    'REPLACE_FLIGHT', 'REPLACE_HOTEL', 'REPLACE_RESTAURANT',
    'ADJUST_TIME', 'CANCEL_SEGMENT'
);

-- ─── LiveItinerary ────────────────────────────────────────────────────────────
CREATE TABLE live_itineraries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    watch_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_live_itineraries_booking ON live_itineraries(booking_id);

-- ─── ItinerarySegment ─────────────────────────────────────────────────────────
CREATE TABLE itinerary_segments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id    UUID NOT NULL REFERENCES live_itineraries(id) ON DELETE CASCADE,
    segment_type    VARCHAR(30) NOT NULL,   -- 'FLIGHT' | 'HOTEL' | 'RESTAURANT'
    entity_id       UUID NOT NULL,           -- FK into flights/hotels/restaurants
    current_status  itinerary_segment_status NOT NULL DEFAULT 'ON_SCHEDULE',
    scheduled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_itinerary_segments_itinerary ON itinerary_segments(itinerary_id);

-- ─── ItineraryEvent ──────────────────────────────────────────────────────────
CREATE TABLE itinerary_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_id      UUID NOT NULL REFERENCES itinerary_segments(id) ON DELETE CASCADE,
    source          itinerary_event_source NOT NULL,
    description     TEXT NOT NULL,
    disruption_data JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_itinerary_events_segment ON itinerary_events(segment_id);

-- ─── ItineraryProposal ────────────────────────────────────────────────────────
CREATE TABLE itinerary_proposals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id    UUID NOT NULL REFERENCES live_itineraries(id) ON DELETE CASCADE,
    triggering_event_id UUID REFERENCES itinerary_events(id),
    status          itinerary_proposal_status NOT NULL DEFAULT 'PENDING_APPROVAL',
    ai_summary      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_itinerary_proposals_itinerary ON itinerary_proposals(itinerary_id, status);

-- ─── ProposedChange ───────────────────────────────────────────────────────────
CREATE TABLE proposed_changes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id         UUID NOT NULL REFERENCES itinerary_proposals(id) ON DELETE CASCADE,
    segment_id          UUID NOT NULL REFERENCES itinerary_segments(id),
    change_type         proposed_change_type NOT NULL,
    replacement_entity_id UUID,             -- new flight/hotel/restaurant UUID
    cost_delta          DECIMAL(10,2),      -- positive = more expensive
    ai_rationale        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## The Event → Re-Plan Loop

### Three Trigger Paths

All three paths eventually publish `ItineraryEventDetectedEvent`. That record-event is the single entry point to the re-plan listener.

```
1. Scheduled poll (cron)
   ReactiveItineraryScheduler
     → checks flight status, hotel open status, restaurant availability
     → if disruption detected → creates ItineraryEvent (source=SCHEDULED_POLL)
     → publishes ItineraryEventDetectedEvent

2. User manual report
   POST /itinerary/{itineraryId}/events
   LiveItineraryController → LiveItineraryService.recordManualEvent()
     → creates ItineraryEvent (source=MANUAL)
     → publishes ItineraryEventDetectedEvent

3. External webhook
   POST /webhooks/itinerary/{source}  (e.g. airline push, venue alert)
   ItineraryWebhookController → LiveItineraryService.recordWebhookEvent()
     → creates ItineraryEvent (source=WEBHOOK)
     → publishes ItineraryEventDetectedEvent
```

### Re-Plan Listener

`ReactivePlanningListener` is a Spring Modulith `@ApplicationModuleListener` annotated `@Async` (identical pattern to `PlanningOrchestrator`).

It:
1. Loads the `LiveItinerary` and the affected `ItinerarySegment`.
2. Loads the parent `Booking` to reconstruct context (dates, destination, budget, traveler count).
3. Builds a constrained `AgentContext` that only searches for alternatives to the disrupted segment type. For example, if a flight is cancelled it sets `hotelBudget = 0`, `restaurantBudget = 0` and only calls `FlightAgent.findOptions(ctx)`. For a hotel disruption it only calls `HotelAgent.findOptions(ctx)`.
4. Calls `OrchestratorAgent.orchestrate(ctx)` **or** the individual sub-agent directly. For single-segment disruptions the single-agent path is preferred to avoid unnecessary AI calls.
5. Takes the top-ranked result and generates an AI summary via `ChatClient` (same pattern as `RankingAgent.generateMotivation()`).
6. Persists an `ItineraryProposal` with status `PENDING_APPROVAL` and one or more `ProposedChange` rows.
7. Publishes `ItineraryProposalReadyEvent`.

### Proposal Ready Listener

`ItineraryNotificationListener` listens for `ItineraryProposalReadyEvent` (same module listener pattern as `NotificationService`). It:
- Sends an email via the existing `EmailService`.
- Writes to the existing `NotificationLog`.
- Exposes an SSE stream endpoint so the Angular app gets a real-time push without polling.

### User Approval Gate

```
POST /itinerary/proposals/{proposalId}/approve
POST /itinerary/proposals/{proposalId}/reject
```

On `approve`:
1. Transition `ItineraryProposal.status` to `APPROVED`.
2. For each `ProposedChange` with `changeType = REPLACE_*`, update the corresponding `ItinerarySegment.entityId` and mark `currentStatus = REBOOKED`.
3. If the `ProposedChange` involves a partner re-message, call `MessagingService.start()` to open a support conversation thread (existing method, no new code needed).
4. Publish `ItineraryApprovedEvent` for any downstream side effects.

On `reject`: transition to `REJECTED`, no other side effects.

---

## How It Reuses Existing AI Code

| Existing class | Role in the reactive loop |
|---|---|
| `OrchestratorAgent.orchestrate(AgentContext)` | Called for full-segment replacement; same method, narrowed budget context |
| `HotelAgent.findOptions(AgentContext)` | Called directly for hotel-only disruptions |
| `FlightAgent.findOptions(AgentContext)` | Called directly for flight-only disruptions |
| `RestaurantAgent.findOptions(AgentContext)` | Called directly for restaurant-only disruptions |
| `RankingAgent.rank(...)` | Used when multiple segments need replacement |
| `ChatClient.prompt(...).call().content()` | Generates the `ai_summary` on `ItineraryProposal` |
| `ConciergeService.buildRecommendation()` | Can be called alongside a re-plan to inject contextual tips into the notification |
| `RagIngestionService` | No changes; RAG context naturally enriches the `ChatClient` prompts |
| `AiRateLimiter.tryAcquire(userEmail)` | Applied before the re-plan call to prevent abuse on manual triggers |

The `ReactivePlanningListener` does **not** call `PlanningOrchestrator` — it calls the agents directly to avoid the full new-request lifecycle (no new `TravelRequest` or `TravelProposal` rows are created).

---

## Backend: New Java Files

Package root: `com.travelai`

### Domain: `itinerary`

| File | Purpose |
|---|---|
| `itinerary/LiveItinerary.java` | Entity: 1:1 with `Booking`, holds `watchEnabled`, `lastCheckedAt` |
| `itinerary/LiveItineraryRepository.java` | `JpaRepository<LiveItinerary, UUID>` with `findByBookingId`, `findAllByWatchEnabledTrue` |
| `itinerary/ItinerarySegment.java` | Entity: segment type + entity UUID + `currentStatus` enum |
| `itinerary/ItinerarySegmentRepository.java` | `findByItineraryId`, `findByEntityId` |
| `itinerary/ItineraryEvent.java` | Entity: immutable disruption record with JSONB `disruptionData` (`@JdbcTypeCode(SqlTypes.JSON)`) |
| `itinerary/ItineraryEventRepository.java` | `findBySegmentId` |
| `itinerary/ItineraryProposal.java` | Entity: `status` enum + `expiresAt` + `resolvedAt` |
| `itinerary/ItineraryProposalRepository.java` | `findByItineraryIdAndStatus`, `findPendingExpired` |
| `itinerary/ProposedChange.java` | Entity: `changeType` enum + `replacementEntityId` + `costDelta` |
| `itinerary/ProposedChangeRepository.java` | `findByProposalId` |
| `itinerary/SegmentType.java` | Enum: `FLIGHT`, `HOTEL`, `RESTAURANT` |
| `itinerary/SegmentStatus.java` | Enum: `ON_SCHEDULE`, `DELAYED`, `CANCELLED`, `CLOSED`, `REBOOKED` |
| `itinerary/ItineraryProposalStatus.java` | Enum: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `EXPIRED` |
| `itinerary/ProposedChangeType.java` | Enum: `REPLACE_FLIGHT`, `REPLACE_HOTEL`, `REPLACE_RESTAURANT`, `ADJUST_TIME`, `CANCEL_SEGMENT` |
| `itinerary/LiveItineraryService.java` | Core domain logic: `initForBooking`, `recordManualEvent`, `recordWebhookEvent`, `approve`, `reject`, `listPendingProposals` |
| `itinerary/LiveItineraryController.java` | REST: `GET /itinerary/{itineraryId}`, `POST /itinerary/{itineraryId}/events`, `GET /itinerary/{itineraryId}/proposals`, `POST /itinerary/proposals/{proposalId}/approve`, `POST /itinerary/proposals/{proposalId}/reject`, `GET /itinerary/stream` (SSE) |
| `itinerary/dto/LiveItineraryResponse.java` | Record: full itinerary state with segments and pending proposals |
| `itinerary/dto/ItineraryProposalResponse.java` | Record: proposal + list of `ProposedChangeResponse` |
| `itinerary/dto/ProposedChangeResponse.java` | Record |
| `itinerary/dto/ReportEventRequest.java` | Record: `segmentId`, `description`, `disruptionData` (JSON map) |

### Domain: `ai/itinerary` (reactive planning)

| File | Purpose |
|---|---|
| `ai/itinerary/ReactivePlanningListener.java` | `@ApplicationModuleListener @Async`: listens for `ItineraryEventDetectedEvent`, invokes agents, persists `ItineraryProposal` |
| `ai/itinerary/ReactivePlanningScheduler.java` | `@Scheduled(cron = "0 */30 * * * *")`: polls segments with `ON_SCHEDULE` status 48h before departure, checks availability via existing catalog services |
| `ai/itinerary/ItineraryWebhookController.java` | `POST /webhooks/itinerary/{source}`: translates external push into `ItineraryEvent` (same pattern as `WebhookController`) |
| `ai/itinerary/ItineraryNotificationListener.java` | `@ApplicationModuleListener`: listens for `ItineraryProposalReadyEvent`, sends email via `EmailService`, logs to `NotificationLog` |

### Events (in their home modules)

| File | Location | Description |
|---|---|---|
| `itinerary/events/ItineraryEventDetectedEvent.java` | `itinerary/events/` | Record: `segmentId`, `itineraryId`, `userEmail`, `source` |
| `itinerary/events/ItineraryProposalReadyEvent.java` | `itinerary/events/` | Record: `proposalId`, `itineraryId`, `userEmail` |
| `itinerary/events/ItineraryApprovedEvent.java` | `itinerary/events/` | Record: `proposalId`, `itineraryId`, `userEmail` |

### Modifications to Existing Files

| File | Change |
|---|---|
| `booking/BookingService.java` | After saving the confirmed booking, publish `BookingConfirmedEvent` (already done) — no change needed. Add a call to `LiveItineraryService.initForBooking(saved)` after save. Inject `LiveItineraryService`. |
| `shared/exception/ErrorCode.java` | Add: `ITINERARY_NOT_FOUND`, `ITINERARY_PROPOSAL_NOT_FOUND`, `ITINERARY_SEGMENT_NOT_FOUND` |
| `notification/NotificationService.java` | Add `onItineraryProposalReady(ItineraryProposalReadyEvent)` listener that sends a disruption alert email |

---

## Frontend: New Angular Files

### New service

| File | Purpose |
|---|---|
| `core/services/itinerary.service.ts` | HTTP calls to `/itinerary/*`; also manages the SSE `EventSource` connection for live alerts and exposes an `alerts$` signal |

### New feature: `features/itinerary-live/`

| File | Purpose |
|---|---|
| `features/itinerary-live/itinerary-live.component.ts` | Route `/trips/:id/live`: full reactive itinerary view for one booking. Shows segments timeline, pending proposals, alert banner |
| `features/itinerary-live/itinerary-live.component.scss` | Component styles |
| `features/itinerary-live/segment-card.component.ts` | Presentational: one segment row with status badge, disruption indicator, and a "Report issue" action |
| `features/itinerary-live/proposal-drawer.component.ts` | Slide-in panel showing an `ItineraryProposal` diff (before/after per segment), approve/reject CTAs |
| `features/itinerary-live/alert-banner.component.ts` | Fixed-top dismissable banner that appears when a `PENDING_APPROVAL` proposal exists; links to the proposal drawer |

### Modifications to Existing Files

| File | Change |
|---|---|
| `core/models/api.models.ts` | Add `LiveItineraryResponse`, `ItineraryProposalResponse`, `ProposedChangeResponse`, `ReportEventRequest`, `SegmentStatus`, `ItineraryProposalStatus`, `ProposedChangeType` interfaces |
| `features/trips/trips.component.ts` | Add "Live" badge on trip cards that have a `PENDING_APPROVAL` proposal. Navigate to `/trips/:id/live` on click |
| `features/bookings/bookings.component.ts` | Add alert indicator on booking rows with pending proposals. Link to live itinerary view |
| `app.routes.ts` | Add `{ path: 'trips/:id/live', loadComponent: () => import('./features/itinerary-live/itinerary-live.component') }` |

---

## Data Flow

```
Trigger (cron / manual / webhook)
  │
  ▼
LiveItineraryService
  │  creates ItineraryEvent
  │  updates ItinerarySegment.currentStatus
  │
  ▼  publishes
ItineraryEventDetectedEvent
  │
  ▼  @ApplicationModuleListener @Async
ReactivePlanningListener
  │  loads Booking → builds AgentContext
  │  calls FlightAgent | HotelAgent | RestaurantAgent
  │  calls ChatClient for ai_summary
  │  persists ItineraryProposal (PENDING_APPROVAL) + ProposedChange rows
  │
  ▼  publishes
ItineraryProposalReadyEvent
  │
  ├─▶ ItineraryNotificationListener  →  EmailService (existing)
  │                                  →  NotificationLog (existing)
  │
  └─▶ SSE stream endpoint            →  Angular itinerary.service alert$
                                      →  AlertBannerComponent shown
                                      →  User opens ProposalDrawer
                                      │
                                      ▼
                               POST /proposals/{id}/approve
                                      │
                                      ▼
                               LiveItineraryService.approve()
                                 - transitions proposal to APPROVED
                                 - updates ItinerarySegment
                                 - calls MessagingService (optional partner re-message)
                                 - publishes ItineraryApprovedEvent
```

---

## Build Sequence

### Phase 1 — Data Model (unblocks everything else)

1. `V25__reactive_living_itinerary.sql` migration
2. `LiveItinerary`, `ItinerarySegment`, `ItineraryEvent`, `ItineraryProposal`, `ProposedChange` entities + enums
3. All five repositories
4. `ErrorCode` additions
5. `LiveItineraryService.initForBooking()` (just the creation path; no re-planning yet)
6. Wire `BookingService` to call `initForBooking` on confirm

### Phase 2 — Manual Event + Basic Re-Plan

7. `ItineraryEventDetectedEvent`, `ItineraryProposalReadyEvent`, `ItineraryApprovedEvent` record classes
8. `ReactivePlanningListener` — full re-plan logic using existing agents
9. `LiveItineraryService.recordManualEvent()` + `approve()` + `reject()`
10. `LiveItineraryController` with manual report endpoint, approve/reject endpoints, GET proposal list
11. DTO records
12. Frontend `itinerary.service.ts` (polling first; SSE in phase 3)
13. Frontend `itinerary-live` feature with `segment-card` and `proposal-drawer`
14. Wire trips/bookings components to show pending-proposal indicators
15. Add route to `app.routes.ts`

### Phase 3 — Scheduled Polling

16. `ReactivePlanningScheduler` polling existing `FlightService.search()`, `HotelAvailabilityRepository`, `RestaurantAvailabilityRepository` to detect disruptions
17. `LiveItineraryService.recordWebhookEvent()` + `ItineraryWebhookController`

### Phase 4 — Real-Time Push and Notifications

18. SSE endpoint on `LiveItineraryController` (`GET /itinerary/stream`, `SseEmitter`)
19. `ItineraryNotificationListener` — email via existing `EmailService`
20. Replace polling in `itinerary.service.ts` with SSE `EventSource`
21. `alert-banner.component.ts`

### Phase 5 — Polish and Hardening

22. Proposal expiry scheduler (mark `PENDING_APPROVAL` proposals `EXPIRED` after `expiresAt`)
23. Admin view extension — add `live_itineraries` to existing admin entity-manager schema
24. Unit tests for `ReactivePlanningListener` (mock agents), `LiveItineraryService`, controller endpoints

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| AI call latency blocks re-plan | Medium | `@Async` listener already decouples from the HTTP thread; add a timeout on `ChatClient` call |
| Scheduled poll triggers too many re-plans | Medium | Check `AiRateLimiter.tryAcquire(userEmail)` before calling agents; cap polls to bookings within T-48h of departure |
| `AgentContext` built from stale Booking data | Low | Read fresh from DB in the listener; do not cache |
| SSE connections leak under load | Low | Use `SseEmitter` with a timeout; store emitters per userId in a `ConcurrentHashMap`; clean up on completion/error |
| User confusion from too many proposals | Medium | Only generate one active `PENDING_APPROVAL` proposal per itinerary at a time; auto-expire old ones before creating new |

---

## Cheapest Viable V1 (What to Cut)

V1 can ship with only Phases 1 and 2 above. That delivers:

- A `LiveItinerary` created for every confirmed booking
- User-reported disruptions (the manual trigger path)
- AI re-plan using the existing agent stack
- A minimal web UI: segment timeline + proposal drawer with approve/reject
- Email notification on new proposal (existing `EmailService`, no new infrastructure)

**Cut for V1:**
- Scheduled poll (Phase 3) — replace with a manual "Check for updates" button in the UI
- External webhooks (Phase 3) — no airline/venue integration needed
- SSE (Phase 4) — poll the proposals endpoint every 30 seconds on the proposals page instead
- Partner re-message automation — show a "Message partner" button instead of auto-firing

V1 is fully functional as a manual disruption reporter + AI re-planner. The automation layers (poll, webhook, SSE) are additive and can follow in the next release.
