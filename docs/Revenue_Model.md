# Travel AI — Revenue Model

_Last updated: 2026-07-02 · migrations V51–V53_

This document describes how Travel AI monetises, mapped to the code that implements
each stream. It is the reference for the three revenue features shipped together:
**ancillary services**, **Travel AI Prime (subscriptions)**, and **commission /
markup + revenue reporting**.

---

## 1. The revenue streams

Travel AI is an **OTA** (it sells the trip directly), not a meta-search. Its income
streams, in order of typical margin:

| Stream | What it is | Where it's recorded |
|--------|-----------|---------------------|
| **Commission / markup** | Margin between the supplier net price and the sell price | `bookings.commission_amount` |
| **Ancillary sales** | Paid add-ons at checkout (insurance, baggage, seat, …) | `bookings.ancillary_amount` + `booking_ancillary` |
| **Service fee** | Platform fee charged on a booking (waived for Prime) | `bookings.service_fee_amount` |
| **Subscriptions** | Travel AI Prime recurring membership | `user_subscription.price_paid` |

`bookings.total_amount` is **gross booking value** (what the customer paid) — it is
_not_ platform revenue. Platform revenue = commission + ancillary + service fee +
subscription.

---

## 2. Feature 1 — Ancillary services (V51)

Optional paid extras sold in the booking funnel. The catalogue is
**server-authoritative**: the client may only pick a `code` and quantity; prices are
resolved server-side, so a stale or tampered client can never change the price or
reference a retired add-on.

**Backend** (`com.travelai.ancillary`)
- `ancillary_option` — sellable catalogue. A `NULL` vertical means "all verticals".
  Seeded: `INSURANCE`, `TRANSFER` (all), `BAGGAGE`, `SEAT`, `PRIORITY` (flight),
  `EXCURSION` (cruise), `WINE` (restaurant).
- `AncillaryService.listForVertical(vertical)` — options for a vertical + the
  vertical-agnostic ones.
- `AncillaryService.resolve(selections)` — prices client selections against the
  catalogue; unknown/inactive codes are skipped, quantity clamped to `[1, 20]`.
- `AncillaryController` — `GET /api/catalog/ancillaries?vertical=` (public; mounted
  under the already allow-listed `/api/catalog`).
- `booking_ancillary` — one priced line item per purchased add-on (snapshotted at
  purchase, so later catalogue changes never rewrite history).
- `BookingService.createBooking` resolves the selections, persists the line items,
  and sets `bookings.ancillary_amount`.

**Frontend**
- `core/services/ancillary.service.ts` — `list(vertical)`.
- `BookingDraftService` — `ancillaryOptions` / `selectedAncillaries` signals,
  `ancillaryTotal` computed (added into `total()`), `toRequest()` emits
  `ancillaries: [{ code, quantity: 1 }]`.
- Add-on selector rendered in the funnel **Review** step; a summary line shows the
  add-on total. i18n under `booking.flow.ancillaries.*`.

---

## 3. Feature 2 — Travel AI Prime (V52)

A paid membership that **waives the 6% service fee** and grants a **members-only
discount** (5%). Recurring-revenue tier. Payment is simulated (consistent with the
rest of the platform): subscribing activates immediately and records the price paid.

**Backend** (`com.travelai.subscription`)
- `subscription_plan` — sellable plans (server-authoritative price + benefits).
  Seeded: `PRIME` — €39/ANNUAL, `service_fee_waived = true`, `member_discount_pct = 5`.
- `user_subscription` — a user's membership; at most one `ACTIVE` row at a time.
- `SubscriptionService` — `plans()`, `membership(email)`, `subscribe(email, code)`
  (cancels any existing active membership first, so it also covers plan switches),
  `cancel(email)`.
- `SubscriptionController`
  - `GET /api/subscriptions/plans` — public (allow-listed in `SecurityConfig`).
  - `GET /api/subscriptions/me`, `POST /api/subscriptions/subscribe`,
    `POST /api/subscriptions/cancel` — authenticated.

**Frontend**
- `core/services/subscription.service.ts` — caches the membership in a signal;
  `isPrimeActive` computed.
- `/membership` page (`features/membership`) — Prime landing + subscribe/cancel.
- `BookingDraftService` — `primeActive` / `memberDiscountPct` signals; `serviceFee`
  computes to 0 when Prime is active; `memberDiscount` computed and subtracted in
  `total()`.
- The funnel loads the membership on init and applies the benefits; the price rail
  shows "Included with Prime" and the member-discount line.
- Entry point: "Travel AI Prime" item in the user menu. i18n under `membership.*`.

---

## 4. Feature 3 — Commission / markup + revenue reporting (V53)

Records the platform's real margin on every booking, so revenue is measurable.

**Catalog net pricing**
- `net_price` added to `flights`, `cruises`, `hotels` (the supplier cost). Seeded at
  85% of the current sell price → a measurable 15% margin.
- The markup margin = `sell − net`; the commission on a booking =
  `vertical_sell_amount × (sell − net) / sell`, computed per catalogue item so it is
  correct regardless of fare/cabin multipliers. Restaurants carry no per-unit net
  price and contribute 0.

**Per-booking revenue snapshot** (`BookingService.applyRevenueSnapshot`)
- `bookings.commission_amount` — summed markup across the booked verticals.
- `bookings.service_fee_amount` — the fee actually charged: `6% × sell base`, or 0
  when the user has an active Prime membership (checked server-side, not trusted
  from the client).
- `bookings.ancillary_amount` — from Feature 1.
- Best-effort: missing catalogue data yields a zero contribution rather than failing
  the booking.

**Reporting** (`com.travelai.revenue`)
- `RevenueService.summary()` aggregates confirmed-booking revenue
  (`BookingRepository.aggregateByStatus`) + active-subscription revenue
  (`UserSubscriptionRepository.sumPricePaidByStatus`).
- `GET /api/admin/revenue/summary` — `@PreAuthorize("hasRole('ADMIN')")`.
- Frontend: `/admin/revenue` dashboard (`features/admin-revenue`, behind
  `adminGuard`) — total platform revenue headline, a proportional revenue-mix bar,
  and per-stream breakdown cards. i18n under `adminRevenue.*`.

---

## 5. Pricing constants (single source of truth)

| Constant | Value | Location |
|----------|-------|----------|
| Service fee rate | 6% | `booking-draft.service.ts` `SERVICE_FEE_RATE`; backend `BookingService.SERVICE_FEE_RATE` |
| Prime price | €39 / year | seed in `V52` |
| Prime member discount | 5% | seed in `V52` (`member_discount_pct`) |
| Seed supplier margin | 15% (net = 85% of sell) | `V53` backfill |
| Ancillary quantity clamp | 1–20 | `AncillaryService.MAX_QUANTITY` |

> The service-fee rate is defined in two places (client for display, server for the
> authoritative snapshot). If it changes, update both.

---

## 6. Tests

- `AncillaryServiceTest` — vertical filtering, server-authoritative pricing,
  unknown/inactive skipping, quantity clamping.
- `SubscriptionServiceTest` — inactive-by-default, activation, plan switch,
  unknown plan, cancel-with-no-active.
- `RevenueServiceTest` — stream aggregation into the platform total, null handling.

Frontend verified via `ng build` (template type-checking included).

---

## 7. Deployment note

The running backend reads a **Supabase** database (env-overridden `DB_HOST`/`DB_NAME`),
not the local docker Postgres. Migrations **V51–V53** apply on the next backend boot
against that database — a full restart is required before the new endpoints return
seeded data. Verify live via the API/UI with real ids (not `docker exec psql`).

Live end-to-end checklist after restart:
1. `GET /api/catalog/ancillaries?vertical=flight` → returns INSURANCE/TRANSFER/BAGGAGE/SEAT/PRIORITY.
2. `GET /api/subscriptions/plans` → returns PRIME. Subscribe, then confirm the funnel
   waives the fee and shows the member discount.
3. Create a confirmed booking, then `GET /api/admin/revenue/summary` (as ADMIN) →
   non-zero commission + service-fee + ancillary totals.
