-- =============================================================================
-- V30: Seed international bookable inventory
-- -----------------------------------------------------------------------------
-- Until now hotels (60) and restaurants (46) were 100% Italian, so the AI trip
-- planner — which searches the whole catalog filtered by budget/dates — could
-- only ever propose Italian stays. This seeds hotels + restaurants (+ 120 days
-- of availability) for 8 worldwide destinations that already exist in the
-- `destinations` table, so the planner and catalog stop being Italy-only.
--
-- ID ranges (no collision with existing c0000003.../d0000004... seeds):
--   hotel partners      a0000001-...-0000000001NN
--   restaurant partners b0000002-...-0000000001NN
--   hotels              e0000005-...-0000000001NN
--   restaurants         e0000006-...-0000000001NN
-- =============================================================================

-- ── Partners ────────────────────────────────────────────────────────────────
INSERT INTO partners (id, type, name, contact_email, city, country, latitude, longitude, status, quality_score, active)
VALUES
  ('a0000001-0000-0000-0000-000000000101', 'HOTEL', 'Paris Rive Hotels',        'info@parisrive.fr',      'Paris',          'FRA',  48.8566,   2.3522, 'LIVE', 4.80, true),
  ('a0000001-0000-0000-0000-000000000102', 'HOTEL', 'Tokyo Sakura Hospitality', 'info@tokyosakura.jp',    'Tokyo',          'JPN',  35.6762, 139.6503, 'LIVE', 4.75, true),
  ('a0000001-0000-0000-0000-000000000103', 'HOTEL', 'Sydney Harbour Stays',     'info@sydneyharbour.au',  'Sydney',         'AUS', -33.8688, 151.2093, 'LIVE', 4.70, true),
  ('a0000001-0000-0000-0000-000000000104', 'HOTEL', 'Bali Island Resorts',      'info@baliisland.id',     'Bali',           'IDN',  -8.4095, 115.1889, 'LIVE', 4.65, true),
  ('a0000001-0000-0000-0000-000000000105', 'HOTEL', 'Reykjavik Aurora Hotels',  'info@rvkaurora.is',      'Reykjavik',      'ISL',  64.1466, -21.9426, 'LIVE', 4.72, true),
  ('a0000001-0000-0000-0000-000000000106', 'HOTEL', 'Santorini Caldera Suites', 'info@santocaldera.gr',   'Santorini',      'GRC',  36.3932,  25.4615, 'LIVE', 4.85, true),
  ('a0000001-0000-0000-0000-000000000107', 'HOTEL', 'Prague Old Town Hotels',   'info@pragueoldtown.cz',  'Prague',         'CZE',  50.0755,  14.4378, 'LIVE', 4.68, true),
  ('a0000001-0000-0000-0000-000000000108', 'HOTEL', 'Rio Copacabana Group',     'info@riocopa.br',        'Rio de Janeiro', 'BRA', -22.9068, -43.1729, 'LIVE', 4.60, true),
  ('b0000002-0000-0000-0000-000000000101', 'RESTAURANT', 'Paris Bistro Collective',  'info@parisbistro.fr',     'Paris',          'FRA',  48.8566,   2.3522, 'LIVE', 4.75, true),
  ('b0000002-0000-0000-0000-000000000102', 'RESTAURANT', 'Tokyo Umami Dining',       'info@tokyoumami.jp',      'Tokyo',          'JPN',  35.6762, 139.6503, 'LIVE', 4.82, true),
  ('b0000002-0000-0000-0000-000000000103', 'RESTAURANT', 'Sydney Coastal Kitchens',  'info@sydneycoastal.au',   'Sydney',         'AUS', -33.8688, 151.2093, 'LIVE', 4.66, true),
  ('b0000002-0000-0000-0000-000000000104', 'RESTAURANT', 'Bali Warung Group',        'info@baliwarung.id',      'Bali',           'IDN',  -8.4095, 115.1889, 'LIVE', 4.70, true),
  ('b0000002-0000-0000-0000-000000000105', 'RESTAURANT', 'Reykjavik Nordic Table',   'info@rvknordic.is',       'Reykjavik',      'ISL',  64.1466, -21.9426, 'LIVE', 4.64, true),
  ('b0000002-0000-0000-0000-000000000106', 'RESTAURANT', 'Santorini Aegean Tavernas','info@santoaegean.gr',     'Santorini',      'GRC',  36.3932,  25.4615, 'LIVE', 4.78, true),
  ('b0000002-0000-0000-0000-000000000107', 'RESTAURANT', 'Prague Beer Hall Kitchens','info@praguebeerhall.cz',  'Prague',         'CZE',  50.0755,  14.4378, 'LIVE', 4.62, true),
  ('b0000002-0000-0000-0000-000000000108', 'RESTAURANT', 'Rio Botequim Collective',  'info@riobotequim.br',     'Rio de Janeiro', 'BRA', -22.9068, -43.1729, 'LIVE', 4.58, true);

-- ── Hotels (2 per destination) ───────────────────────────────────────────────
INSERT INTO hotels (id, partner_id, name, stars, description, city, latitude, longitude, pet_friendly, accessible, family_friendly, sea_proximity, image_url, base_price_night, active)
VALUES
-- Paris
('e0000005-0000-0000-0000-000000000101', 'a0000001-0000-0000-0000-000000000101',
 'Hotel Le Marais Lumiere', 4,
 'Boutique hotel nel cuore del Marais, a pochi passi dal Centre Pompidou. Camere luminose con vista sui tetti di Parigi e colazione con croissant artigianali.',
 'Paris', 48.8590, 2.3620, false, true, true, false,
 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 240.00, true),
('e0000005-0000-0000-0000-000000000102', 'a0000001-0000-0000-0000-000000000101',
 'Grand Palais Champs-Elysees', 5,
 'Lusso classico parigino a due passi dagli Champs-Elysees. Spa, ristorante gourmet e suite con vista sulla Tour Eiffel.',
 'Paris', 48.8698, 2.3078, false, true, false, false,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 360.00, true),
-- Tokyo
('e0000005-0000-0000-0000-000000000103', 'a0000001-0000-0000-0000-000000000102',
 'Shinjuku Sky Hotel', 4,
 'Hotel moderno nel cuore di Shinjuku, vicino alla stazione e ai quartieri della vita notturna. Camere compatte ed efficienti con vista sullo skyline.',
 'Tokyo', 35.6938, 139.7034, false, true, true, false,
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 210.00, true),
('e0000005-0000-0000-0000-000000000104', 'a0000001-0000-0000-0000-000000000102',
 'Asakusa Ryokan Tradition', 3,
 'Ryokan tradizionale vicino al tempio Senso-ji. Tatami, onsen interno e colazione giapponese servita in camera.',
 'Tokyo', 35.7148, 139.7967, false, false, true, false,
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 150.00, true),
-- Sydney
('e0000005-0000-0000-0000-000000000105', 'a0000001-0000-0000-0000-000000000103',
 'Harbour View Sydney', 5,
 'Hotel di lusso affacciato sulla baia, con vista diretta sull Opera House e sull Harbour Bridge. Piscina a sfioro e rooftop bar.',
 'Sydney', -33.8570, 151.2150, false, true, false, true,
 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 290.00, true),
('e0000005-0000-0000-0000-000000000106', 'a0000001-0000-0000-0000-000000000103',
 'Bondi Beach Lodge', 3,
 'Lodge rilassato a pochi metri dalla spiaggia di Bondi. Ideale per surfisti e famiglie, con terrazza barbecue e noleggio tavole.',
 'Sydney', -33.8915, 151.2767, true, false, true, true,
 'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 165.00, true),
-- Bali
('e0000005-0000-0000-0000-000000000107', 'a0000001-0000-0000-0000-000000000104',
 'Ubud Jungle Retreat', 4,
 'Resort immerso nella foresta di Ubud, con ville private, piscine a sfioro sulle risaie e centro yoga. Pace assoluta e natura rigogliosa.',
 'Bali', -8.5069, 115.2625, true, false, true, false,
 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 130.00, true),
('e0000005-0000-0000-0000-000000000108', 'a0000001-0000-0000-0000-000000000104',
 'Seminyak Beach Villas', 5,
 'Ville di lusso fronte oceano a Seminyak. Tramonti spettacolari, beach club privato e spa balinese.',
 'Bali', -8.6913, 115.1686, false, true, false, true,
 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 195.00, true),
-- Reykjavik
('e0000005-0000-0000-0000-000000000109', 'a0000001-0000-0000-0000-000000000105',
 'Aurora Boutique Reykjavik', 4,
 'Hotel di design nel centro di Reykjavik, punto di partenza ideale per le escursioni all aurora boreale. Sauna e caffetteria nordica.',
 'Reykjavik', 64.1470, -21.9408, false, true, true, false,
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 220.00, true),
('e0000005-0000-0000-0000-000000000110', 'a0000001-0000-0000-0000-000000000105',
 'Blue Lagoon Lodge', 5,
 'Lodge esclusivo vicino alla Laguna Blu, con accesso privato alle acque geotermali e suite panoramiche sui campi di lava.',
 'Reykjavik', 63.8804, -22.4495, false, true, false, false,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 340.00, true),
-- Santorini
('e0000005-0000-0000-0000-000000000111', 'a0000001-0000-0000-0000-000000000106',
 'Oia Caldera Suites', 5,
 'Suite scavate nella roccia di Oia con piscine private affacciate sulla caldera. I tramonti piu celebri delle Cicladi dalla tua terrazza.',
 'Santorini', 36.4618, 25.3753, false, false, false, true,
 'https://images.unsplash.com/photo-1469796466635-455ede028aca?w=800', 380.00, true),
('e0000005-0000-0000-0000-000000000112', 'a0000001-0000-0000-0000-000000000106',
 'Fira Cliff Hotel', 4,
 'Hotel a Fira con vista mozzafiato sul vulcano. Piscina panoramica, cucina greca e tramonti color pastello.',
 'Santorini', 36.4167, 25.4319, false, true, true, true,
 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', 250.00, true),
-- Prague
('e0000005-0000-0000-0000-000000000113', 'a0000001-0000-0000-0000-000000000107',
 'Old Town Square Hotel', 4,
 'Hotel storico sulla Piazza della Citta Vecchia, accanto all Orologio Astronomico. Atmosfera boema e colazione con strudel.',
 'Prague', 50.0875, 14.4213, false, true, true, false,
 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 140.00, true),
('e0000005-0000-0000-0000-000000000114', 'a0000001-0000-0000-0000-000000000107',
 'Vltava Riverside Boutique', 3,
 'Boutique hotel lungo la Moldava, vicino al Ponte Carlo. Camere accoglienti e vista sul castello illuminato.',
 'Prague', 50.0865, 14.4114, true, false, true, false,
 'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 95.00, true),
-- Rio de Janeiro
('e0000005-0000-0000-0000-000000000115', 'a0000001-0000-0000-0000-000000000108',
 'Copacabana Ocean Palace', 5,
 'Hotel iconico fronte spiaggia a Copacabana. Piscina sul rooftop, vista sul Pao de Acucar e samba dal vivo.',
 'Rio de Janeiro', -22.9711, -43.1822, false, true, false, true,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 200.00, true),
('e0000005-0000-0000-0000-000000000116', 'a0000001-0000-0000-0000-000000000108',
 'Ipanema Sunset Inn', 3,
 'Inn rilassato a un isolato dalla spiaggia di Ipanema. Colazione tropicale, terrazza e atmosfera carioca.',
 'Rio de Janeiro', -22.9839, -43.2042, true, false, true, true,
 'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 110.00, true);

-- ── Restaurants (2 per destination) ──────────────────────────────────────────
INSERT INTO restaurants (id, partner_id, name, cuisine_type, price_tier, description, city, latitude, longitude, pet_friendly, accessible, image_url, active)
VALUES
-- Paris
('e0000006-0000-0000-0000-000000000101', 'b0000002-0000-0000-0000-000000000101',
 'Le Petit Marais', 'Francese', 3,
 'Bistrot intimo nel Marais con classici francesi: confit di anatra, soupe a l oignon e creme brulee. Carta dei vini naturali.',
 'Paris', 48.8588, 2.3615, true, true,
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', true),
('e0000006-0000-0000-0000-000000000102', 'b0000002-0000-0000-0000-000000000101',
 'Brasserie Lumiere', 'Francese', 2,
 'Brasserie parigina classica con dehors. Steak frites, ostriche e profiteroles serviti fino a tarda sera.',
 'Paris', 48.8700, 2.3090, false, true,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),
-- Tokyo
('e0000006-0000-0000-0000-000000000103', 'b0000002-0000-0000-0000-000000000102',
 'Sushi Umami Ginza', 'Giapponese', 4,
 'Omakase di sushi nel cuore di Ginza. Pesce del mercato di Toyosu servito da maestri itamae al banco.',
 'Tokyo', 35.6717, 139.7640, false, true,
 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', true),
('e0000006-0000-0000-0000-000000000104', 'b0000002-0000-0000-0000-000000000102',
 'Shinjuku Ramen Yokocho', 'Giapponese', 1,
 'Ramen autentico in un vicolo di Shinjuku. Tonkotsu cremoso, gyoza croccanti e birra ghiacciata.',
 'Tokyo', 35.6940, 139.7008, false, false,
 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=800', true),
-- Sydney
('e0000006-0000-0000-0000-000000000105', 'b0000002-0000-0000-0000-000000000103',
 'Harbourside Seafood', 'Pesce', 3,
 'Ristorante di pesce affacciato sulla baia. Ostriche locali, barramundi alla griglia e vista sull Opera House.',
 'Sydney', -33.8568, 151.2090, false, true,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),
('e0000006-0000-0000-0000-000000000106', 'b0000002-0000-0000-0000-000000000103',
 'Bondi Brunch House', 'Australiana', 2,
 'Brunch sulla spiaggia di Bondi: avocado toast, flat white e bowl tropicali. Atmosfera rilassata fronte mare.',
 'Sydney', -33.8908, 151.2760, true, true,
 'https://images.unsplash.com/photo-1533920379810-6bedac9e31f4?w=800', true),
-- Bali
('e0000006-0000-0000-0000-000000000107', 'b0000002-0000-0000-0000-000000000104',
 'Ubud Warung Bali', 'Indonesiana', 1,
 'Warung tradizionale tra le risaie di Ubud. Nasi goreng, satay e smoothie bowl con frutta tropicale.',
 'Bali', -8.5074, 115.2620, true, false,
 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800', true),
('e0000006-0000-0000-0000-000000000108', 'b0000002-0000-0000-0000-000000000104',
 'Seminyak Beach Club', 'Fusion', 3,
 'Beach club glamour a Seminyak con cucina fusion asiatica e cocktail al tramonto sull oceano.',
 'Bali', -8.6920, 115.1680, false, true,
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', true),
-- Reykjavik
('e0000006-0000-0000-0000-000000000109', 'b0000002-0000-0000-0000-000000000105',
 'Nordic Table Reykjavik', 'Nordica', 3,
 'Cucina nordica moderna: agnello islandese, merluzzo fresco e skyr. Ingredienti locali e stagionali.',
 'Reykjavik', 64.1466, -21.9380, false, true,
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', true),
('e0000006-0000-0000-0000-000000000110', 'b0000002-0000-0000-0000-000000000105',
 'Harbour Fish Shack', 'Pesce', 2,
 'Baracchino del pesce al porto vecchio. Zuppa di aragosta, fish and chips e pane di segale islandese.',
 'Reykjavik', 64.1505, -21.9426, true, false,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),
-- Santorini
('e0000006-0000-0000-0000-000000000111', 'b0000002-0000-0000-0000-000000000106',
 'Oia Sunset Taverna', 'Greca', 3,
 'Taverna a Oia con terrazza sulla caldera. Moussaka, polpo alla griglia e vino Assyrtiko al tramonto.',
 'Santorini', 36.4615, 25.3760, false, false,
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', true),
('e0000006-0000-0000-0000-000000000112', 'b0000002-0000-0000-0000-000000000106',
 'Fira Meze House', 'Greca', 2,
 'Meze tradizionali a Fira: tzatziki, souvlaki e baklava. Vista sul vulcano e ospitalita cicladica.',
 'Santorini', 36.4170, 25.4320, true, true,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),
-- Prague
('e0000006-0000-0000-0000-000000000113', 'b0000002-0000-0000-0000-000000000107',
 'U Stare Pivovar', 'Ceca', 2,
 'Birreria storica nel centro di Praga. Gulasch, knedliky e birra Pilsner alla spina in boccali da mezzo litro.',
 'Prague', 50.0870, 14.4200, true, true,
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', true),
('e0000006-0000-0000-0000-000000000114', 'b0000002-0000-0000-0000-000000000107',
 'Vltava Riverside Grill', 'Internazionale', 3,
 'Grill lungo la Moldava con vista sul Ponte Carlo. Carni alla brace e selezione di vini moravi.',
 'Prague', 50.0860, 14.4110, false, true,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),
-- Rio de Janeiro
('e0000006-0000-0000-0000-000000000115', 'b0000002-0000-0000-0000-000000000108',
 'Copacabana Churrascaria', 'Brasiliana', 3,
 'Churrascaria classica a Copacabana. Rodizio di carni, feijoada e caipirinha con musica dal vivo.',
 'Rio de Janeiro', -22.9700, -43.1830, false, true,
 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', true),
('e0000006-0000-0000-0000-000000000116', 'b0000002-0000-0000-0000-000000000108',
 'Ipanema Botequim', 'Brasiliana', 1,
 'Botequim informale a Ipanema: pao de queijo, coxinha e birra ghiacciata a un passo dalla spiaggia.',
 'Rio de Janeiro', -22.9840, -43.2040, true, false,
 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800', true);

-- ── Availability for the new international hotels (120 days) ──────────────────
INSERT INTO hotel_availability (id, hotel_id, date, rooms_available, price_night)
SELECT uuid_generate_v4(), h.id, (CURRENT_DATE + s.day_offset)::DATE,
  CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5,6) THEN 4 ELSE 9 END,
  CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5,6) THEN h.base_price_night * 1.20
       WHEN EXTRACT(MONTH FROM CURRENT_DATE + s.day_offset) IN (7,8) THEN h.base_price_night * 1.30
       ELSE h.base_price_night END
FROM hotels h CROSS JOIN generate_series(0, 119) AS s(day_offset)
WHERE h.id >= 'e0000005-0000-0000-0000-000000000101';
