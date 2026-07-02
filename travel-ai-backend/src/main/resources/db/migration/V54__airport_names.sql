-- ─────────────────────────────────────────────────────────────────────────────
-- V54 — Airport proper names
--
-- The airports table only stored city/country, so flight-search typeahead could
-- only suggest "City (IATA)". A city can host multiple airports (e.g. Rome has
-- both Fiumicino and Ciampino), so travelers expect to see the airport's own
-- name, not just the city. This adds an optional proper name populated for the
-- well-known major airports already seeded in V34; airports without a widely
-- recognized name are left NULL and the suggestion falls back to "City (IATA)".
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE airports ADD COLUMN name VARCHAR(120);

UPDATE airports SET name = CASE iata
  WHEN 'AMS' THEN 'Schiphol'
  WHEN 'AQJ' THEN 'King Hussein International'
  WHEN 'ATH' THEN 'Eleftherios Venizelos'
  WHEN 'BCN' THEN 'El Prat'
  WHEN 'BGO' THEN 'Flesland'
  WHEN 'BLQ' THEN 'Guglielmo Marconi'
  WHEN 'BRI' THEN 'Karol Wojtyła'
  WHEN 'BRU' THEN 'Zaventem'
  WHEN 'BUD' THEN 'Ferenc Liszt'
  WHEN 'CAG' THEN 'Elmas'
  WHEN 'CAI' THEN 'International'
  WHEN 'CDG' THEN 'Charles de Gaulle'
  WHEN 'CMB' THEN 'Bandaranaike'
  WHEN 'CPH' THEN 'Kastrup'
  WHEN 'CTA' THEN 'Fontanarossa'
  WHEN 'CTG' THEN 'Rafael Núñez'
  WHEN 'CUN' THEN 'International'
  WHEN 'CUZ' THEN 'Alejandro Velasco Astete'
  WHEN 'EZE' THEN 'Ezeiza'
  WHEN 'FCO' THEN 'Fiumicino'
  WHEN 'FRA' THEN 'am Main'
  WHEN 'GOA' THEN 'Cristoforo Colombo'
  WHEN 'HAN' THEN 'Nội Bài'
  WHEN 'HAV' THEN 'José Martí'
  WHEN 'HKG' THEN 'International'
  WHEN 'HKT' THEN 'International'
  WHEN 'ICN' THEN 'Incheon'
  WHEN 'JFK' THEN 'John F. Kennedy'
  WHEN 'KEF' THEN 'Keflavík'
  WHEN 'KIX' THEN 'Kansai'
  WHEN 'KTM' THEN 'Tribhuvan'
  WHEN 'LHR' THEN 'Heathrow'
  WHEN 'LIS' THEN 'Humberto Delgado'
  WHEN 'MCT' THEN 'International'
  WHEN 'MFM' THEN 'International'
  WHEN 'MRU' THEN 'Sir Seewoosagur Ramgoolam'
  WHEN 'MXP' THEN 'Malpensa'
  WHEN 'NAN' THEN 'International'
  WHEN 'NAP' THEN 'Capodichino'
  WHEN 'NCE' THEN 'Côte d''Azur'
  WHEN 'OLB' THEN 'Costa Smeralda'
  WHEN 'PMO' THEN 'Falcone-Borsellino'
  WHEN 'PPT' THEN 'Faa''a'
  WHEN 'PRG' THEN 'Václav Havel'
  WHEN 'SFO' THEN 'International'
  WHEN 'SIN' THEN 'Changi'
  WHEN 'SJO' THEN 'Juan Santamaría'
  WHEN 'VCE' THEN 'Marco Polo'
  WHEN 'VIE' THEN 'Schwechat'
  WHEN 'VRN' THEN 'Villafranca'
  WHEN 'YUL' THEN 'Trudeau'
  WHEN 'YVR' THEN 'International'
  WHEN 'ZNZ' THEN 'Abeid Amani Karume'
  WHEN 'ZRH' THEN 'Kloten'
  ELSE NULL
END;
