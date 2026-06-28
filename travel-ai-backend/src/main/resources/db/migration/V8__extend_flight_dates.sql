-- V8: Extend flight data to cover July 28 – October 2026
-- The existing mock data only covers up to July 23, 2026, but the app generates
-- trips starting 30 days from now. This migration adds additional flights so the
-- AI planning orchestrator can always find candidates.

INSERT INTO flights (airline, flight_number, origin_iata, dest_iata, departure_at, arrival_at, price, seats_available, baggage_included, active)
VALUES
  -- FCO <-> MXP (Roma <-> Milano)
  ('ITA Airways', 'AZ101', 'FCO', 'MXP', '2026-07-28 08:00:00+00', '2026-07-28 09:10:00+00', 79.00,  120, true,  true),
  ('Ryanair',     'FR201', 'FCO', 'MXP', '2026-07-28 14:30:00+00', '2026-07-28 15:40:00+00', 55.00,  180, false, true),
  ('ITA Airways', 'AZ102', 'MXP', 'FCO', '2026-08-04 18:00:00+00', '2026-08-04 19:10:00+00', 79.00,  110, true,  true),
  ('Ryanair',     'FR202', 'MXP', 'FCO', '2026-08-04 11:30:00+00', '2026-08-04 12:40:00+00', 59.00,  160, false, true),

  -- FCO <-> VCE (Roma <-> Venezia)
  ('ITA Airways', 'AZ301', 'FCO', 'VCE', '2026-07-28 07:00:00+00', '2026-07-28 08:20:00+00', 89.00,  100, true,  true),
  ('easyJet',     'U2401', 'VCE', 'FCO', '2026-08-04 20:00:00+00', '2026-08-04 21:20:00+00', 72.00,   90, false, true),

  -- FCO <-> NAP (Roma <-> Napoli)
  ('Ryanair',     'FR501', 'FCO', 'NAP', '2026-07-28 09:30:00+00', '2026-07-28 10:20:00+00', 45.00,  150, false, true),
  ('Ryanair',     'FR502', 'NAP', 'FCO', '2026-08-04 17:00:00+00', '2026-08-04 17:50:00+00', 49.00,  140, false, true),

  -- MXP <-> VCE
  ('easyJet',     'U2601', 'MXP', 'VCE', '2026-07-28 10:00:00+00', '2026-07-28 11:00:00+00', 62.00,  130, false, true),

  -- FCO <-> CAG (Roma <-> Cagliari/Sardinia)
  ('ITA Airways', 'AZ701', 'FCO', 'CAG', '2026-07-28 07:30:00+00', '2026-07-28 08:50:00+00', 95.00,   80, true,  true),
  ('Ryanair',     'FR702', 'CAG', 'FCO', '2026-08-04 19:30:00+00', '2026-08-04 20:50:00+00', 85.00,   95, false, true),

  -- FCO <-> PMO (Roma <-> Palermo)
  ('ITA Airways', 'AZ801', 'FCO', 'PMO', '2026-07-28 08:45:00+00', '2026-07-28 10:00:00+00', 88.00,  110, true,  true),

  -- International: FCO <-> LHR, CDG, BCN
  ('ITA Airways', 'AZ901', 'FCO', 'LHR', '2026-07-28 06:00:00+00', '2026-07-28 08:30:00+00', 145.00,  90, true,  true),
  ('Ryanair',     'FR902', 'LHR', 'FCO', '2026-08-04 16:00:00+00', '2026-08-04 18:30:00+00', 129.00,  80, false, true),
  ('Air France',  'AF103', 'FCO', 'CDG', '2026-07-28 07:15:00+00', '2026-07-28 09:30:00+00', 139.00, 100, true,  true),
  ('Air France',  'AF104', 'CDG', 'FCO', '2026-08-04 15:45:00+00', '2026-08-04 17:55:00+00', 149.00,  95, true,  true),
  ('Vueling',     'VY203', 'FCO', 'BCN', '2026-07-29 09:00:00+00', '2026-07-29 11:15:00+00', 119.00, 120, false, true),
  ('Vueling',     'VY204', 'BCN', 'FCO', '2026-08-05 17:30:00+00', '2026-08-05 19:45:00+00', 125.00, 115, false, true),

  -- August additional coverage
  ('ITA Airways', 'AZ111', 'FCO', 'MXP', '2026-08-10 08:00:00+00', '2026-08-10 09:10:00+00', 82.00,  100, true,  true),
  ('ITA Airways', 'AZ112', 'MXP', 'FCO', '2026-08-17 18:00:00+00', '2026-08-17 19:10:00+00', 82.00,   95, true,  true),
  ('Ryanair',     'FR211', 'FCO', 'VCE', '2026-08-11 07:00:00+00', '2026-08-11 08:20:00+00', 65.00,  140, false, true),
  ('Ryanair',     'FR212', 'VCE', 'FCO', '2026-08-18 20:00:00+00', '2026-08-18 21:20:00+00', 68.00,  130, false, true),

  -- September coverage
  ('ITA Airways', 'AZ121', 'FCO', 'MXP', '2026-09-01 08:00:00+00', '2026-09-01 09:10:00+00', 75.00,  110, true,  true),
  ('Ryanair',     'FR221', 'FCO', 'NAP', '2026-09-01 09:30:00+00', '2026-09-01 10:20:00+00', 42.00,  160, false, true),
  ('ITA Airways', 'AZ131', 'FCO', 'CAG', '2026-09-08 07:30:00+00', '2026-09-08 08:50:00+00', 90.00,   85, true,  true),
  ('easyJet',     'U2631', 'MXP', 'VCE', '2026-09-15 10:00:00+00', '2026-09-15 11:00:00+00', 58.00,  120, false, true),

  -- October coverage
  ('ITA Airways', 'AZ141', 'FCO', 'MXP', '2026-10-01 08:00:00+00', '2026-10-01 09:10:00+00', 70.00,  115, true,  true),
  ('Ryanair',     'FR241', 'FCO', 'VCE', '2026-10-08 07:00:00+00', '2026-10-08 08:20:00+00', 60.00,  145, false, true),
  ('ITA Airways', 'AZ151', 'MXP', 'FCO', '2026-10-15 18:00:00+00', '2026-10-15 19:10:00+00', 72.00,  105, true,  true);
