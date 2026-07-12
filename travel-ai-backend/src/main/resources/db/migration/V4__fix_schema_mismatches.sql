-- ============================================================
-- V4 — Fix schema mismatches between entities and DDL
-- ============================================================

-- ─── booking_travelers ───────────────────────────────────────
-- BaseEntity requires created_at + updated_at
-- Entity has is_primary, but DDL had birth_date/document_type instead
ALTER TABLE booking_travelers
    ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS is_primary  BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── travel_requests ─────────────────────────────────────────
-- Entity fields differ from original DDL columns
ALTER TABLE travel_requests
    ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS departure_date DATE,
    ADD COLUMN IF NOT EXISTS return_date    DATE,
    ADD COLUMN IF NOT EXISTS adults_count   INTEGER,
    ADD COLUMN IF NOT EXISTS children_count INTEGER,
    ADD COLUMN IF NOT EXISTS active         BOOLEAN NOT NULL DEFAULT TRUE;

-- budget was INTEGER in DDL, entity uses BigDecimal → needs DECIMAL
ALTER TABLE travel_requests
    ALTER COLUMN budget TYPE DECIMAL(12,2) USING budget::DECIMAL(12,2);

-- ─── waitlist_entries ────────────────────────────────────────
-- Entity has restaurant_id, flight_id, requested_at, notified_at
ALTER TABLE waitlist_entries
    ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id),
    ADD COLUMN IF NOT EXISTS flight_id     UUID REFERENCES flights(id),
    ADD COLUMN IF NOT EXISTS requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS notified_at   TIMESTAMPTZ;

-- ─── payment_webhooks ────────────────────────────────────────
-- BaseEntity requires created_at + updated_at
-- Entity has payment_id, processed_at; payload is TEXT not JSONB
ALTER TABLE payment_webhooks
    ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS payment_id   UUID,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Change payload from JSONB to TEXT to match entity String field
ALTER TABLE payment_webhooks
    ALTER COLUMN payload TYPE TEXT USING payload::TEXT;
