-- ─────────────────────────────────────────────────────────────────────────────
-- V36 — Standalone vertical bookings
--
-- The booking funnel can now book a single flight, restaurant or cruise on its
-- own (not only AI-proposal hotel trips). Add a cruise reference + amount and the
-- vertical-specific configuration the funnel captures (fare class, reserved time
-- slot, cabin category, party size). All nullable so existing rows are unaffected.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cruise_id      UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cruise_amount  NUMERIC(12, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fare_class     VARCHAR(32);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_slot      VARCHAR(16);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cabin_category VARCHAR(32);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS party_size     INTEGER;
