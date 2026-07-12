-- =============================================================================
-- V11: Mock review data for hotels and restaurants
-- =============================================================================

-- Insert reviews for existing hotels (using first user from users table)
-- We reference hotels and restaurants by subquery since UUIDs are generated

INSERT INTO reviews (user_id, target_type, target_id, rating, title, content, helpful_count, verified, created_at, updated_at)
SELECT
    u.id,
    'HOTEL',
    h.id,
    rating_val,
    title_val,
    content_val,
    helpful_val,
    TRUE,
    now() - (random() * INTERVAL '90 days'),
    now() - (random() * INTERVAL '90 days')
FROM users u
CROSS JOIN LATERAL (
    SELECT h.id, v.*
    FROM hotels h,
    LATERAL (VALUES
        (5, 'Absolutely stunning!', 'One of the best hotel experiences I have ever had. The staff went above and beyond to make our stay memorable. The room was immaculate and the views were breathtaking.', 12),
        (4, 'Great location, minor issues', 'Perfect location for exploring the city. Room was comfortable and clean. Only minor issue was the noise from the street at night, but earplugs solved that.', 8),
        (3, 'Decent but overpriced', 'The hotel is fine for what it is, but I expected more given the price point. Breakfast was good, rooms are a bit dated but clean.', 5),
        (4, 'Would definitely return', 'Lovely boutique hotel with character. The rooftop terrace is a hidden gem. Staff remembered our names from day one. Highly recommend.', 15),
        (5, 'Perfect honeymoon spot', 'We chose this hotel for our honeymoon and it exceeded all expectations. The spa, the restaurant, the room - everything was world-class.', 22)
    ) AS v(rating_val, title_val, content_val, helpful_val)
    LIMIT 5
) AS h(id, rating_val, title_val, content_val, helpful_val)
WHERE u.role = 'TRAVELER'
LIMIT 15;

-- Insert reviews for restaurants
INSERT INTO reviews (user_id, target_type, target_id, rating, title, content, helpful_count, verified, created_at, updated_at)
SELECT
    u.id,
    'RESTAURANT',
    r.id,
    rating_val,
    title_val,
    content_val,
    helpful_val,
    TRUE,
    now() - (random() * INTERVAL '60 days'),
    now() - (random() * INTERVAL '60 days')
FROM users u
CROSS JOIN LATERAL (
    SELECT r.id, v.*
    FROM restaurants r,
    LATERAL (VALUES
        (5, 'Best meal of my life', 'The tasting menu was an extraordinary culinary journey. Each dish was a work of art. The wine pairing was expertly curated. Worth every penny.', 18),
        (4, 'Authentic and delicious', 'Real local cuisine at its finest. The pasta was handmade and you could taste the difference. Cozy atmosphere and friendly service.', 10),
        (3, 'Good food, slow service', 'The food itself was quite good, especially the seafood. However, we waited 45 minutes for our main course. Would try again at a less busy time.', 7),
        (5, 'A hidden gem!', 'Found this place by accident and it turned out to be the highlight of our trip. The chef came out to greet us and recommended the daily special. Unforgettable.', 25),
        (4, 'Great atmosphere', 'Beautiful setting with candlelit tables on a terrace overlooking the old town. Food was solid Italian, desserts were outstanding.', 13)
    ) AS v(rating_val, title_val, content_val, helpful_val)
    LIMIT 5
) AS r(id, rating_val, title_val, content_val, helpful_val)
WHERE u.role = 'TRAVELER'
LIMIT 15;
