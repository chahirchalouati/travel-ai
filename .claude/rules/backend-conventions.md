# Backend Conventions — Travel AI (Spring Modulith)

Stack: **Spring Boot 3.5**, **Java 21**, **Spring Modulith 1.3.5**, Spring AI 1.0, Flyway, PostgreSQL 16+pgvector, Redis 7, JWT+TOTP auth, MinIO (S3), MapStruct 1.6. Maven wrapper `./mvnw`. Run dir: `travel-ai-backend/`.

## Module layout (CRITICAL)

Each business capability is a **Spring Modulith `@ApplicationModule`** package under `com.travelai.<module>`. One package == one module. Never leak internal types across modules — communicate via public API types or domain events.

**40 modules exist today:** admin, ai (chat/concierge/planning/rag), ancillary, attraction, audit, auth, blog, booking, careers, catalog (flight/hotel/cruise/restaurant/suggest), contact, destination, event, featureflag, forum, help, invoice, itinerary, loyalty, media, messaging, notification, partner, payment, press, pricewatch, promo, revenue, review, shared, sitecontent, stats, stories, subscription, travel (budget), tripcollab, user.

A module package is **flat** (no `service/`, `controller/` sub-folders):

```
com/travelai/<module>/
├── package-info.java          # @org.springframework.modulith.ApplicationModule
├── <Entity>.java              # JPA entity
├── <Entity>Repository.java    # Spring Data repo (+ JpaSpecificationExecutor for admin-filterable entities)
├── <Module>Service.java       # business logic
├── <Module>Controller.java    # REST @RestController, base path /api/<module>
├── <Something>Listener.java   # @ApplicationModuleListener for cross-module events
├── <X>Status.java             # enums (persisted as VARCHAR, see V7)
└── dto/                       # request/response records
```

`package-info.java` must be:
```java
@org.springframework.modulith.ApplicationModule
package com.travelai.<module>;
```

Shared/cross-cutting code lives in `com.travelai.shared` — not a business module:
- `config/` — SecurityConfig, JwtService, JwtProperties, UserDetailsConfig, WebConfig (global /api prefix + CORS), CacheConfig, RateLimitFilter, OpenApiConfig, AuditConfig, SpaForwardingController
- `domain/` — BaseEntity (id + timestamps), ApiResponse<T>, PageSupport<T>, EntitySpecifications (generic JPA Spec builder for admin search/filter), AdminListQuery, SpendingPriority
- `exception/` — GlobalExceptionHandler, TravelAiException, ErrorCode

## Cross-module events

Domain events live in the dependency-free `com.travelai.event` package: BookingConfirmedEvent, BookingCancelledEvent, PaymentCompletedEvent, PriceDropEvent, WaitlistAvailableEvent, EmailVerificationRequestedEvent, PasswordResetRequestedEvent, PartnerWelcomeEvent. Additional module-local events exist in `itinerary/events/` and `travel/events/`.

Key event-driven flows:
- PaymentCompletedEvent → BookingPaymentListener (confirms booking), LoyaltyPaymentListener (awards points), InvoiceEmailListener (sends PDF)
- PriceDropEvent → notification to watchers
- PartnerRegisteredEvent → welcome email

## Rules

- **Immutability**: DTOs are Java `record`s. Don't mutate entities outside their service.
- **Cross-module calls**: prefer publishing/consuming events (`@ApplicationModuleListener`) over calling another module's service directly.
- **Controllers** are thin: validate input, delegate to the service, return a DTO. Base path `/api/<module>`.
- **Admin endpoints** use `/admin/*` path (global `/api` prefix via WebConfig), class-level `@PreAuthorize("hasRole('ADMIN')")`. They do NOT need SecurityConfig entries (that's for public only). Roles: TRAVELER, PARTNER, OPERATIONS, ADMIN.
- **New public endpoint** → must be allow-listed in `shared/config/SecurityConfig.java` as `.requestMatchers("/api/<path>/**").permitAll()` (or `.authenticated()` for gated ones). Otherwise it 401s.
- **Pricing/money is server-authoritative** — never trust amounts from the client (commission model: hotel 10%, other 3%, see V53).
- **Errors**: throw, let the shared exception handler map them. Never swallow. User-facing messages must not leak internals.
- **Tests**: JUnit 5 + Mockito, `@ApplicationModuleTest` for module slices. Keep coverage >= 80% for new logic. ~209 tests in the suite.
- **Enum columns** stored as VARCHAR (migration V7 converted them) — keep it that way.

## Flyway migrations

- Location: `travel-ai-backend/src/main/resources/db/migration/`.
- **63 migrations** exist (V1–V63). The next number is V64.
- Naming: `V<n>__<snake_description>.sql`. **Always `ls` to find the true current max** — do not reuse or renumber applied migrations.
- Migrations are immutable once committed/applied. Fix-forward with a new `V<n+1>`.
- `V6__spring_modulith_event_publication.sql` backs the event publication registry — don't touch.

## AI subsystem

- Spring AI 1.0 + Ollama (docker service `travelai-ollama`, port 11434)
- Chat model: `qwen2.5:7b` (temperature 0.4)
- Embeddings: `nomic-embed-text` (768-dim, pgvector HNSW cosine)
- RAG similarity threshold: ~0.45 (not 0.7)
- Multi-agent planning: OrchestratorAgent → FlightAgent, HotelAgent, RestaurantAgent, RankingAgent
- Rate limit: 60 req/min, max 3 proposals, 10s agent timeout

## Build & verify

```bash
cd travel-ai-backend
./mvnw -o compile          # fast, triggers devtools hot-restart
./mvnw test                # unit/module tests (~209 tests)
./mvnw spring-boot:run     # dev profile is default (SPRING_PROFILES_ACTIVE:dev)
```
Health: http://localhost:8080/actuator/health · Swagger: http://localhost:8080/swagger-ui.html
