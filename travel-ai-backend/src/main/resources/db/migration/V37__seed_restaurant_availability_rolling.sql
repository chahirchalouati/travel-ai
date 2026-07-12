-- ─────────────────────────────────────────────────────────────────────────────
-- V37 — Rolling restaurant availability
--
-- Earlier seeds (V3/V16/V31) inserted availability for fixed past dates, so a live
-- "tables for <today>" lookup returns nothing. Generate a rolling 30-day window of
-- bookable slots for every active restaurant starting at the date this migration
-- runs, so the reservation grid always has real, future availability.
--
-- Lunch + dinner services, every 30 minutes. Covers per slot vary deterministically
-- so the grid looks lived-in (some slots tighter than others). ON CONFLICT keeps the
-- UNIQUE(restaurant_id, date, time_slot) constraint happy if a slot already exists.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO restaurant_availability (id, restaurant_id, date, time_slot, covers_available)
SELECT
    uuid_generate_v4(),
    r.id,
    d::date,
    slot.t,
    -- 4..16 covers, deterministic per (restaurant, day, slot)
    (4 + ((('x' || substr(md5(r.id::text || d::text || slot.t::text), 1, 8))::bit(32)::int) % 13 + 13) % 13)::smallint
FROM restaurants r
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '29 days', INTERVAL '1 day') AS d
CROSS JOIN (VALUES
    (TIME '12:00'), (TIME '12:30'), (TIME '13:00'), (TIME '13:30'), (TIME '14:00'),
    (TIME '19:00'), (TIME '19:30'), (TIME '20:00'), (TIME '20:30'), (TIME '21:00'), (TIME '21:30')
) AS slot(t)
WHERE r.active = true
ON CONFLICT (restaurant_id, date, time_slot) DO NOTHING;
