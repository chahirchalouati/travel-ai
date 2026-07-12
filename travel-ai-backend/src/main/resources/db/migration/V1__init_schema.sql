-- ============================================================
-- V1 — Initial Schema
-- Travel AI Backend
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Enums ──────────────────────────────────────────────────
CREATE TYPE user_role        AS ENUM ('TRAVELER', 'PARTNER', 'OPERATIONS', 'ADMIN');
CREATE TYPE partner_type     AS ENUM ('HOTEL', 'RESTAURANT', 'CAR_RENTAL', 'BEACH', 'OTHER');
CREATE TYPE partner_status   AS ENUM ('REGISTERED', 'CONFIGURED', 'VALIDATED', 'LIVE', 'SUSPENDED');
CREATE TYPE booking_status   AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'COMPLETED');
CREATE TYPE payment_status   AS ENUM ('PENDING', 'AUTHORISED', 'CAPTURED', 'FAILED', 'REFUNDED');
CREATE TYPE payment_type     AS ENUM ('FULL', 'INSTALMENT');
CREATE TYPE payment_gateway  AS ENUM ('STRIPE', 'KLARNA', 'PAYPAL');
CREATE TYPE proposal_status  AS ENUM ('GENERATED', 'VIEWED', 'SELECTED', 'BOOKED', 'EXPIRED');
CREATE TYPE spending_priority AS ENUM ('FOOD', 'STAY', 'BALANCED');
CREATE TYPE date_mode        AS ENUM ('FIXED', 'FLEXIBLE');
CREATE TYPE agent_type       AS ENUM ('ORCHESTRATOR', 'HOTEL', 'RESTAURANT', 'FLIGHT', 'RANKING', 'CONCIERGE');

-- ─── Users ──────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    phone           VARCHAR(30),
    role            user_role NOT NULL DEFAULT 'TRAVELER',
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_preferences (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spending_priority spending_priority DEFAULT 'BALANCED',
    constraints      TEXT[],          -- ['sea','pets','accessible','family']
    preferred_budget INTEGER,
    language         VARCHAR(5) DEFAULT 'it',
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Partner Structures ──────────────────────────────────────
CREATE TABLE partners (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    type            partner_type NOT NULL,
    name            VARCHAR(255) NOT NULL,
    vat_number      VARCHAR(50),
    contact_email   VARCHAR(255) NOT NULL,
    contact_phone   VARCHAR(30),
    address         TEXT,
    city            VARCHAR(100),
    country         VARCHAR(3) DEFAULT 'ITA',
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    status          partner_status NOT NULL DEFAULT 'REGISTERED',
    quality_score   DECIMAL(3,2),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Catalog: Hotels ────────────────────────────────────────
CREATE TABLE hotels (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id        UUID NOT NULL REFERENCES partners(id),
    name              VARCHAR(255) NOT NULL,
    stars             SMALLINT CHECK (stars BETWEEN 1 AND 5),
    description       TEXT,
    city              VARCHAR(100),
    latitude          DECIMAL(9,6),
    longitude         DECIMAL(9,6),
    pet_friendly      BOOLEAN DEFAULT FALSE,
    accessible        BOOLEAN DEFAULT FALSE,
    family_friendly   BOOLEAN DEFAULT FALSE,
    sea_proximity     BOOLEAN DEFAULT FALSE,
    image_url         VARCHAR(500),
    base_price_night  DECIMAL(10,2),
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hotel_availability (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    date        DATE NOT NULL,
    rooms_available SMALLINT NOT NULL DEFAULT 0,
    price_night DECIMAL(10,2) NOT NULL,
    UNIQUE (hotel_id, date)
);

-- ─── Catalog: Restaurants ───────────────────────────────────
CREATE TABLE restaurants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id      UUID NOT NULL REFERENCES partners(id),
    name            VARCHAR(255) NOT NULL,
    cuisine_type    VARCHAR(100),
    price_tier      SMALLINT CHECK (price_tier BETWEEN 1 AND 4),
    description     TEXT,
    city            VARCHAR(100),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    pet_friendly    BOOLEAN DEFAULT FALSE,
    accessible      BOOLEAN DEFAULT FALSE,
    image_url       VARCHAR(500),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE restaurant_availability (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id),
    date            DATE NOT NULL,
    time_slot       TIME NOT NULL,
    covers_available SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (restaurant_id, date, time_slot)
);

-- ─── Catalog: Flights ───────────────────────────────────────
CREATE TABLE flights (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airline         VARCHAR(100),
    flight_number   VARCHAR(20),
    origin_iata     VARCHAR(3) NOT NULL,
    dest_iata       VARCHAR(3) NOT NULL,
    departure_at    TIMESTAMPTZ NOT NULL,
    arrival_at      TIMESTAMPTZ NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    seats_available SMALLINT NOT NULL DEFAULT 0,
    baggage_included BOOLEAN DEFAULT FALSE,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Travel Requests ────────────────────────────────────────
CREATE TABLE travel_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    budget          INTEGER NOT NULL,
    date_mode       date_mode NOT NULL DEFAULT 'FLEXIBLE',
    date_from       DATE,
    date_to         DATE,
    flexible_days   SMALLINT DEFAULT 3,
    nights          SMALLINT NOT NULL DEFAULT 4,
    adults          SMALLINT NOT NULL DEFAULT 2,
    children        SMALLINT NOT NULL DEFAULT 0,
    destination     VARCHAR(255),
    spending_priority spending_priority DEFAULT 'BALANCED',
    constraints     TEXT[],
    status          VARCHAR(50) DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Travel Proposals ───────────────────────────────────────
CREATE TABLE travel_proposals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id      UUID NOT NULL REFERENCES travel_requests(id),
    hotel_id        UUID REFERENCES hotels(id),
    restaurant_ids  UUID[],
    flight_id       UUID REFERENCES flights(id),
    total_cost      DECIMAL(10,2) NOT NULL,
    hotel_cost      DECIMAL(10,2),
    food_cost       DECIMAL(10,2),
    transport_cost  DECIMAL(10,2),
    ai_motivation   TEXT,
    relevance_score DECIMAL(5,4),
    recommended     BOOLEAN DEFAULT FALSE,
    status          proposal_status NOT NULL DEFAULT 'GENERATED',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Bookings ───────────────────────────────────────────────
CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    proposal_id     UUID REFERENCES travel_proposals(id),
    status          booking_status NOT NULL DEFAULT 'PENDING',
    external_ref    VARCHAR(255),
    cancellation_policy TEXT,
    booked_at       TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_travelers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    birth_date  DATE,
    document_type VARCHAR(50),
    document_number VARCHAR(50)
);

-- ─── Waitlist ────────────────────────────────────────────────
CREATE TABLE waitlist_entries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    hotel_id        UUID REFERENCES hotels(id),
    date_from       DATE NOT NULL,
    date_to         DATE NOT NULL,
    notified        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Payments ────────────────────────────────────────────────
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES bookings(id),
    gateway             payment_gateway NOT NULL,
    payment_type        payment_type NOT NULL DEFAULT 'FULL',
    amount              DECIMAL(10,2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'EUR',
    gateway_payment_id  VARCHAR(255),
    status              payment_status NOT NULL DEFAULT 'PENDING',
    commission_amount   DECIMAL(10,2),
    commission_pct      DECIMAL(5,2),
    platform_settled    BOOLEAN DEFAULT FALSE,
    partner_paid_out    BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_webhooks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway         payment_gateway NOT NULL,
    event_type      VARCHAR(100),
    payload         JSONB NOT NULL,
    processed       BOOLEAN DEFAULT FALSE,
    received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AI Audit Log ────────────────────────────────────────────
CREATE TABLE ai_audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id      UUID REFERENCES travel_requests(id),
    agent           agent_type NOT NULL,
    input_payload   JSONB,
    output_payload  JSONB,
    duration_ms     INTEGER,
    tokens_used     INTEGER,
    model           VARCHAR(100),
    error           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Feedback ────────────────────────────────────────────
CREATE TABLE user_feedback (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id),
    booking_id  UUID REFERENCES bookings(id),
    rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_travel_requests_user   ON travel_requests(user_id);
CREATE INDEX idx_travel_proposals_req   ON travel_proposals(request_id);
CREATE INDEX idx_bookings_user          ON bookings(user_id);
CREATE INDEX idx_payments_booking       ON payments(booking_id);
CREATE INDEX idx_hotels_city            ON hotels(city);
CREATE INDEX idx_restaurants_city       ON restaurants(city);
CREATE INDEX idx_hotel_availability     ON hotel_availability(hotel_id, date);
CREATE INDEX idx_ai_audit_request       ON ai_audit_logs(request_id);
CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens(user_id);
