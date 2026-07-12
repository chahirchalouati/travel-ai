# Travel AI Backend — Implementation Plan

> Monolith Spring Modulith · Spring Boot 3.5 · Java 21 · PostgreSQL · Spring AI

---

## Architecture at a Glance

```
com.travelai/
├── shared/          ← shared kernel (domain base, exceptions, config, security)
├── auth/            ← JWT auth, RBAC, registration / login
├── user/            ← traveller profile, preferences, feedback
├── partner/         ← partner onboarding lifecycle
├── catalog/
│   ├── hotel/       ← hotel data + availability
│   ├── restaurant/  ← restaurant data + availability
│   └── flight/      ← flight data + search
├── travel/          ← travel requests, proposal aggregation
├── ai/
│   ├── planning/    ← multi-agent orchestration (5 agents)
│   └── concierge/   ← in-stay AI assistant
├── booking/         ← booking lifecycle, waitlist, cancellation
├── payment/         ← Stripe / Klarna / PayPal + webhooks + payouts
├── notification/    ← email / push dispatch
├── admin/           ← admin panel API
└── audit/           ← immutable AI audit log (RF-09)
```

Module communication: **Spring Modulith events** only — no direct cross-module bean calls except through published interfaces (`@ApplicationModuleListener`).

---

## Sprint Plan

### Sprint 0 — Foundation (current)
- [x] Spring Boot 3.5 project scaffold
- [x] Spring Modulith BOM + module package structure
- [x] Spring AI BOM (OpenAI)
- [x] `pom.xml` with all dependencies (JWT, MapStruct, Redis, Flyway, Mail)
- [x] `application.yml` with full config skeleton
- [x] Flyway V1 — complete DB schema (all tables, indexes, enums)
- [x] `.env.example`
- [ ] Docker Compose (Postgres + Redis)
- [ ] GitHub Actions CI skeleton

---

### Sprint 1 — Shared Kernel + Auth
**Goal:** running app that returns a JWT on login.

#### shared/
- [ ] `BaseEntity` — UUID id, createdAt, updatedAt (MappedSuperclass)
- [ ] `ApiResponse<T>` — standard envelope `{ success, data, error, meta }`
- [ ] `GlobalExceptionHandler` — `@RestControllerAdvice` for validation, not found, auth errors
- [ ] `SecurityConfig` — stateless JWT filter chain, RBAC rules, CORS
- [ ] `JwtService` — issue / validate / refresh tokens (jjwt 0.12)
- [ ] `AuditConfig` — Spring Data JPA auditing (@EnableJpaAuditing)

#### auth/
- [ ] `User` entity + `UserRole` enum
- [ ] `UserRepository`
- [ ] `RegisterRequest` DTO (email, password, firstName, lastName) + validation
- [ ] `LoginRequest` DTO
- [ ] `AuthResponse` DTO (accessToken, refreshToken, expiresIn)
- [ ] `AuthService` — register, login, refresh, logout
- [ ] `AuthController` — POST /auth/register, /auth/login, /auth/refresh, /auth/logout
- [ ] `JwtAuthFilter` — OncePerRequestFilter

**Deliverable:** `POST /api/auth/register` + `POST /api/auth/login` return JWT.

---

### Sprint 2 — User Module
**Goal:** authenticated user can read and update their profile and preferences.

- [ ] `UserProfile` entity + `UserPreferences` entity
- [ ] `UserRepository`, `UserPreferencesRepository`
- [ ] `UserService` — getProfile, updateProfile, updatePreferences
- [ ] `UserController` — GET /users/me, PUT /users/me, GET/PUT /users/me/preferences
- [ ] MapStruct `UserMapper`
- [ ] Unit tests (UserService)

---

### Sprint 3 — Partner Module
**Goal:** partner can self-register and progress through the onboarding lifecycle.

- [ ] `Partner` entity + `PartnerStatus` enum
- [ ] `PartnerService` — register, configure, validate, goLive, suspend
- [ ] `PartnerController` — POST /partners, PUT /partners/{id}/configuration, POST /partners/{id}/validate
- [ ] `PartnerOnboardingEvent` (Spring Modulith event → notification module)
- [ ] Admin endpoints to manage partner status
- [ ] Unit + integration tests

---

### Sprint 4 — Catalog Module (Hotel + Restaurant + Flight)
**Goal:** queryable catalog for all three entity types with availability.

#### catalog/hotel/
- [ ] `Hotel` entity + `HotelAvailability` entity
- [ ] `HotelRepository` with `Specification`-based search (budget, city, dates, constraints)
- [ ] `HotelService` — search, getById, checkAvailability
- [ ] `HotelController` — GET /hotels/search, GET /hotels/{id}, GET /hotels/{id}/availability

#### catalog/restaurant/
- [ ] `Restaurant` entity + `RestaurantAvailability` entity
- [ ] `RestaurantService` — search, checkAvailability
- [ ] `RestaurantController` — GET /restaurants/search

#### catalog/flight/
- [ ] `Flight` entity
- [ ] `FlightService` — search by origin/dest/dates/budget
- [ ] `FlightController` — GET /flights/search

#### Shared catalog
- [ ] `AvailabilityVerifier` — verify multi-element availability atomically (used by booking)
- [ ] Redis cache on search results (TTL 15 min)
- [ ] Unit tests + repository tests

---

### Sprint 5 — Travel Planning (Request + AI Orchestration)
**Goal:** user submits a request, AI returns 2–3 proposals.

#### travel/
- [ ] `TravelRequest` entity
- [ ] `TravelProposal` entity
- [ ] `TravelRequestService` — create, refine, listProposals
- [ ] `TravelController` — POST /travel/requests, GET /travel/requests/{id}/proposals, PUT /travel/requests/{id}

#### ai/planning/
- [ ] `PlanningOrchestrator` — coordinates all agents, returns proposals
- [ ] `OrchestratorAgent` — normalises input, calculates per-category sub-budgets based on priority
- [ ] `HotelAgent` — queries `HotelService` with sub-budget filter, returns ranked shortlist
- [ ] `RestaurantAgent` — queries `RestaurantService` with food-budget filter
- [ ] `FlightAgent` — queries `FlightService` with transport-budget filter
- [ ] `RankingAgent` — assembles 2–3 coherent packages, calls Spring AI (GPT-4o-mini) for motivation text
- [ ] `AiBudgetSplitter` — splits total budget by priority weight (food/stay/balanced)
- [ ] `ProposalAssembler` — builds `TravelProposal` with relevance score
- [ ] Budget tolerance enforcement: proposals ≤ budget × 1.10
- [ ] `AiRateLimiter` — Redis-backed sliding window (60 calls/min)
- [ ] `AuditLogService` call after every agent invocation

**Deliverable:** `POST /api/travel/requests` → background planning → `GET .../proposals` returns 2–3 JSON proposals.

---

### Sprint 6 — Booking Module
**Goal:** user can book a proposal with real-time availability check.

- [ ] `Booking` entity + `BookingTraveler` entity + `WaitlistEntry` entity
- [ ] `BookingService` — create, confirmAvailability, waitlist enroll, cancel
- [ ] `BookingController` — POST /bookings, GET /bookings/{id}, DELETE /bookings/{id}
- [ ] `WaitlistController` — POST /waitlist, DELETE /waitlist/{id}
- [ ] `BookingCreatedEvent` → payment module
- [ ] `BookingCancelledEvent` → notification module
- [ ] `WaitlistNotificationJob` — scheduled check for freed availability
- [ ] Integration test (full booking flow with H2 or Testcontainers Postgres)

---

### Sprint 7 — Payment Module
**Goal:** full payment flow with Stripe; Klarna stubbed.

- [ ] `Payment` entity + `PaymentWebhook` entity
- [ ] `StripePaymentGateway` — charge, refund, webhook verification
- [ ] `KlarnaPaymentGateway` — stub (returns PENDING)
- [ ] `PayPalPaymentGateway` — stub (returns PENDING)
- [ ] `PaymentGateway` interface (Strategy pattern)
- [ ] `CommissionCalculator` — hotel 10%, other 3%
- [ ] `PaymentService` — initiate, confirm, refund, processWebhook
- [ ] `PaymentController` — POST /bookings/{id}/payment, POST /payments/webhook
- [ ] `PayoutService` — calculate and record partner payout (separate from collection)
- [ ] `PaymentCompletedEvent` → booking module (confirm booking), notification module
- [ ] Webhook idempotency (check `payment_webhooks` table before processing)
- [ ] Unit tests for commission calculation and idempotency

---

### Sprint 8 — Notification Module
**Goal:** email confirmations for booking and waitlist alerts.

- [ ] `NotificationService` — sendEmail (JavaMailSender + Thymeleaf templates)
- [ ] `@ApplicationModuleListener` for: `BookingConfirmedEvent`, `PaymentCompletedEvent`, `WaitlistAvailableEvent`, `PartnerOnboardingEvent`
- [ ] Thymeleaf email templates: booking-confirmation, waitlist-alert, payment-receipt, partner-welcome
- [ ] `NotificationLog` entity (simple persistence of sent notifications)
- [ ] Unit tests with Greenmail (in-memory SMTP)

---

### Sprint 9 — Admin Module
**Goal:** internal admin panel API for operations team.

- [ ] `AdminStructureController` — GET/PATCH /admin/structures (list, activate, suspend partners)
- [ ] `AdminBookingController` — GET /admin/bookings (paginated, filterable)
- [ ] `AdminAiLogController` — GET /admin/ai-logs (audit trail viewer)
- [ ] `AdminConfigController` — GET/PUT /admin/configurations (budget tolerance, rate limits)
- [ ] All admin endpoints require `ADMIN` role
- [ ] `AdminDashboardDto` — aggregate stats (bookings today, revenue, active partners)

---

### Sprint 10 — AI Concierge (Conceptual → MVP)
**Goal:** natural-language concierge activated 3 days before departure.

- [ ] `TravelContext` value object (destination, dates, hotel, party, budget range)
- [ ] `ConciergeSession` entity (user, context, messages)
- [ ] `ConciergeService` — receive message, build system prompt with context, call Spring AI, route to partner if applicable
- [ ] `ConciergeController` — POST /concierge/sessions, POST /concierge/sessions/{id}/messages
- [ ] `ConciergeActivationJob` — scheduled, activates sessions 3 days before departure
- [ ] GDPR consent check before exposing travel context to partners
- [ ] Unit tests with Spring AI ChatClient mock

---

### Sprint 11 — Hardening + Cross-Cutting
**Goal:** production-grade non-functionals.

- [ ] `RateLimitFilter` — per-user rate limiting (Redis token bucket) on AI endpoints
- [ ] Spring Modulith Architecture Tests (`@ApplicationModuleTest` for each module)
- [ ] Testcontainers integration tests for full booking + payment flow
- [ ] `DockerCompose` — `docker-compose.yml` with Postgres 16 + Redis 7
- [ ] Actuator: custom `/actuator/modulith` endpoint (already wired via `spring-modulith-actuator`)
- [ ] Structured logging (JSON via Logback)
- [ ] OpenAPI / Swagger via Springdoc
- [ ] Input sanitisation audit (XSS, injection)
- [ ] `@Scheduled` jobs: `WaitlistNotificationJob`, `ConciergeActivationJob`

---

## Module Dependency Rules (Spring Modulith)

```
auth       ← (no inbound cross-module dependencies)
shared     ← used by ALL modules (not a Spring Modulith module itself)
user       ← auth (reads user by email)
partner    ← user, notification
catalog    ← partner (hotel/restaurant belong to partner)
travel     ← user, catalog, ai
ai         ← catalog, audit
booking    ← travel, catalog, user, notification
payment    ← booking, notification, audit
notification ← (event listener only — no outbound calls)
admin      ← all modules (read-only aggregation)
audit      ← (write-only from ai, read-only from admin)
```

Cross-module calls happen **only via Spring Modulith published events**, never via direct `@Autowired` service calls across module boundaries.

---

## Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Auth tokens | JWT (jjwt 0.12) stateless | Mobile-first, no server-side session |
| DB migrations | Flyway | Repeatable, versioned, CI-safe |
| DTO mapping | MapStruct | Compile-time, no reflection |
| AI orchestration | Spring AI `ChatClient` + custom agents | Cost-efficient; swap model without refactor |
| Payment | Strategy pattern over gateway-specific code | Stripe now, Klarna/PayPal later |
| Cross-module comms | Spring Modulith `ApplicationEventPublisher` | Enforces boundaries, enables future extraction |
| Caching | Spring Cache + Redis | Search results, proposal cache |
| Rate limiting | Redis sliding window | AI cost control (60 calls/min) |
| DB | PostgreSQL 16 + UUID PKs | `uuid-ossp`, `pg_trgm` for text search |
| Audit | Dedicated `audit` module, immutable append-only | RF-09 requirement |

---

## Immediate Next Step

**Start Sprint 1:** implement `shared/` kernel + `auth/` module.

Files to create (in order):
1. `shared/domain/BaseEntity.java`
2. `shared/domain/ApiResponse.java`
3. `shared/exception/GlobalExceptionHandler.java`
4. `shared/config/SecurityConfig.java`
5. `shared/config/JwtService.java`
6. `auth/User.java` (entity)
7. `auth/AuthService.java`
8. `auth/AuthController.java`
9. `auth/JwtAuthFilter.java`
