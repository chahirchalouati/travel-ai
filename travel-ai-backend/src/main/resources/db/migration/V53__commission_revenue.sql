-- =============================================================================
-- V53: Commission / markup pricing + per-booking revenue snapshot
-- Records the platform's real margin on every booking so revenue is measurable:
--   net_price on catalog items  = what the supplier is paid (cost).
--     The markup margin = (sell price - net_price) is the platform's commission.
--   bookings.commission_amount  = markup captured on this booking.
--   bookings.service_fee_amount = platform fee actually charged (0 for Prime).
--     (ancillary_amount was added in V51.)
-- Seed net prices at 85% of the current sell price → a measurable 15% margin.
-- =============================================================================

ALTER TABLE flights ADD COLUMN net_price NUMERIC(12,2);
ALTER TABLE cruises ADD COLUMN net_price NUMERIC(12,2);
ALTER TABLE hotels  ADD COLUMN net_price NUMERIC(12,2);

UPDATE flights SET net_price = ROUND(price * 0.85, 2)             WHERE price IS NOT NULL;
UPDATE cruises SET net_price = ROUND(price_per_person * 0.85, 2)  WHERE price_per_person IS NOT NULL;
UPDATE hotels  SET net_price = ROUND(base_price_night * 0.85, 2)  WHERE base_price_night IS NOT NULL;

ALTER TABLE bookings ADD COLUMN service_fee_amount NUMERIC(12,2);
ALTER TABLE bookings ADD COLUMN commission_amount  NUMERIC(12,2);
