-- ─────────────────────────────────────────────────────────────────────────────
-- V38 — Cruise cabin categories + day-by-day itinerary
--
-- Adds real bookable cabin tiers (Interior / Ocean View / Balcony / Suite) priced
-- as multiples of the cruise's per-person base, and a generated day-by-day
-- itinerary (embarkation → sea/port days → disembarkation) so the cruise detail
-- page can show a proper timeline instead of a freeform paragraph.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cruise_cabin_category (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cruise_id        UUID NOT NULL REFERENCES cruises(id) ON DELETE CASCADE,
    name             VARCHAR(64) NOT NULL,
    description      VARCHAR(255),
    price_multiplier NUMERIC(4, 2) NOT NULL,
    cabins_available INTEGER NOT NULL DEFAULT 0,
    sort_order       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cabin_cruise ON cruise_cabin_category(cruise_id);

CREATE TABLE IF NOT EXISTS cruise_itinerary_day (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cruise_id   UUID NOT NULL REFERENCES cruises(id) ON DELETE CASCADE,
    day_number  INTEGER NOT NULL,
    port        VARCHAR(120) NOT NULL,
    description TEXT
);
CREATE INDEX IF NOT EXISTS idx_itinday_cruise ON cruise_itinerary_day(cruise_id);

-- Seed four cabin tiers per cruise, splitting the cruise's overall cabin pool.
INSERT INTO cruise_cabin_category (cruise_id, name, description, price_multiplier, cabins_available, sort_order)
SELECT c.id, t.name, t.descr, t.mult,
       GREATEST(1, (c.cabins_available * t.share / 100))::int, t.ord
FROM cruises c
CROSS JOIN (VALUES
    ('Interior',   'Cosy interior cabin, no window',           1.00, 40, 1),
    ('Ocean View', 'Window with sea view',                     1.25, 30, 2),
    ('Balcony',    'Private balcony to watch the horizon',     1.55, 20, 3),
    ('Suite',      'Spacious suite with premium perks',        2.20, 10, 4)
) AS t(name, descr, mult, share, ord)
WHERE c.active = true
  AND NOT EXISTS (SELECT 1 FROM cruise_cabin_category cc WHERE cc.cruise_id = c.id);

-- Generate a day-by-day itinerary: day 1 embarkation at the departure port, the
-- final day disembarkation at the arrival port, the rest as relaxed sea days.
INSERT INTO cruise_itinerary_day (cruise_id, day_number, port, description)
SELECT c.id,
       gs.n,
       CASE
           WHEN gs.n = 1 THEN c.departure_port
           WHEN gs.n = GREATEST(c.duration_nights + 1, 1) THEN COALESCE(c.arrival_port, c.departure_port)
           ELSE 'At sea'
       END,
       CASE
           WHEN gs.n = 1 THEN 'Embarkation and welcome aboard at ' || c.departure_port || '.'
           WHEN gs.n = GREATEST(c.duration_nights + 1, 1) THEN 'Disembarkation at ' || COALESCE(c.arrival_port, c.departure_port) || '.'
           ELSE 'A relaxed day at sea — enjoy the ship''s amenities.'
       END
FROM cruises c
CROSS JOIN LATERAL generate_series(1, GREATEST(c.duration_nights + 1, 2)) AS gs(n)
WHERE c.active = true
  AND NOT EXISTS (SELECT 1 FROM cruise_itinerary_day ci WHERE ci.cruise_id = c.id);
