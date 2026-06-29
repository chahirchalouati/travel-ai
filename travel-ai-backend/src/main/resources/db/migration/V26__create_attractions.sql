-- =============================================================================
-- V26: Attractions / Things-to-Do
-- TripAdvisor-parity content category: landmarks, museums, tours, activities.
-- Reviewable via the existing review domain (target_type = 'ATTRACTION').
-- =============================================================================

CREATE TABLE attractions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(255)   NOT NULL,
    category         VARCHAR(60)    NOT NULL,   -- LANDMARK | MUSEUM | PARK | TOUR | ACTIVITY | NATURE | NIGHTLIFE | SHOPPING | FOOD | BEACH
    city             VARCHAR(255)   NOT NULL,
    country          VARCHAR(255),
    description      TEXT,
    image_url        VARCHAR(1024),
    latitude         NUMERIC(10,7),
    longitude        NUMERIC(10,7),
    price_level      VARCHAR(20)    NOT NULL DEFAULT 'FREE',  -- FREE | LOW | MEDIUM | HIGH
    base_price       NUMERIC(10,2),               -- set when bookable (tours/activities)
    duration_minutes INT,
    bookable         BOOLEAN        NOT NULL DEFAULT FALSE,
    tags             VARCHAR(512),
    popularity_score INT            NOT NULL DEFAULT 0,
    featured         BOOLEAN        NOT NULL DEFAULT FALSE,
    active           BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_attractions_city     ON attractions (LOWER(city));
CREATE INDEX idx_attractions_category ON attractions (category);
CREATE INDEX idx_attractions_active   ON attractions (active);

-- ---------------------------------------------------------------------------
-- Seed content so the category is populated on first run.
-- ---------------------------------------------------------------------------
INSERT INTO attractions
    (name, category, city, country, description, image_url, latitude, longitude,
     price_level, base_price, duration_minutes, bookable, tags, popularity_score, featured)
VALUES
    ('Colosseum', 'LANDMARK', 'Rome', 'Italy',
     'The largest ancient amphitheatre ever built, an icon of Imperial Rome and a UNESCO World Heritage Site.',
     'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
     41.8902, 12.4922, 'MEDIUM', 18.00, 90, true, 'history,unesco,iconic', 98, true),

    ('Vatican Museums & Sistine Chapel', 'MUSEUM', 'Rome', 'Italy',
     'One of the world''s greatest art collections, culminating in Michelangelo''s Sistine Chapel ceiling.',
     'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=1200&q=80',
     41.9065, 12.4536, 'HIGH', 35.00, 180, true, 'art,history,unesco', 95, true),

    ('Trevi Fountain', 'LANDMARK', 'Rome', 'Italy',
     'The most famous Baroque fountain in the world — toss a coin to ensure your return to Rome.',
     'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1200&q=80',
     41.9009, 12.4833, 'FREE', NULL, 30, false, 'iconic,free,romantic', 92, false),

    ('Eiffel Tower Summit Tour', 'TOUR', 'Paris', 'France',
     'Skip-the-line guided ascent to the summit of Paris''s wrought-iron icon with panoramic city views.',
     'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=1200&q=80',
     48.8584, 2.2945, 'HIGH', 69.00, 120, true, 'iconic,views,guided', 99, true),

    ('Louvre Museum', 'MUSEUM', 'Paris', 'France',
     'The world''s most-visited museum, home to the Mona Lisa and tens of thousands of works of art.',
     'https://images.unsplash.com/photo-1565099824688-e93eb20fe622?w=1200&q=80',
     48.8606, 2.3376, 'MEDIUM', 22.00, 180, true, 'art,history,iconic', 97, true),

    ('Seine River Evening Cruise', 'ACTIVITY', 'Paris', 'France',
     'Glide past illuminated landmarks on a relaxed sightseeing cruise along the Seine at dusk.',
     'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80',
     48.8566, 2.3522, 'LOW', 16.00, 60, true, 'romantic,relaxed,views', 88, false),

    ('Sagrada Família', 'LANDMARK', 'Barcelona', 'Spain',
     'Gaudí''s breathtaking, still-unfinished basilica — a singular masterpiece of Catalan Modernism.',
     'https://images.unsplash.com/photo-1583779457094-ab6f9164a1c8?w=1200&q=80',
     41.4036, 2.1744, 'MEDIUM', 26.00, 90, true, 'architecture,unesco,iconic', 96, true),

    ('Park Güell', 'PARK', 'Barcelona', 'Spain',
     'A whimsical public park of mosaic terraces and organic forms designed by Antoni Gaudí.',
     'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=1200&q=80',
     41.4145, 2.1527, 'LOW', 10.00, 90, true, 'architecture,nature,views', 90, false),

    ('Senso-ji Temple', 'LANDMARK', 'Tokyo', 'Japan',
     'Tokyo''s oldest temple, approached through the lively Nakamise shopping street in Asakusa.',
     'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=80',
     35.7148, 139.7967, 'FREE', NULL, 60, false, 'culture,free,iconic', 91, false),

    ('teamLab Planets Tokyo', 'ACTIVITY', 'Tokyo', 'Japan',
     'An immersive digital-art museum where you wade through water and walk among infinite light.',
     'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=1200&q=80',
     35.6495, 139.7900, 'MEDIUM', 24.00, 120, true, 'art,immersive,modern', 89, true);
