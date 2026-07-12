-- ─────────────────────────────────────────────────────────────────────────────
-- V40 — Price watch
--
-- A user's request to be alerted when a watched flight or cruise drops in price.
-- Re-priced periodically by PriceWatchScheduler; a drop fires a PriceDropEvent
-- which the notification module turns into an email.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS price_watch (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    flight_id           UUID,
    cruise_id           UUID,
    label               VARCHAR(255) NOT NULL,
    last_price          NUMERIC(12, 2) NOT NULL,
    target_price        NUMERIC(12, 2),
    last_notified_price NUMERIC(12, 2),
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_watch_user ON price_watch(user_id);
CREATE INDEX IF NOT EXISTS idx_price_watch_active ON price_watch(active);
