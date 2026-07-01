-- =============================================================================
-- V31: Seed bookable + social content for EVERY destination
-- -----------------------------------------------------------------------------
-- V15/V16 covered Italy and V30 covered 8 international cities, leaving ~36 of
-- the 52 rows in `destinations` with no hotels, restaurants, attractions,
-- reviews or forum activity. The AI planner (geo-diversity) and the catalog can
-- therefore never surface most of the world.
--
-- This migration is fully SET-BASED: it derives content directly from the
-- `destinations` table so all 52 destinations are covered at once, using their
-- real latitude/longitude/country/cost. Primary keys are deterministic
-- (md5('<prefix>-' || destination_id)::uuid) so the data is stable and free of
-- collisions with the hand-written e0000005.../e0000006... seeds.
--
-- Volume (per request: maximum coverage):
--   partners            104  (1 hotel + 1 restaurant partner per destination)
--   hotels              156  (budget / boutique / luxury per destination)
--   hotel_availability  ~18k (120 days per new hotel)
--   restaurants         156  (local / street-food / fine-dining per destination)
--   restaurant_availab. ~18k (lunch + dinner, 60 days per new restaurant)
--   attractions         208  (landmark / museum / food tour / nature per dest)
--   reviews             ~420 (hotels + destinations)
--   forum Q/A           52 + 52
--   flights             ~600 (FCO/LHR/JFK <-> every destination, both ways)
--   cruises             +24  (world regions beyond V19's Mediterranean focus)
-- =============================================================================

-- ── 1. Partners (1 HOTEL + 1 RESTAURANT group per destination) ───────────────
INSERT INTO partners (id, type, name, contact_email, city, country, latitude, longitude, status, quality_score, active)
SELECT md5('p-hotel-' || d.id::text)::uuid, 'HOTEL',
       d.name || ' Hospitality Group',
       'hotels+' || lower(regexp_replace(d.name, '[^a-zA-Z]', '', 'g')) || '@travelai.partners',
       d.name, upper(left(regexp_replace(d.country, '[^a-zA-Z]', '', 'g'), 3)),
       d.latitude, d.longitude, 'LIVE', 4.60, true
FROM destinations d WHERE d.active = true
UNION ALL
SELECT md5('p-rest-' || d.id::text)::uuid, 'RESTAURANT',
       d.name || ' Dining Collective',
       'dining+' || lower(regexp_replace(d.name, '[^a-zA-Z]', '', 'g')) || '@travelai.partners',
       d.name, upper(left(regexp_replace(d.country, '[^a-zA-Z]', '', 'g'), 3)),
       d.latitude, d.longitude, 'LIVE', 4.55, true
FROM destinations d WHERE d.active = true;

-- ── 2. Hotels (3 tiers per destination) ──────────────────────────────────────
INSERT INTO hotels (id, partner_id, name, stars, description, city, latitude, longitude,
                    pet_friendly, accessible, family_friendly, sea_proximity, image_url, base_price_night, active)
SELECT md5('hotel-' || t.tier || '-' || d.id::text)::uuid,
       md5('p-hotel-' || d.id::text)::uuid,
       d.name || ' ' || t.suffix,
       t.stars,
       t.descr_prefix || ' ' || d.name || '. ' || t.descr_suffix,
       d.name,
       d.latitude + t.dlat, d.longitude + t.dlng,
       t.pet, t.access, t.family,
       (d.tags LIKE '%beach%' OR d.tags LIKE '%island%' OR d.tags LIKE '%scenic%'),
       t.img,
       GREATEST(40, ROUND(COALESCE(d.avg_daily_cost, 120) * t.price_mult, 2)),
       true
FROM destinations d
CROSS JOIN (VALUES
  ('budget', 'Central Inn',     3, 'Comfortable budget stay in the heart of',
   'Cosy rooms, friendly staff and an unbeatable base for exploring on foot.',
   true,  false, true,  0.0012,  0.0011,
   'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 0.55),
  ('boutique', 'Boutique Hotel', 4, 'Stylish boutique retreat in',
   'Designer interiors, a rooftop bar and a locally sourced breakfast each morning.',
   false, true,  true, -0.0010,  0.0016,
   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 0.95),
  ('luxury', 'Grand Resort & Spa', 5, 'Five-star luxury overlooking',
   'Full-service spa, fine dining and panoramic suites for an unforgettable escape.',
   false, true,  false, 0.0015, -0.0012,
   'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 1.70)
) AS t(tier, suffix, stars, descr_prefix, descr_suffix, pet, access, family, dlat, dlng, img, price_mult)
WHERE d.active = true;

-- ── 3. Hotel availability — 120 days for the new hotels ──────────────────────
INSERT INTO hotel_availability (id, hotel_id, date, rooms_available, price_night)
SELECT uuid_generate_v4(), h.id, (CURRENT_DATE + s.day_offset)::date,
       CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5, 6) THEN 5 ELSE 12 END,
       CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5, 6) THEN h.base_price_night * 1.20
            WHEN EXTRACT(MONTH FROM CURRENT_DATE + s.day_offset) IN (7, 8) THEN h.base_price_night * 1.30
            ELSE h.base_price_night END
FROM hotels h
CROSS JOIN generate_series(0, 119) AS s(day_offset)
WHERE h.partner_id IN (SELECT md5('p-hotel-' || d.id::text)::uuid FROM destinations d);

-- ── 4. Restaurants (3 per destination) ───────────────────────────────────────
INSERT INTO restaurants (id, partner_id, name, cuisine_type, price_tier, description, city,
                         latitude, longitude, pet_friendly, accessible, image_url, active)
SELECT md5('rest-' || r.slug || '-' || d.id::text)::uuid,
       md5('p-rest-' || d.id::text)::uuid,
       d.name || ' ' || r.suffix,
       r.cuisine, r.tier,
       r.descr_prefix || ' ' || d.name || '. ' || r.descr_suffix,
       d.name,
       d.latitude + r.dlat, d.longitude + r.dlng,
       r.pet, r.access, r.img, true
FROM destinations d
CROSS JOIN (VALUES
  ('local', 'Local Table', 'Local',      2, true,  true,  'Authentic regional cooking in',
   'Seasonal market produce and time-honoured recipes from the area.',
   0.0009, -0.0008, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'),
  ('street', 'Street Food Market', 'Street Food', 1, true, false, 'Buzzing street-food hall in',
   'Small plates, quick bites and the city''s favourite casual flavours.',
   -0.0011, 0.0010, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800'),
  ('fine', 'Fine Dining Room', 'Gourmet', 4, false, true, 'Refined tasting-menu dining in',
   'A chef''s tasting journey paired with a curated cellar.',
   0.0013, 0.0014, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800')
) AS r(slug, suffix, cuisine, tier, pet, access, descr_prefix, descr_suffix, dlat, dlng, img)
WHERE d.active = true;

-- ── 5. Restaurant availability — lunch + dinner, 60 days ──────────────────────
INSERT INTO restaurant_availability (id, restaurant_id, date, time_slot, covers_available)
SELECT uuid_generate_v4(), rs.id, (CURRENT_DATE + s.day_offset)::date, sl.slot,
       CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5, 6) THEN 12 ELSE 24 END
FROM restaurants rs
CROSS JOIN generate_series(0, 59) AS s(day_offset)
CROSS JOIN (VALUES (TIME '13:00'), (TIME '20:00')) AS sl(slot)
WHERE rs.partner_id IN (SELECT md5('p-rest-' || d.id::text)::uuid FROM destinations d);

-- ── 6. Attractions (4 archetypes per destination) ────────────────────────────
INSERT INTO attractions (id, name, category, city, country, description, image_url,
                         latitude, longitude, price_level, base_price, duration_minutes,
                         bookable, tags, popularity_score, featured)
SELECT md5('attr-' || a.slug || '-' || d.id::text)::uuid,
       a.name_prefix || ' ' || d.name,
       a.category, d.name, d.country,
       a.descr_prefix || ' ' || d.name || '. ' || a.descr_suffix,
       a.img,
       d.latitude + a.dlat, d.longitude + a.dlng,
       a.price_level, a.base_price, a.duration, a.bookable, a.tags,
       GREATEST(0, d.popularity_score - a.pop_adj), a.featured
FROM destinations d
CROSS JOIN (VALUES
  ('landmark', 'Historic Heart of', 'LANDMARK',
   'The iconic landmark district of', 'A must-see symbol of the city, best at golden hour.',
   'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
   0.0008, 0.0006, 'FREE',   NULL,  90, false, 'landmark,historic,photo', 2, true),
  ('museum', 'City Museum of', 'MUSEUM',
   'The leading museum of', 'World-class collections spanning art and local history.',
   'https://images.unsplash.com/photo-1565060169187-5284a3c7af9a?w=1200&q=80',
   -0.0007, 0.0009, 'LOW',   18.00, 120, true,  'museum,art,culture', 6, false),
  ('foodtour', 'Flavours of', 'FOOD',
   'A guided tasting walk through', 'Sample signature dishes with a local food expert.',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
   0.0010, -0.0010, 'MEDIUM', 55.00, 180, true, 'food,tour,local', 9, false),
  ('nature', 'Wild Outskirts of', 'NATURE',
   'The scenic natural surroundings of', 'A half-day immersion in the landscapes around the city.',
   'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
   -0.0012, -0.0009, 'MEDIUM', 70.00, 240, true, 'nature,outdoor,scenic', 11, false)
) AS a(slug, name_prefix, category, descr_prefix, descr_suffix, img, dlat, dlng,
       price_level, base_price, duration, bookable, tags, pop_adj, featured)
WHERE d.active = true;

-- ── 7. Reviews — hotels (2 each) + destinations (2 each) ──────────────────────
INSERT INTO reviews (id, user_id, target_type, target_id, rating, title, content, helpful_count, verified, created_at)
SELECT md5('rev-h-' || rt.n || '-' || h.id::text)::uuid, u.id, 'HOTEL', h.id,
       rt.rating, rt.title, rt.content, rt.helpful, true, now() - (rt.days_ago || ' days')::interval
FROM hotels h
CROSS JOIN (VALUES
  (1, 5, 'Fantastic stay', 'Spotless rooms, warm welcome and a brilliant location. Would absolutely return.', 9, 4),
  (2, 4, 'Great value', 'Comfortable beds and walkable to everything we wanted to see. Recommended.', 4, 15)
) AS rt(n, rating, title, content, helpful, days_ago)
JOIN LATERAL (
  SELECT id FROM users WHERE role = 'TRAVELER'
  ORDER BY md5(id::text || h.id::text) LIMIT 1 OFFSET (rt.n - 1)
) u ON true
WHERE h.partner_id IN (SELECT md5('p-hotel-' || d.id::text)::uuid FROM destinations d)
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

INSERT INTO reviews (id, user_id, target_type, target_id, rating, title, content, helpful_count, verified, created_at)
SELECT md5('rev-d-' || rt.n || '-' || d.id::text)::uuid, u.id, 'DESTINATION', d.id,
       rt.rating, rt.title, rt.content, rt.helpful, true, now() - (rt.days_ago || ' days')::interval
FROM destinations d
CROSS JOIN (VALUES
  (1, 5, 'Unforgettable trip', 'Exceeded every expectation — incredible food, scenery and people.', 14, 9),
  (2, 4, 'Worth the journey', 'Plan a few extra days; there is far more to see than we expected.', 6, 22)
) AS rt(n, rating, title, content, helpful, days_ago)
JOIN LATERAL (
  SELECT id FROM users WHERE role = 'TRAVELER'
  ORDER BY md5(id::text || d.id::text) LIMIT 1 OFFSET (rt.n - 1)
) u ON true
WHERE d.active = true
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- ── 8. Forum — one question + one accepted answer per destination ────────────
INSERT INTO forum_questions (id, author_id, author_name, target_type, target_id, location, title, body, answer_count, created_at)
SELECT md5('fq-' || d.id::text)::uuid, u.id, u.first_name || ' ' || u.last_name,
       'DESTINATION', d.id, d.name,
       'Best time to visit ' || d.name || '?',
       'Planning my first trip to ' || d.name || '. Which months have the best weather, and how many days would you set aside?',
       1, now() - INTERVAL '12 days'
FROM destinations d
JOIN LATERAL (
  SELECT id, first_name, last_name FROM users WHERE role = 'TRAVELER'
  ORDER BY md5('q' || id::text || d.id::text) LIMIT 1
) u ON true
WHERE d.active = true;

INSERT INTO forum_answers (id, question_id, author_id, author_name, body, helpful_count, accepted, created_at)
SELECT md5('fa-' || d.id::text)::uuid, md5('fq-' || d.id::text)::uuid,
       u.id, u.first_name || ' ' || u.last_name,
       'I went last year — aim for the shoulder season for ' || d.name ||
       ' (fewer crowds, fair prices). Four to five days was the sweet spot for us.',
       8, true, now() - INTERVAL '10 days'
FROM destinations d
JOIN LATERAL (
  SELECT id, first_name, last_name FROM users WHERE role = 'TRAVELER'
  ORDER BY md5('a' || id::text || d.id::text) LIMIT 1
) u ON true
WHERE d.active = true;

-- ── 9. Flights — FCO / LHR / JFK <-> every destination, both directions ──────
INSERT INTO flights (id, airline, flight_number, origin_iata, dest_iata, departure_at, arrival_at,
                     price, seats_available, baggage_included, active)
SELECT md5('fl-' || hub.iata || '-' || dm.iata || '-' || g.dep || '-' || dir.tag)::uuid,
       hub.airline,
       hub.code || to_char(100 + g.dep, 'FM000') || left(dm.iata, 1),
       CASE dir.tag WHEN 'out' THEN hub.iata ELSE dm.iata END,
       CASE dir.tag WHEN 'out' THEN dm.iata ELSE hub.iata END,
       (CURRENT_DATE + g.dep)::date + TIME '08:00',
       (CURRENT_DATE + g.dep)::date + TIME '08:00' + make_interval(hours => 2 + (length(dm.dest_name) % 11)),
       LEAST(1200, GREATEST(49, ROUND(hub.base + COALESCE(d.avg_daily_cost, 120) * 1.4 + g.dep * 2, 2))),
       150,
       (g.dep % 2 = 0),
       true
FROM (VALUES
  ('London', 'LHR'), ('Lisbon', 'LIS'), ('Vienna', 'VIE'), ('Budapest', 'BUD'),
  ('Dubrovnik', 'DBV'), ('Reykjavik', 'KEF'), ('Edinburgh', 'EDI'), ('Cinque Terre', 'GOA'),
  ('Amalfi Coast', 'NAP'), ('Swiss Alps', 'ZRH'), ('Mykonos', 'JMK'), ('Istanbul', 'IST'),
  ('Copenhagen', 'CPH'), ('Nice', 'NCE'), ('Bruges', 'BRU'), ('Bergen', 'BGO'),
  ('Seville', 'SVQ'), ('Singapore', 'SIN'), ('Seoul', 'ICN'), ('Hanoi', 'HAN'),
  ('Kyoto', 'KIX'), ('Sri Lanka', 'CMB'), ('Kathmandu', 'KTM'), ('Macao', 'MFM'),
  ('Hong Kong', 'HKG'), ('Petra', 'AQJ'), ('Phuket', 'HKT'), ('Luang Prabang', 'LPQ'),
  ('Jaipur', 'JAI'), ('Buenos Aires', 'EZE'), ('Havana', 'HAV'), ('Cartagena', 'CTG'),
  ('Costa Rica', 'SJO'), ('Patagonia', 'FTE'), ('San Francisco', 'SFO'), ('Vancouver', 'YVR'),
  ('Tulum', 'CUN'), ('Cusco', 'CUZ'), ('Montreal', 'YUL'), ('Zanzibar', 'ZNZ'),
  ('Serengeti', 'JRO'), ('Cairo', 'CAI'), ('Mauritius', 'MRU'), ('Oman', 'MCT'),
  ('Victoria Falls', 'VFA'), ('Essaouira', 'ESU'), ('Fiji', 'NAN'), ('Great Barrier Reef', 'CNS'),
  ('Tasmania', 'HBA'), ('Bora Bora', 'BOB'), ('Milford Sound', 'ZQN'), ('Tahiti', 'PPT')
) AS dm(dest_name, iata)
JOIN destinations d ON d.name = dm.dest_name
CROSS JOIN (VALUES
  ('FCO', 'ITA Airways',      'AZ',  60),
  ('LHR', 'British Airways',  'BA',  75),
  ('JFK', 'American Airlines','AA', 210)
) AS hub(iata, airline, code, base)
CROSS JOIN (VALUES (5), (14), (23)) AS g(dep)
CROSS JOIN (VALUES ('out'), ('ret')) AS dir(tag)
WHERE hub.iata <> dm.iata;

-- ── 10. Cruises — world regions beyond V19's Mediterranean set ────────────────
INSERT INTO cruises (operator, name, ship_name, departure_port, arrival_port, departure_date, return_date,
                     duration_nights, price_per_person, cabins_available, cruise_type, description, image_url,
                     itinerary, all_inclusive, active, created_at)
VALUES
  ('Royal Caribbean', 'Eastern Caribbean Escape', 'Harmony of the Seas', 'Miami', 'Miami',
   CURRENT_DATE + 30, CURRENT_DATE + 37, 7, 899.00, 120, 'CARIBBEAN',
   'Turquoise waters, white-sand beaches and vibrant island ports across the Eastern Caribbean.',
   'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
   'Miami → Nassau → St. Thomas → St. Maarten → Miami', true, true, now()),
  ('Norwegian', 'Western Caribbean Sun', 'Norwegian Encore', 'Orlando', 'Orlando',
   CURRENT_DATE + 45, CURRENT_DATE + 52, 7, 749.00, 140, 'CARIBBEAN',
   'Maya ruins, cave snorkelling and powder beaches on a classic Western Caribbean loop.',
   'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=800',
   'Orlando → Cozumel → Roatán → Costa Maya → Orlando', true, true, now()),
  ('Princess', 'Alaska Glacier Discovery', 'Discovery Princess', 'Seattle', 'Seattle',
   CURRENT_DATE + 60, CURRENT_DATE + 67, 7, 1199.00, 90, 'EXPEDITION',
   'Calving glaciers, breaching whales and the Inside Passage on a round-trip Alaska voyage.',
   'https://images.unsplash.com/photo-1531176175280-33e81d6c8a0a?w=800',
   'Seattle → Juneau → Skagway → Glacier Bay → Ketchikan → Seattle', false, true, now()),
  ('Holland America', 'Northern Lights & Fjords', 'Nieuw Statendam', 'Amsterdam', 'Amsterdam',
   CURRENT_DATE + 75, CURRENT_DATE + 89, 14, 2099.00, 70, 'NORTHERN_EUROPE',
   'Chase the aurora past Norwegian fjords, fishing villages and Arctic coastline.',
   'https://images.unsplash.com/photo-1601063476271-a159c71ab0b3?w=800',
   'Amsterdam → Bergen → Tromsø → North Cape → Geiranger → Amsterdam', false, true, now()),
  ('Celebrity', 'Greek Isles & Aegean', 'Celebrity Apex', 'Athens', 'Athens',
   CURRENT_DATE + 40, CURRENT_DATE + 47, 7, 1099.00, 110, 'MEDITERRANEAN',
   'Sun-bleached villages and ancient ruins across the most photogenic Greek islands.',
   'https://images.unsplash.com/photo-1601581875039-e899893d520c?w=800',
   'Athens → Mykonos → Santorini → Rhodes → Crete → Athens', true, true, now()),
  ('MSC', 'Arabian Gulf Discovery', 'MSC World Europa', 'Dubai', 'Dubai',
   CURRENT_DATE + 55, CURRENT_DATE + 62, 7, 829.00, 130, 'MIDDLE_EAST',
   'Futuristic skylines, desert dunes and souks on a warm-water Gulf itinerary.',
   'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
   'Dubai → Abu Dhabi → Sir Bani Yas → Doha → Dubai', true, true, now()),
  ('Silversea', 'Galápagos Expedition', 'Silver Origin', 'Quito', 'Quito',
   CURRENT_DATE + 70, CURRENT_DATE + 77, 7, 6499.00, 50, 'EXPEDITION',
   'Up-close wildlife encounters with naturalist guides across the Galápagos archipelago.',
   'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800',
   'Quito → Baltra → Santa Cruz → Isabela → Fernandina → Quito', true, true, now()),
  ('Ponant', 'Antarctica Peninsula', 'Le Commandant Charcot', 'Ushuaia', 'Ushuaia',
   CURRENT_DATE + 120, CURRENT_DATE + 130, 10, 8999.00, 40, 'EXPEDITION',
   'Zodiac landings among penguin colonies and towering icebergs at the bottom of the world.',
   'https://images.unsplash.com/photo-1551984427-6d77a1d8d3a6?w=800',
   'Ushuaia → Drake Passage → Paradise Bay → Lemaire Channel → Ushuaia', true, true, now()),
  ('Cunard', 'Transatlantic Crossing', 'Queen Mary 2', 'Southampton', 'New York',
   CURRENT_DATE + 35, CURRENT_DATE + 42, 7, 1399.00, 100, 'TRANSATLANTIC',
   'A classic ocean crossing with white-glove service, ballroom nights and sea-day serenity.',
   'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=800',
   'Southampton → Atlantic Ocean → New York', false, true, now()),
  ('Royal Caribbean', 'Southeast Asia Explorer', 'Spectrum of the Seas', 'Singapore', 'Singapore',
   CURRENT_DATE + 80, CURRENT_DATE + 88, 8, 1049.00, 120, 'ASIA',
   'Temples, night markets and tropical beaches across Thailand, Malaysia and Vietnam.',
   'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
   'Singapore → Phuket → Penang → Ko Samui → Singapore', true, true, now()),
  ('P&O', 'South Pacific Islands', 'Pacific Explorer', 'Sydney', 'Sydney',
   CURRENT_DATE + 95, CURRENT_DATE + 105, 10, 1299.00, 110, 'SOUTH_PACIFIC',
   'Palm-fringed lagoons and coral atolls across Fiji, Vanuatu and New Caledonia.',
   'https://images.unsplash.com/photo-1573790387438-4da905039392?w=800',
   'Sydney → Nouméa → Port Vila → Suva → Sydney', true, true, now()),
  ('Hurtigruten', 'Iceland Circumnavigation', 'MS Fridtjof Nansen', 'Reykjavik', 'Reykjavik',
   CURRENT_DATE + 65, CURRENT_DATE + 75, 10, 3299.00, 60, 'EXPEDITION',
   'Waterfalls, puffin cliffs and geothermal coasts on a full loop of Iceland.',
   'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800',
   'Reykjavik → Ísafjörður → Akureyri → Djúpivogur → Heimaey → Reykjavik', false, true, now());
