-- =============================================================================
-- V32: Add DEPTH to the global content seeded in V31
-- -----------------------------------------------------------------------------
-- V31 gave every destination bookable inventory + a starter review/forum thread.
-- This migration fills out the social/editorial surfaces so the catalog feels
-- lived-in everywhere:
--   travel_stories        one cinematic story card per destination
--   reviews               restaurants + attractions + cruises (with sub-ratings)
--   review sub-ratings    backfilled on every hotel/restaurant/cruise review
--   review_helpful_votes  a few genuine votes per new review
--   forum_answers         two extra answers per destination question (3 total)
--
-- Same conventions as V31: set-based, deterministic md5()::uuid keys, and
-- ON CONFLICT guards so it is safe against pre-existing seed rows.
-- =============================================================================

-- ── 1. Travel stories — one per destination ──────────────────────────────────
INSERT INTO travel_stories (id, place, country, tag, minutes, poster_url, video_url, featured, sort_order, active, created_at)
SELECT md5('story-' || d.id::text)::uuid,
       d.name, d.country,
       initcap(split_part(d.tags, ',', 1)),
       3 + (d.popularity_score % 8),
       d.image_url, NULL, d.featured, d.popularity_score, true, now()
FROM destinations d
WHERE d.active = true
  AND NOT EXISTS (SELECT 1 FROM travel_stories ts WHERE ts.place = d.name);

-- ── 2. Restaurant reviews (2 per new restaurant, with sub-ratings) ───────────
INSERT INTO reviews (id, user_id, target_type, target_id, rating, title, content, helpful_count, verified,
                     rating_service, rating_value, rating_cleanliness, rating_location, created_at)
SELECT md5('rev-r-' || rt.n || '-' || rs.id::text)::uuid, u.id, 'RESTAURANT', rs.id,
       rt.rating, rt.title, rt.content, rt.helpful, true,
       LEAST(5, GREATEST(1, rt.rating)),
       LEAST(5, GREATEST(1, rt.rating - 1)),
       LEAST(5, GREATEST(1, rt.rating)),
       LEAST(5, GREATEST(1, rt.rating)),
       now() - (rt.days_ago || ' days')::interval
FROM restaurants rs
CROSS JOIN (VALUES
  (1, 5, 'Best meal of the trip', 'Outstanding flavours and warm service. Book ahead — it fills up fast.', 11, 6),
  (2, 4, 'Delicious and authentic', 'Generous portions, fair prices and a genuinely local crowd.', 5, 18)
) AS rt(n, rating, title, content, helpful, days_ago)
JOIN LATERAL (
  SELECT id FROM users WHERE role = 'TRAVELER'
  ORDER BY md5(id::text || rs.id::text) LIMIT 1 OFFSET (rt.n - 1)
) u ON true
WHERE rs.partner_id IN (SELECT md5('p-rest-' || d.id::text)::uuid FROM destinations d)
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- ── 3. Attraction reviews (2 per new attraction) ─────────────────────────────
INSERT INTO reviews (id, user_id, target_type, target_id, rating, title, content, helpful_count, verified, created_at)
SELECT md5('rev-a-' || rt.n || '-' || at.id::text)::uuid, u.id, 'ATTRACTION', at.id,
       rt.rating, rt.title, rt.content, rt.helpful, true,
       now() - (rt.days_ago || ' days')::interval
FROM attractions at
CROSS JOIN (VALUES
  (1, 5, 'Absolutely worth it', 'A highlight of the whole trip. Go early to beat the crowds.', 13, 7),
  (2, 4, 'Great experience', 'Well organised and good value. Allow more time than you think.', 4, 20)
) AS rt(n, rating, title, content, helpful, days_ago)
JOIN LATERAL (
  SELECT id FROM users WHERE role = 'TRAVELER'
  ORDER BY md5(id::text || at.id::text) LIMIT 1 OFFSET (rt.n - 1)
) u ON true
WHERE at.id IN (
  SELECT md5('attr-' || s.slug || '-' || d.id::text)::uuid
  FROM destinations d CROSS JOIN (VALUES ('landmark'), ('museum'), ('foodtour'), ('nature')) s(slug)
)
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- ── 4. Cruise reviews (2 per cruise, all cruises) ────────────────────────────
INSERT INTO reviews (id, user_id, target_type, target_id, rating, title, content, helpful_count, verified,
                     rating_service, rating_value, rating_cleanliness, rating_location, created_at)
SELECT md5('rev-c-' || rt.n || '-' || c.id::text)::uuid, u.id, 'CRUISE', c.id,
       rt.rating, rt.title, rt.content, rt.helpful, true,
       LEAST(5, GREATEST(1, rt.rating)),
       LEAST(5, GREATEST(1, rt.rating - 1)),
       LEAST(5, GREATEST(1, rt.rating)),
       5,
       now() - (rt.days_ago || ' days')::interval
FROM cruises c
CROSS JOIN (VALUES
  (1, 5, 'Trip of a lifetime', 'Flawless itinerary, attentive crew and unforgettable scenery.', 16, 9),
  (2, 4, 'Excellent value', 'Great ports and food. Cabins are compact but comfortable.', 6, 25)
) AS rt(n, rating, title, content, helpful, days_ago)
JOIN LATERAL (
  SELECT id FROM users WHERE role = 'TRAVELER'
  ORDER BY md5(id::text || c.id::text) LIMIT 1 OFFSET (rt.n - 1)
) u ON true
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- ── 5. Backfill sub-ratings on any hotel/restaurant/cruise review missing them ─
UPDATE reviews
SET rating_service     = LEAST(5, GREATEST(1, rating)),
    rating_value       = LEAST(5, GREATEST(1, rating - (CASE WHEN length(coalesce(content,'')) % 2 = 0 THEN 0 ELSE 1 END))),
    rating_cleanliness = LEAST(5, GREATEST(1, rating)),
    rating_location    = LEAST(5, GREATEST(1, rating + (CASE WHEN length(coalesce(title,'')) % 2 = 0 THEN 0 ELSE -1 END)))
WHERE rating_service IS NULL
  AND target_type IN ('HOTEL', 'RESTAURANT', 'CRUISE');

-- ── 6. Helpful votes for the new restaurant / attraction / cruise reviews ─────
INSERT INTO review_helpful_votes (id, review_id, user_id)
SELECT uuid_generate_v4(), r.id, u.id
FROM reviews r
JOIN LATERAL (
  SELECT id FROM users WHERE role = 'TRAVELER' AND id <> r.user_id
  ORDER BY md5(id::text || r.id::text) LIMIT 3
) u ON true
WHERE r.id IN (
  SELECT md5('rev-r-' || v.n || '-' || rs.id::text)::uuid
  FROM restaurants rs CROSS JOIN (VALUES (1), (2)) v(n)
  WHERE rs.partner_id IN (SELECT md5('p-rest-' || d.id::text)::uuid FROM destinations d)
  UNION ALL
  SELECT md5('rev-a-' || v.n || '-' || at.id::text)::uuid
  FROM attractions at CROSS JOIN (VALUES (1), (2)) v(n)
  WHERE at.id IN (SELECT md5('attr-' || s.slug || '-' || d.id::text)::uuid
                  FROM destinations d CROSS JOIN (VALUES ('landmark'), ('museum'), ('foodtour'), ('nature')) s(slug))
  UNION ALL
  SELECT md5('rev-c-' || v.n || '-' || c.id::text)::uuid
  FROM cruises c CROSS JOIN (VALUES (1), (2)) v(n)
)
ON CONFLICT (review_id, user_id) DO NOTHING;

-- ── 7. Two extra answers per destination question → 3-deep threads ───────────
INSERT INTO forum_answers (id, question_id, author_id, author_name, body, helpful_count, accepted, created_at)
SELECT md5('fa2-' || d.id::text)::uuid, md5('fq-' || d.id::text)::uuid,
       u.id, u.first_name || ' ' || u.last_name,
       'Don''t skip the day trips around ' || d.name ||
       ' — that''s where we had our favourite moments. Pack layers, the evenings can surprise you.',
       5, false, now() - INTERVAL '8 days'
FROM destinations d
JOIN LATERAL (
  SELECT id, first_name, last_name FROM users WHERE role = 'TRAVELER'
  ORDER BY md5('b' || id::text || d.id::text) LIMIT 1
) u ON true
WHERE d.active = true
  AND EXISTS (SELECT 1 FROM forum_questions q WHERE q.id = md5('fq-' || d.id::text)::uuid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO forum_answers (id, question_id, author_id, author_name, body, helpful_count, accepted, created_at)
SELECT md5('fa3-' || d.id::text)::uuid, md5('fq-' || d.id::text)::uuid,
       u.id, u.first_name || ' ' || u.last_name,
       'Budget tip for ' || d.name || ': book accommodation a couple of streets back from the main sights — '
       || 'same neighbourhood, much better prices, and you eat where the locals eat.',
       7, false, now() - INTERVAL '6 days'
FROM destinations d
JOIN LATERAL (
  SELECT id, first_name, last_name FROM users WHERE role = 'TRAVELER'
  ORDER BY md5('c' || id::text || d.id::text) LIMIT 1
) u ON true
WHERE d.active = true
  AND EXISTS (SELECT 1 FROM forum_questions q WHERE q.id = md5('fq-' || d.id::text)::uuid)
ON CONFLICT (id) DO NOTHING;

UPDATE forum_questions
SET answer_count = (SELECT count(*) FROM forum_answers a WHERE a.question_id = forum_questions.id)
WHERE id IN (SELECT md5('fq-' || d.id::text)::uuid FROM destinations d);
