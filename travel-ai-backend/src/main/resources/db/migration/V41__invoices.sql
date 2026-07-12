-- ─────────────────────────────────────────────────────────────────────────────
-- V41 — Invoices
--
-- A proper invoice (progressive number + 22% VAT breakdown) issued per booking,
-- or consolidated per trip group. `trip_group_id` tags bookings created together
-- in one bundle checkout so they can share a single consolidated invoice.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trip_group_id UUID;

CREATE TABLE IF NOT EXISTS invoice (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number         VARCHAR(32) NOT NULL UNIQUE,
    booking_id     UUID,
    trip_group_id  UUID,
    user_id        UUID NOT NULL REFERENCES users(id),
    net_amount     NUMERIC(12, 2) NOT NULL,
    vat_amount     NUMERIC(12, 2) NOT NULL,
    gross_amount   NUMERIC(12, 2) NOT NULL,
    vat_rate       NUMERIC(4, 3) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_booking ON invoice(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoice_trip ON invoice(trip_group_id);
