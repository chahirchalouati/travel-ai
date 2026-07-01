# Implementation Plan: Competitive Flight / Restaurant / Cruise Booking

> Goal: make flight, restaurant and cruise booking feel as good as (and in
> AI-native ways, *better* than) Booking.com / Skyscanner / OpenTable / cruise.com —
> instead of the thin "catalog browser" they are today.

### Task Type
- [x] Fullstack (backend depth + real funnels + AI differentiators)

---

## 1. Diagnosis — why today it doesn't look like a competitor

Concrete findings from the current code:

| Area | Reality today | Why it loses |
|------|---------------|--------------|
| **The "Book" button** | `flight-detail`, `restaurant-detail`, `cruise-detail` all call `goToPlanner()` — they route to the AI planner, **not a booking flow**. | There is **no actual reservation funnel** anywhere in the catalog. A competitor's core verb (book) is a dead end. |
| **Booking backend** | `POST /bookings` exists ([BookingService.java](travel-ai-backend/src/main/java/com/travelai/booking/BookingService.java)) and instantly sets `CONFIRMED`. | Never called from the frontend; no select→configure→pay funnel; no payment despite a full `payment/` module existing and disconnected. |
| **Flights** | Single-leg only: origin→dest, one date, one price, `baggageIncluded` boolean, `seatsAvailable`. No round-trip, multi-city, cabin class, fare bundles, stops, duration, airline filter, fare calendar, seat map. ([Flight.java](travel-ai-backend/src/main/java/com/travelai/catalog/flight/Flight.java)) | Skyscanner/Google Flights set the bar at round-trip + flexible-date grid + filters. We have one date and a 30-day fuzzy window. |
| **Restaurants** | `available` is a single boolean. `RestaurantAvailability(date, timeSlot, coversAvailable)` entity exists but is **unused** by the detail page. No time-slot grid, no menus, no party-size availability, no deposit. ([restaurant-detail.component.ts](web-app/src/app/features/restaurant-detail/restaurant-detail.component.ts)) | OpenTable/TheFork are defined by the time-slot chip grid ("12:30 · 13:00 · 19:45"). We show a green "Available" dot. |
| **Cruises** | `itinerary` is a freeform string; no cabin categories (interior/ocean/balcony/suite), no per-cabin pricing, no deck plan, no day-by-day map, no excursions. ([Cruise.java](travel-ai-backend/src/main/java/com/travelai/catalog/cruise/Cruise.java)) | Cruise sites sell on cabin-tier choice + day-by-day itinerary visuals. We sell a paragraph. |
| **Reviews / trust** | `review/` module exists with generic `targetType` string — flights/restaurants/cruises *can* be reviewed but ratings are **not surfaced** on cards or detail booking sidebars. | No social proof at the decision point. |

**Existing assets we should exploit (already built, just disconnected):**
`payment/` (gateway + webhooks), `review/` (generic targetType), `RestaurantAvailability`,
and the AI stack — `ai/concierge`, `ai/planning`, `ai/rag`, `ai/chat`, plus the
**reactive living itinerary** (shipped). These are the moat.

---

## 2. Competitive thesis (the North Star)

We will **not** win on inventory breadth vs Booking.com. We win on two axes:

1. **Parity on funnel depth** — a real, conversion-grade booking funnel per vertical
   with the domain primitives competitors have (fare bundles, time-slot grid, cabin
   tiers). Without this we're not in the game.
2. **AI-native moat nobody else has** — every booking is **itinerary-aware,
   concierge-assisted, and price-watched**:
   - "Fits your trip to Lisbon (Jul 12–15)" badges driven by the living itinerary.
   - One concierge flow that books flight + restaurant + cruise as a coherent trip
     and writes them straight into the reactive itinerary.
   - AI fare/price insight ("prices for this route usually rise 8% in the last week")
     and **price watch** instead of a static number.

This is what makes it "very competitive": competitors book *one thing*; we book a
*trip* and keep optimizing it.

---

## 3. Technical solution (synthesized)

### 3.1 Cross-cutting foundation — the Unified Booking Funnel (highest leverage)

A single reusable funnel shell that each vertical plugs into, replacing every
`goToPlanner()` dead end.

**Backend**
- Extend `Booking` to carry vertical-specific config (fare class, time slot, cabin
  category) via a typed JSON `details` column + discriminator, or per-vertical
  nullable columns. Keep `BookingStatus` flow: `PENDING_PAYMENT → CONFIRMED → CANCELLED`.
- Wire `PaymentService`/`PaymentGateway` into `createBooking`: create booking as
  `PENDING_PAYMENT`, take payment (dev: mock gateway already present), confirm on
  webhook. Keep the existing instant-confirm path behind a dev flag for tests.
- New `POST /bookings/quote` endpoint: server-priced quote (base + extras + taxes)
  so the funnel review step is authoritative, not client-computed.

**Frontend** (`web-app/src/app/features/booking-flow/`)
- A `BookingFlowComponent` with 4 steps: **Configure → Travelers → Review → Confirm**,
  driven by a `BookingDraft` signal store. Vertical "configure" panels are projected
  via content slots (flight fare, restaurant slot, cruise cabin).
- New `BookingService.createBooking()` / `.quote()` calls (the service exists for
  `list()`/`cancel()` — add the create + quote methods).
- i18n keys added to **all four** bundles (en/es/fr/it) — required.

### 3.2 Flights depth

**Backend**
- `FlightSearchRequest`: add `returnDate?`, `tripType` (oneway/round/multi),
  `cabinClass`, `stops`, `airlines[]`, `durationMax`.
- Round-trip = pair outbound + inbound results; expose a fare-calendar endpoint
  (`GET /flights/fare-calendar`) returning cheapest price per day over a month.
- Fare bundles: add a `FlightFare` concept (Basic / Standard / Flex) with
  bag/seat/refund attributes and price deltas. Seed via migration.
- Seat availability already exists; add a lightweight seat-map model (rows × letters
  + occupied set) for the configure step.

**Frontend** (`flights` + `flight-detail`)
- Round-trip / multi-city toggle in the filter bar; **fare-calendar strip** under the
  date field (cheapest-day chips).
- Filters rail: stops, airlines, duration, cabin — competitor-standard.
- Detail page: fare-bundle selector cards + a simple seat-map picker feeding the funnel.
- Keep the existing **country→city grouping** — it's already a genuine differentiator;
  reuse it for the round-trip results.

### 3.3 Restaurants depth (OpenTable-grade)

**Backend**
- Surface `RestaurantAvailability`: `GET /restaurants/{id}/availability?date=&covers=`
  returning bookable `timeSlot` chips with remaining covers.
- Decrement covers transactionally on booking; add `Menu`/`MenuSection` (name, price,
  description) and optional deposit per slot.
- Add `RestaurantReviewSummary` (avg rating + count) to search/detail results from the
  existing `review` module.

**Frontend** (`restaurants` + `restaurant-detail`)
- **Time-slot chip grid** (the signature OpenTable interaction) with party-size + date
  pickers; slot → funnel.
- Menu accordion, photo gallery, rating badge on both card and detail sidebar.
- "Special requests" field captured into the booking.

### 3.4 Cruises depth

**Backend**
- `CruiseCabinCategory` (interior/ocean/balcony/suite) with price + availability per
  cruise; `CruiseItineraryDay` (day, port, arrive/depart, description) replacing the
  freeform string (keep string as fallback). Optional `CruiseExcursion` per port.
- `GET /cruises/{id}/cabins` and day-by-day itinerary in the detail payload.

**Frontend** (`cruises` + `cruise-detail`)
- **Cabin-category selector** (cards with price tier + "X left") → funnel.
- **Day-by-day itinerary timeline** with port stops (map-pin list) instead of a paragraph.
- Excursion add-ons in the configure step.

### 3.5 AI-native differentiators (the moat — do not skip)

- **Itinerary-aware badges**: when a user has an active living itinerary, flag catalog
  results that fit the dates/destination ("Fits your Lisbon trip"). Reuse
  `ai/planning` + the itinerary module.
- **Concierge "book the trip"**: from a detail page, "Ask AI to fit this in" opens the
  concierge, which can assemble flight + restaurant + cruise and push them into the
  reactive itinerary via the existing webhook/event path.
- **Price watch + AI fare insight**: a `priceWatch` subscription per
  flight/cruise route (notify via existing `notification` module) and a concierge-
  generated insight line on the funnel review step.

---

## 4. Implementation phases (sequenced, each independently shippable)

1. **Phase 1 — Unified Booking Funnel + payment wiring + reviews surfaced.**
   Turns every dead-end "Book" button into a real, paid reservation for the *current*
   data model. Biggest perceived-quality jump for least domain work. *(flagship)*
2. **Phase 2 — Restaurants (time-slot grid).** Highest visual "wow per hour"; the
   `RestaurantAvailability` entity already exists.
3. **Phase 3 — Flights depth** (round-trip, fare calendar, filters, fare bundles, seat map).
4. **Phase 4 — Cruises depth** (cabin categories, day-by-day itinerary, excursions).
5. **Phase 5 — AI differentiators** (itinerary-fit badges, concierge book-the-trip, price watch).

Recommend confirming scope after Phase 1 since it alone makes all three verticals
"look like a competitor."

---

## 5. Key files

| File | Operation | Description |
|------|-----------|-------------|
| `web-app/src/app/features/booking-flow/` | Create | New 4-step funnel shell + `BookingDraft` store |
| [booking.service.ts](web-app/src/app/core/services/booking.service.ts) | Modify | Add `createBooking()` + `quote()` |
| [BookingService.java](travel-ai-backend/src/main/java/com/travelai/booking/BookingService.java) | Modify | `PENDING_PAYMENT` flow, payment wiring, quote |
| [PaymentService.java](travel-ai-backend/src/main/java/com/travelai/payment/PaymentService.java) | Modify | Connect to booking confirm/webhook |
| [flight-detail.component.ts](web-app/src/app/features/flight-detail/flight-detail.component.ts) | Modify | Replace `goToPlanner()` with funnel; fare bundles + seat map |
| [restaurant-detail.component.ts](web-app/src/app/features/restaurant-detail/restaurant-detail.component.ts) | Modify | Time-slot grid + menu + reviews → funnel |
| [cruise-detail.component.ts](web-app/src/app/features/cruise-detail/cruise-detail.component.ts) | Modify | Cabin selector + day-by-day itinerary → funnel |
| `catalog/flight`, `catalog/restaurant`, `catalog/cruise` | Modify/Create | New entities (FlightFare, Menu, CruiseCabinCategory, CruiseItineraryDay) + endpoints |
| `db/migration/V36+__*.sql` | Create | Schema + seed for fares/menus/cabins/availability |
| `assets/i18n/{en,es,fr,it}.json` | Modify | New keys in all four bundles (mandatory) |
| [SecurityConfig.java](travel-ai-backend/src/main/java/com/travelai/shared/config/SecurityConfig.java) | Modify | Allow-list any new public `/api/...` read endpoints |

---

## 6. Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Funnel scope creep across 3 verticals at once | Phase 1 ships the shared shell on the *existing* model first; depth lands per-vertical after. |
| Payment integration complexity | A dev/mock `PaymentGateway` already exists; keep instant-confirm behind a flag so tests/dev stay green. |
| Seed-data realism (fares, slots, cabins) | Extend the existing `V31–V35` global-inventory seed style; generate coherent data per existing rows. |
| i18n drift (4 bundles) | Add keys to en/es/fr/it in the same change; CLAUDE.md rule enforces this. |
| Migration ordering | Continue the `V36+` Flyway sequence; never edit applied migrations. |
| Concurrent cover/seat/cabin decrement | Transactional decrement with availability re-check inside `createBooking`. |
| Over-building AI before funnel exists | AI differentiators are Phase 5 — gated on a working funnel. |

---

## 7. Verification

- Backend: `springboot-tdd` for `BookingService` quote/confirm/availability-decrement;
  `springboot-verification` before PR.
- Frontend: funnel step transitions + slot/fare/cabin selection unit tests; Playwright
  E2E for the full "search → configure → confirm" path; visual regression at 375/768/1440.
- Per CLAUDE.md: backend on `:8080`, frontend proxied on `:4200`.

---

## SESSION_ID (for /ccg:execute use)
- CODEX_SESSION: n/a (multi-model wrapper `~/.claude/bin/codeagent-wrapper` not installed — plan synthesized by Claude using built-in tools, the documented fallback)
- GEMINI_SESSION: n/a
