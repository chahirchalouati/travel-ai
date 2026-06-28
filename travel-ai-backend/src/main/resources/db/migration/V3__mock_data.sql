-- ============================================================
-- V3 — Mock Data (Realistic)
-- Partners · Hotels · Restaurants · Flights · Availability
-- ============================================================

-- ─── Partners (Hotels) ──────────────────────────────────────
INSERT INTO partners (id, type, name, vat_number, contact_email, contact_phone, address, city, country, latitude, longitude, status, quality_score, active)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'HOTEL', 'Grand Hotel Roma Group',       'IT01234560001', 'info@grandhotelroma.it',     '+390612345001', 'Via Vittorio Veneto 1',    'Roma',    'ITA',  41.9028,  12.4964, 'LIVE', 4.85, true),
  ('a0000001-0000-0000-0000-000000000002', 'HOTEL', 'Milano Luxury Hotels SRL',     'IT01234560002', 'info@milanoluxury.it',       '+390223456002', 'Piazza della Repubblica 1','Milano',  'ITA',  45.4654,   9.1859, 'LIVE', 4.72, true),
  ('a0000001-0000-0000-0000-000000000003', 'HOTEL', 'Venezia Hospitality SPA',      'IT01234560003', 'info@veneziahospitality.it', '+390415678003', 'Riva degli Schiavoni 1',   'Venezia', 'ITA',  45.4340,  12.3380, 'LIVE', 4.90, true),
  ('a0000001-0000-0000-0000-000000000004', 'HOTEL', 'Firenze Renaissance Hotels',   'IT01234560004', 'info@firenzeren.it',         '+390557890004', 'Piazzale Michelangelo 1',  'Firenze', 'ITA',  43.7696,  11.2558, 'LIVE', 4.68, true),
  ('a0000001-0000-0000-0000-000000000005', 'HOTEL', 'Napoli Sul Mare Resorts',      'IT01234560005', 'info@napolisulmare.it',      '+390818901005', 'Lungomare Caracciolo 1',   'Napoli',  'ITA',  40.8518,  14.2681, 'LIVE', 4.55, true),
  ('a0000001-0000-0000-0000-000000000006', 'HOTEL', 'Amalfi Coast Premium Hotels',  'IT01234560006', 'info@amalficoast.it',        '+390898012006', 'Via Lorenzo d''Amalfi 5',  'Amalfi',  'ITA',  40.6340,  14.6027, 'LIVE', 4.95, true),
  ('a0000001-0000-0000-0000-000000000007', 'HOTEL', 'Sicilia Blu Resorts',          'IT01234560007', 'info@siciliablu.it',         '+390916789007', 'Via della Libertà 100',    'Palermo', 'ITA',  38.1157,  13.3615, 'LIVE', 4.60, true),
  ('a0000001-0000-0000-0000-000000000008', 'HOTEL', 'Sardegna Costa Smeralda SRL',  'IT01234560008', 'info@costasmeralda.it',      '+390789012008', 'Via Porto Cervo 1',        'Olbia',   'ITA',  40.9230,   9.4990, 'LIVE', 4.88, true);

-- ─── Partners (Restaurants) ─────────────────────────────────
INSERT INTO partners (id, type, name, vat_number, contact_email, contact_phone, address, city, country, latitude, longitude, status, quality_score, active)
VALUES
  ('b0000002-0000-0000-0000-000000000001', 'RESTAURANT', 'Ristoranti Roma Group',      'IT09876540001', 'info@ristorantiroma.it',    '+390612340001', 'Trastevere 1',         'Roma',    'ITA',  41.8894,  12.4701, 'LIVE', 4.70, true),
  ('b0000002-0000-0000-0000-000000000002', 'RESTAURANT', 'Milano Gourmet SRL',         'IT09876540002', 'info@milanogourmet.it',     '+390223450002', 'Navigli, Via Corsico 1','Milano',  'ITA',  45.4497,   9.1674, 'LIVE', 4.80, true),
  ('b0000002-0000-0000-0000-000000000003', 'RESTAURANT', 'Sapori di Venezia SPA',      'IT09876540003', 'info@saporivenezia.it',     '+390415670003', 'Rialto, Calle dei Fabbri 1','Venezia','ITA', 45.4380,  12.3350, 'LIVE', 4.65, true),
  ('b0000002-0000-0000-0000-000000000004', 'RESTAURANT', 'Osterie Fiorentine Group',   'IT09876540004', 'info@osteriefiorentine.it', '+390557890004', 'Via dei Fossi 10',     'Firenze', 'ITA',  43.7731,  11.2453, 'LIVE', 4.75, true),
  ('b0000002-0000-0000-0000-000000000005', 'RESTAURANT', 'Cucina Napoletana SRL',      'IT09876540005', 'info@cucinanapolitana.it',  '+390818900005', 'Spaccanapoli 45',      'Napoli',  'ITA',  40.8476,  14.2558, 'LIVE', 4.85, true);

-- ─── Hotels ─────────────────────────────────────────────────
INSERT INTO hotels (id, partner_id, name, stars, description, city, latitude, longitude, pet_friendly, accessible, family_friendly, sea_proximity, image_url, base_price_night, active)
VALUES
  -- Roma
  ('c0000003-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
   'Hotel Splendide Royal Roma', 5,
   'Hotel storico nel cuore di Roma con vista sulla Fontana di Trevi. Camere di lusso, ristorante gourmet e spa esclusiva. A pochi passi dal Colosseo e dai Fori Imperiali.',
   'Roma', 41.9009, 12.4833, false, true, true, false,
   'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 280.00, true),

  ('c0000003-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001',
   'Boutique Hotel Trastevere', 4,
   'Charme e autenticità nel quartiere più bohémien di Roma. Terrazze con vista sui tetti della città eterna, colazione tipica romana inclusa.',
   'Roma', 41.8894, 12.4701, true, false, true, false,
   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 160.00, true),

  ('c0000003-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001',
   'Albergo del Senato Roma', 3,
   'Hotel nel centro storico di Roma con vista sul Pantheon. Perfetto per chi vuole esplorare la città a piedi. Camere confortevoli e staff cordiale.',
   'Roma', 41.8986, 12.4769, false, true, false, false,
   'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 95.00, true),

  -- Milano
  ('c0000003-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002',
   'The Westin Palace Milano', 5,
   'Lusso e design nel cuore della moda milanese. A due passi dal Duomo e dalla Galleria Vittorio Emanuele. Spa di livello mondiale, suite panoramiche mozzafiato.',
   'Milano', 45.4668, 9.1905, false, true, false, false,
   'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 320.00, true),

  ('c0000003-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002',
   'Hotel Navigli Design Milano', 4,
   'Hotel di design nel quartiere dei Navigli. Perfetto per chi ama l''arte, la moda e la vita notturna milanese. Roof bar con vista sulla città.',
   'Milano', 45.4497, 9.1674, true, true, false, false,
   'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', 185.00, true),

  -- Venezia
  ('c0000003-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003',
   'Hotel Danieli Venezia', 5,
   'Palazzo veneziano del XIV secolo trasformato in un hotel di lusso leggendario. Affacciato sul Canal Grande con servizio di gondola privata. Un''esperienza unica al mondo.',
   'Venezia', 45.4340, 12.3420, false, false, false, true,
   'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 450.00, true),

  ('c0000003-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000003',
   'Ca'' Sagredo Hotel Venezia', 4,
   'Palazzo storico sul Canal Grande con affreschi originali del XVIII secolo. Camere con vista sul Canal Grande. Atmosfera unica e romantica.',
   'Venezia', 45.4380, 12.3350, false, false, true, true,
   'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800', 220.00, true),

  -- Firenze
  ('c0000003-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000004',
   'Hotel Savoy Firenze', 5,
   'Eleganza rinascimentale in Piazza della Repubblica. Vista sulla cupola del Brunelleschi, ristorante stellato e spa di lusso. Il meglio di Firenze a portata di mano.',
   'Firenze', 43.7731, 11.2546, false, true, false, false,
   'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 350.00, true),

  ('c0000003-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004',
   'B&B Oltrarno Firenze', 3,
   'Accogliente B&B nel quartiere Oltrarno, il lato autentico di Firenze. A 10 minuti a piedi dagli Uffizi, colazione con prodotti biologici locali.',
   'Firenze', 43.7640, 11.2467, true, false, true, false,
   'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800', 85.00, true),

  -- Napoli
  ('c0000003-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005',
   'Grand Hotel Vesuvio Napoli', 5,
   'Storico hotel sul Lungomare Partenopeo con vista sul Vesuvio e sul Golfo di Napoli. Ristorante panoramico, piscina infinity e servizio impeccabile.',
   'Napoli', 40.8287, 14.2464, false, true, true, true,
   'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 240.00, true),

  -- Amalfi Coast
  ('c0000003-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000006',
   'Le Sirenuse Positano', 5,
   'Il più iconico hotel della Costiera Amalfitana. Villa storica aggrappata alla roccia con piscina a sfioro sul mare. Vista mozzafiato, ristorante stellato, servizio da sogno.',
   'Amalfi', 40.6284, 14.4850, false, false, false, true,
   'https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=800', 680.00, true),

  ('c0000003-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000006',
   'Hotel Santa Caterina Amalfi', 4,
   'Hotel incantevole con giardini terrazzati sulla Costiera Amalfitana. Ascensore privato per accedere al mare, piscina con acqua di mare e ristorante panoramico.',
   'Amalfi', 40.6340, 14.6027, false, false, true, true,
   'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 310.00, true),

  -- Palermo
  ('c0000003-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000007',
   'Palazzo Brunaccini Palermo', 4,
   'Palazzo nobiliare del XVII secolo trasformato in hotel di charme nel centro storico di Palermo. A due passi dai mercati storici e dal Teatro Massimo.',
   'Palermo', 38.1157, 13.3615, true, true, false, false,
   'https://images.unsplash.com/photo-1606402179428-a57976d71fa4?w=800', 140.00, true),

  -- Olbia (Sardegna)
  ('c0000003-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000008',
   'Resort Valle dell''Erica Sardinia', 5,
   'Resort esclusivo nella Costa Smeralda con spiagge di sabbia bianca e mare cristallino. Village con ville private, 5 ristoranti, 4 piscine e beach club.',
   'Olbia', 41.0690, 9.2215, true, true, true, true,
   'https://images.unsplash.com/photo-1540541338537-1d4d filter?w=800', 520.00, true),

  ('c0000003-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000008',
   'Hotel Martini Porto Cervo', 3,
   'Hotel accogliente a Porto Cervo, cuore della Costa Smeralda. A 5 minuti dalle spiagge più belle della Sardegna. Atmosfera giovane e dinamica.',
   'Olbia', 40.9230, 9.4990, false, false, false, true,
   'https://images.unsplash.com/photo-1540541338537-1d4d?w=800', 175.00, true);

-- ─── Hotel Availability (next 120 days) ─────────────────────
-- Generate daily availability for all 15 hotels
INSERT INTO hotel_availability (id, hotel_id, date, rooms_available, price_night)
SELECT
  uuid_generate_v4(),
  h.id,
  (CURRENT_DATE + s.day_offset)::DATE,
  CASE
    WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5, 6) THEN 3   -- weekend: fewer rooms
    ELSE 8
  END AS rooms_available,
  CASE
    WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5, 6)
      THEN h.base_price_night * 1.20   -- weekend surcharge 20%
    WHEN EXTRACT(MONTH FROM CURRENT_DATE + s.day_offset) IN (7, 8)
      THEN h.base_price_night * 1.35   -- summer peak +35%
    ELSE h.base_price_night
  END AS price_night
FROM hotels h
CROSS JOIN generate_series(0, 119) AS s(day_offset)
WHERE h.active = true;

-- ─── Restaurants ─────────────────────────────────────────────
INSERT INTO restaurants (id, partner_id, name, cuisine_type, price_tier, description, city, latitude, longitude, pet_friendly, accessible, image_url, active)
VALUES
  -- Roma
  ('d0000004-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000001',
   'La Pergola Roma', 'Italiana / Gourmet', 4,
   'L''unico tre stelle Michelin di Roma, sul tetto del Rome Cavalieri. Cucina italiana d''autore con ingredienti d''eccellenza e cantina da 60.000 bottiglie. Vista panoramica sulla città.',
   'Roma', 41.9318, 12.4413, false, true,
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', true),

  ('d0000004-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000001',
   'Tonnarello Trastevere', 'Romana Tradizionale', 2,
   'Storica trattoria di Trastevere aperta dal 1963. Cacio e pepe, carbonara e amatriciana preparate secondo la tradizione. Tavoli all''aperto in estate.',
   'Roma', 41.8886, 12.4688, true, false,
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),

  ('d0000004-0000-0000-0000-000000000003', 'b0000002-0000-0000-0000-000000000001',
   'Pizzarium Bonci Roma', 'Pizza Romana', 1,
   'La migliore pizza al taglio di Roma secondo molte classifiche internazionali. Impasto a lunga lievitazione, ingredienti di stagione e creatività senza confini.',
   'Roma', 41.9073, 12.4611, false, true,
   'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', true),

  -- Milano
  ('d0000004-0000-0000-0000-000000000004', 'b0000002-0000-0000-0000-000000000002',
   'Enrico Bartolini al Mudec', 'Italiana Contemporanea', 4,
   'Tre stelle Michelin nel museo della cultura MUDEC. Chef Enrico Bartolini propone una cucina italiana contemporanea di altissimo livello.',
   'Milano', 45.4467, 9.1674, false, true,
   'https://images.unsplash.com/photo-1485182708500-e8f1f318ba72?w=800', true),

  ('d0000004-0000-0000-0000-000000000005', 'b0000002-0000-0000-0000-000000000002',
   'Osteria dell''Acquabella', 'Lombarda', 2,
   'Cucina lombarda autentica nei Navigli. Risotto alla milanese, ossobuco e cassoeula preparati con ricette della tradizione. Cantina con oltre 300 etichette.',
   'Milano', 45.4497, 9.1780, true, false,
   'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800', true),

  -- Venezia
  ('d0000004-0000-0000-0000-000000000006', 'b0000002-0000-0000-0000-000000000003',
   'Osteria alle Testiere Venezia', 'Pesce Veneziano', 3,
   'Minuscola osteria con solo 22 coperti, considerata tra i migliori ristoranti di pesce di Venezia. Prenotazione obbligatoria con settimane di anticipo.',
   'Venezia', 45.4375, 12.3390, false, false,
   'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800', true),

  ('d0000004-0000-0000-0000-000000000007', 'b0000002-0000-0000-0000-000000000003',
   'Bacaro Jazz Venezia', 'Cicchetti Veneziani', 1,
   'Il bacaro veneziano per eccellenza: cicchetti (tapas veneziane), ombre di vino e musica jazz dal vivo. L''anima autentica di Venezia in un bicchiere.',
   'Venezia', 45.4380, 12.3360, false, false,
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', true),

  -- Firenze
  ('d0000004-0000-0000-0000-000000000008', 'b0000002-0000-0000-0000-000000000004',
   'Buca Mario Firenze', 'Toscana', 3,
   'Il ristorante più antico di Firenze aperto nel 1886. Bistecca alla fiorentina, ribollita e pappardelle al cinghiale in un''atmosfera senza tempo.',
   'Firenze', 43.7731, 11.2530, false, true,
   'https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=800', true),

  -- Napoli
  ('d0000004-0000-0000-0000-000000000009', 'b0000002-0000-0000-0000-000000000005',
   'L''Antica Pizzeria da Michele', 'Pizza Napoletana', 1,
   'La pizzeria più famosa del mondo aperta nel 1870. Solo due tipi di pizza: Margherita e Marinara. Fila sempre lunga ma ne vale la pena. Resa immortale dal film "Mangia Prega Ama".',
   'Napoli', 40.8512, 14.2616, false, false,
   'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800', true),

  ('d0000004-0000-0000-0000-000000000010', 'b0000002-0000-0000-0000-000000000005',
   'Ristorante Il Comandante Napoli', 'Mediterranea', 4,
   'Ristorante gastronomico al nono piano del Romeo Hotel con vista spettacolare sul Golfo di Napoli e sul Vesuvio. Cucina mediterranea d''autore.',
   'Napoli', 40.8407, 14.2611, false, true,
   'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', true);

-- ─── Restaurant Availability (next 60 days) ──────────────────
INSERT INTO restaurant_availability (id, restaurant_id, date, time_slot, covers_available)
SELECT
  uuid_generate_v4(),
  r.id,
  (CURRENT_DATE + s.day_offset)::DATE,
  slot.time_slot::TIME,
  CASE
    WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5, 6)
      THEN FLOOR(RANDOM() * 4 + 2)::SMALLINT   -- 2-5 covers on weekends
    ELSE FLOOR(RANDOM() * 6 + 4)::SMALLINT      -- 4-9 covers weekdays
  END
FROM restaurants r
CROSS JOIN generate_series(1, 59) AS s(day_offset)
CROSS JOIN (
  VALUES ('12:30'), ('13:00'), ('13:30'), ('19:30'), ('20:00'), ('20:30'), ('21:00')
) AS slot(time_slot)
WHERE r.active = true;

-- ─── Flights ─────────────────────────────────────────────────
-- Routes: FCO↔MXP, FCO↔VCE, FCO↔NAP, FCO↔PMO, FCO↔CAG,
--         MXP↔VCE, MXP↔NAP, MXP↔PMO,
--         FCO↔CDG, FCO↔LHR, FCO↔BCN, MXP↔CDG, MXP↔LHR

INSERT INTO flights (id, airline, flight_number, origin_iata, dest_iata, departure_at, arrival_at, price, seats_available, baggage_included, active)
VALUES

-- ── FCO → MXP ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000001', 'Ryanair', 'FR1201',
 'FCO', 'MXP',
 (CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '6 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '7 hours 10 minutes')::TIMESTAMPTZ,
 49.99, 142, false, true),

('e0000005-0000-0000-0000-000000000002', 'ITA Airways', 'AZ1401',
 'FCO', 'MXP',
 (CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '10 hours 15 minutes')::TIMESTAMPTZ,
 89.00, 58, true, true),

('e0000005-0000-0000-0000-000000000003', 'easyJet', 'U21341',
 'FCO', 'MXP',
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '7 hours 30 minutes')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '8 hours 45 minutes')::TIMESTAMPTZ,
 62.50, 96, false, true),

('e0000005-0000-0000-0000-000000000004', 'ITA Airways', 'AZ1403',
 'FCO', 'MXP',
 (CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '15 hours 15 minutes')::TIMESTAMPTZ,
 74.00, 44, true, true),

-- ── MXP → FCO ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000005', 'Ryanair', 'FR1202',
 'MXP', 'FCO',
 (CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '8 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '9 hours 10 minutes')::TIMESTAMPTZ,
 45.99, 134, false, true),

('e0000005-0000-0000-0000-000000000006', 'ITA Airways', 'AZ1402',
 'MXP', 'FCO',
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '16 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '17 hours 15 minutes')::TIMESTAMPTZ,
 82.00, 62, true, true),

-- ── FCO → VCE ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000007', 'Ryanair', 'FR5601',
 'FCO', 'VCE',
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '7 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '8 hours 20 minutes')::TIMESTAMPTZ,
 55.00, 118, false, true),

('e0000005-0000-0000-0000-000000000008', 'ITA Airways', 'AZ2201',
 'FCO', 'VCE',
 (CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '11 hours 20 minutes')::TIMESTAMPTZ,
 98.00, 35, true, true),

-- ── VCE → FCO ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000009', 'Ryanair', 'FR5602',
 'VCE', 'FCO',
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '18 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '19 hours 20 minutes')::TIMESTAMPTZ,
 52.00, 127, false, true),

-- ── FCO → NAP ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000010', 'Ryanair', 'FR3301',
 'FCO', 'NAP',
 (CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '8 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
 39.99, 156, false, true),

('e0000005-0000-0000-0000-000000000011', 'ITA Airways', 'AZ1501',
 'FCO', 'NAP',
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '12 hours 5 minutes')::TIMESTAMPTZ,
 75.00, 48, true, true),

-- ── NAP → FCO ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000012', 'Ryanair', 'FR3302',
 'NAP', 'FCO',
 (CURRENT_TIMESTAMP + INTERVAL '8 days' + INTERVAL '17 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '8 days' + INTERVAL '18 hours')::TIMESTAMPTZ,
 42.99, 149, false, true),

-- ── FCO → PMO (Palermo) ──────────────────────────────────────
('e0000005-0000-0000-0000-000000000013', 'Ryanair', 'FR4401',
 'FCO', 'PMO',
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '7 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '8 hours 20 minutes')::TIMESTAMPTZ,
 59.99, 138, false, true),

('e0000005-0000-0000-0000-000000000014', 'ITA Airways', 'AZ1601',
 'FCO', 'PMO',
 (CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '10 hours 25 minutes')::TIMESTAMPTZ,
 105.00, 42, true, true),

-- ── PMO → FCO ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000015', 'Ryanair', 'FR4402',
 'PMO', 'FCO',
 (CURRENT_TIMESTAMP + INTERVAL '12 days' + INTERVAL '19 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '12 days' + INTERVAL '20 hours 20 minutes')::TIMESTAMPTZ,
 64.99, 122, false, true),

-- ── FCO → CAG (Cagliari) ─────────────────────────────────────
('e0000005-0000-0000-0000-000000000016', 'Ryanair', 'FR7701',
 'FCO', 'CAG',
 (CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '8 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '9 hours 20 minutes')::TIMESTAMPTZ,
 64.99, 112, false, true),

('e0000005-0000-0000-0000-000000000017', 'easyJet', 'U27701',
 'FCO', 'CAG',
 (CURRENT_TIMESTAMP + INTERVAL '9 days' + INTERVAL '6 hours 30 minutes')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '9 days' + INTERVAL '7 hours 50 minutes')::TIMESTAMPTZ,
 78.00, 87, false, true),

-- ── CAG → FCO ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000018', 'Ryanair', 'FR7702',
 'CAG', 'FCO',
 (CURRENT_TIMESTAMP + INTERVAL '14 days' + INTERVAL '20 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '14 days' + INTERVAL '21 hours 20 minutes')::TIMESTAMPTZ,
 69.99, 98, false, true),

-- ── MXP → VCE ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000019', 'Ryanair', 'FR8801',
 'MXP', 'VCE',
 (CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '8 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
 35.99, 165, false, true),

-- ── MXP → NAP ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000020', 'ITA Airways', 'AZ2301',
 'MXP', 'NAP',
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '10 hours 20 minutes')::TIMESTAMPTZ,
 88.00, 56, true, true),

-- ── FCO → CDG (Parigi) ───────────────────────────────────────
('e0000005-0000-0000-0000-000000000021', 'Air France', 'AF1421',
 'FCO', 'CDG',
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '7 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '9 hours 20 minutes')::TIMESTAMPTZ,
 129.00, 78, true, true),

('e0000005-0000-0000-0000-000000000022', 'Ryanair', 'FR9901',
 'FCO', 'CDG',
 (CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '6 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '8 hours 15 minutes')::TIMESTAMPTZ,
 89.99, 104, false, true),

-- ── CDG → FCO ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000023', 'Air France', 'AF1422',
 'CDG', 'FCO',
 (CURRENT_TIMESTAMP + INTERVAL '12 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '12 days' + INTERVAL '16 hours 20 minutes')::TIMESTAMPTZ,
 135.00, 65, true, true),

-- ── FCO → LHR (Londra) ───────────────────────────────────────
('e0000005-0000-0000-0000-000000000024', 'British Airways', 'BA553',
 'FCO', 'LHR',
 (CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '8 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '10 hours 40 minutes')::TIMESTAMPTZ,
 148.00, 52, true, true),

('e0000005-0000-0000-0000-000000000025', 'Ryanair', 'FR1101',
 'FCO', 'LHR',
 (CURRENT_TIMESTAMP + INTERVAL '8 days' + INTERVAL '7 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '8 days' + INTERVAL '9 hours 35 minutes')::TIMESTAMPTZ,
 105.00, 118, false, true),

-- ── LHR → FCO ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000026', 'British Airways', 'BA554',
 'LHR', 'FCO',
 (CURRENT_TIMESTAMP + INTERVAL '13 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '13 days' + INTERVAL '13 hours 40 minutes')::TIMESTAMPTZ,
 152.00, 48, true, true),

-- ── FCO → BCN (Barcellona) ───────────────────────────────────
('e0000005-0000-0000-0000-000000000027', 'Vueling', 'VY6210',
 'FCO', 'BCN',
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '12 hours 30 minutes')::TIMESTAMPTZ,
 99.00, 87, false, true),

('e0000005-0000-0000-0000-000000000028', 'Ryanair', 'FR2201',
 'FCO', 'BCN',
 (CURRENT_TIMESTAMP + INTERVAL '9 days' + INTERVAL '7 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '9 days' + INTERVAL '9 hours 25 minutes')::TIMESTAMPTZ,
 79.99, 132, false, true),

-- ── BCN → FCO ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000029', 'Vueling', 'VY6211',
 'BCN', 'FCO',
 (CURRENT_TIMESTAMP + INTERVAL '11 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '11 days' + INTERVAL '17 hours 30 minutes')::TIMESTAMPTZ,
 104.00, 79, false, true),

-- ── MXP → CDG ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000030', 'Air France', 'AF1620',
 'MXP', 'CDG',
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
 118.00, 63, true, true),

-- ── MXP → LHR ────────────────────────────────────────────────
('e0000005-0000-0000-0000-000000000031', 'easyJet', 'U29001',
 'MXP', 'LHR',
 (CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '8 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '10 hours 30 minutes')::TIMESTAMPTZ,
 115.00, 94, false, true),

-- ── Additional departure dates (same routes, later dates) ────
('e0000005-0000-0000-0000-000000000032', 'Ryanair', 'FR1201',
 'FCO', 'MXP',
 (CURRENT_TIMESTAMP + INTERVAL '10 days' + INTERVAL '6 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '10 days' + INTERVAL '7 hours 10 minutes')::TIMESTAMPTZ,
 54.99, 138, false, true),

('e0000005-0000-0000-0000-000000000033', 'ITA Airways', 'AZ2202',
 'FCO', 'VCE',
 (CURRENT_TIMESTAMP + INTERVAL '12 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '12 days' + INTERVAL '11 hours 20 minutes')::TIMESTAMPTZ,
 92.00, 41, true, true),

('e0000005-0000-0000-0000-000000000034', 'ITA Airways', 'AZ1402',
 'FCO', 'NAP',
 (CURRENT_TIMESTAMP + INTERVAL '14 days' + INTERVAL '12 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '14 days' + INTERVAL '13 hours 5 minutes')::TIMESTAMPTZ,
 69.00, 55, true, true),

('e0000005-0000-0000-0000-000000000035', 'Air France', 'AF1423',
 'FCO', 'CDG',
 (CURRENT_TIMESTAMP + INTERVAL '15 days' + INTERVAL '7 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '15 days' + INTERVAL '9 hours 20 minutes')::TIMESTAMPTZ,
 139.00, 72, true, true),

('e0000005-0000-0000-0000-000000000036', 'British Airways', 'BA555',
 'FCO', 'LHR',
 (CURRENT_TIMESTAMP + INTERVAL '20 days' + INTERVAL '8 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '20 days' + INTERVAL '10 hours 40 minutes')::TIMESTAMPTZ,
 162.00, 38, true, true),

('e0000005-0000-0000-0000-000000000037', 'Ryanair', 'FR7702',
 'FCO', 'CAG',
 (CURRENT_TIMESTAMP + INTERVAL '16 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '16 days' + INTERVAL '10 hours 20 minutes')::TIMESTAMPTZ,
 59.99, 145, false, true),

('e0000005-0000-0000-0000-000000000038', 'Ryanair', 'FR4403',
 'FCO', 'PMO',
 (CURRENT_TIMESTAMP + INTERVAL '18 days' + INTERVAL '7 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '18 days' + INTERVAL '8 hours 20 minutes')::TIMESTAMPTZ,
 55.99, 129, false, true),

('e0000005-0000-0000-0000-000000000039', 'Vueling', 'VY6212',
 'FCO', 'BCN',
 (CURRENT_TIMESTAMP + INTERVAL '22 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '22 days' + INTERVAL '12 hours 30 minutes')::TIMESTAMPTZ,
 94.00, 91, false, true),

('e0000005-0000-0000-0000-000000000040', 'ITA Airways', 'AZ1502',
 'FCO', 'NAP',
 (CURRENT_TIMESTAMP + INTERVAL '25 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
 (CURRENT_TIMESTAMP + INTERVAL '25 days' + INTERVAL '15 hours 5 minutes')::TIMESTAMPTZ,
 72.00, 61, true, true);