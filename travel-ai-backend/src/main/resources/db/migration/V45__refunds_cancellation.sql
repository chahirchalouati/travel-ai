-- ─────────────────────────────────────────────────────────────────────────────
-- V45 — Self-service cancellation refunds
--
-- One row per refund issued when a user cancels a booking. The amount follows
-- the cancellation policy (100% ≥7 days before check-in, 50% between 2 and 7
-- days, 0% under 2 days). The gateway is simulated so refunds are PROCESSED
-- immediately; `payment_id` links back to the charged payment.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refund (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id     UUID NOT NULL REFERENCES bookings(id),
    payment_id     UUID REFERENCES payments(id),
    amount         NUMERIC(12, 2) NOT NULL,
    refund_percent INT NOT NULL,
    status         VARCHAR(20) NOT NULL,
    reason         TEXT,
    processed_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_booking ON refund(booking_id);
CREATE INDEX IF NOT EXISTS idx_refund_payment ON refund(payment_id);
