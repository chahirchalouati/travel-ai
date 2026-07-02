# Backend Conventions — Travel AI (Spring Modulith)

Stack: **Spring Boot 3.5**, **Java 21**, **Spring Modulith 1.3.5**, Spring AI, Flyway, PostgreSQL+pgvector, JWT auth. Maven wrapper `./mvnw`. Run dir: `travel-ai-backend/`.

## Module layout (CRITICAL)

Each business capability is a **Spring Modulith `@ApplicationModule`** package under `com.travelai.<module>`. One package == one module. Never leak internal types across modules — communicate via public API types or domain events.

A module package typically contains, flat (no `service/`, `controller/` sub-folders):

```
com/travelai/<module>/
├── package-info.java          # @org.springframework.modulith.ApplicationModule
├── <Entity>.java              # JPA entity
├── <Entity>Repository.java    # Spring Data repo
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

Shared/cross-cutting code lives in `com.travelai.shared` (`config`, `domain`, `exception`) — not a business module.

## Rules

- **Immutability**: DTOs are Java `record`s. Don't mutate entities outside their service.
- **Cross-module calls**: prefer publishing/consuming events (`@ApplicationModuleListener`) over calling another module's service directly. Enum columns are stored as VARCHAR (migration V7 converted them) — keep it that way.
- **Controllers** are thin: validate input, delegate to the service, return a DTO. Base path `/api/<module>`.
- **New public endpoint** → must be allow-listed in `shared/config/SecurityConfig.java` as `.requestMatchers("/api/<path>/**").permitAll()` (or `.authenticated()` for gated ones). Otherwise it 401s.
- **Pricing/money is server-authoritative** — never trust amounts from the client (see revenue/commission model V53).
- **Errors**: throw, let the shared exception handler map them. Never swallow. User-facing messages must not leak internals.
- **Tests**: JUnit 5 + Mockito, `@ApplicationModuleTest` for module slices. Keep coverage ≥ 80% for new logic.

## Flyway migrations

- Location: `travel-ai-backend/src/main/resources/db/migration/`.
- Naming: `V<n>__<snake_description>.sql`. **The next number is the current max + 1** — check with `ls` before writing; do not reuse or renumber applied migrations.
- Migrations are immutable once committed/applied. Fix-forward with a new `V<n+1>`.
- `V6__spring_modulith_event_publication.sql` backs the event publication registry — don't touch.

## Build & verify

```bash
cd travel-ai-backend
./mvnw -o compile          # fast, triggers devtools hot-restart
./mvnw test                # unit/module tests
./mvnw spring-boot:run     # dev profile is default (SPRING_PROFILES_ACTIVE:dev)
```
Health: http://localhost:8080/actuator/health · Swagger: http://localhost:8080/swagger-ui.html
