-- ============================================================
-- V5 — Fix remaining schema mismatches (entities vs DDL)
-- ============================================================

-- ─── bookings ────────────────────────────────────────────────
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS hotel_id            UUID REFERENCES hotels(id),
    ADD COLUMN IF NOT EXISTS restaurant_id       UUID REFERENCES restaurants(id),
    ADD COLUMN IF NOT EXISTS flight_id           UUID REFERENCES flights(id),
    ADD COLUMN IF NOT EXISTS total_amount        DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS hotel_amount        DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS restaurant_amount   DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS flight_amount       DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS destination         VARCHAR(255),
    ADD COLUMN IF NOT EXISTS check_in            DATE,
    ADD COLUMN IF NOT EXISTS check_out           DATE,
    ADD COLUMN IF NOT EXISTS booking_reference   VARCHAR(50) UNIQUE;

-- ─── travel_proposals ────────────────────────────────────────
ALTER TABLE travel_proposals
    ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS destination      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS restaurant_id    UUID REFERENCES restaurants(id),
    ADD COLUMN IF NOT EXISTS restaurant_cost  DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS flight_cost      DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS rank_score       INTEGER,
    ADD COLUMN IF NOT EXISTS selected         BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS expires_at       TIMESTAMPTZ;

-- ─── payments ────────────────────────────────────────────────
-- Entity field 'type' maps to column 'type', but DDL used 'payment_type'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'payment_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'type'
    ) THEN
        ALTER TABLE payments RENAME COLUMN payment_type TO type;
    END IF;
END $$;

-- Entity field 'gatewayReference' maps to 'gateway_reference', DDL had 'gateway_payment_id'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'gateway_payment_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'gateway_reference'
    ) THEN
        ALTER TABLE payments RENAME COLUMN gateway_payment_id TO gateway_reference;
    END IF;
END $$;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS user_id               UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS gateway_checkout_url  VARCHAR(500),
    ADD COLUMN IF NOT EXISTS paid_at               TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS refunded_at           TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS failure_reason        TEXT;
