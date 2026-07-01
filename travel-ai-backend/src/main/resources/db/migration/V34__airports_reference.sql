-- ─────────────────────────────────────────────────────────────────────────────
-- V34 — Airports reference table
--
-- Flights only store IATA codes. To group/display flights by destination
-- (country → city) we need an authoritative IATA → city/country lookup.
-- This table is seeded with every airport referenced by the flight inventory
-- (V3, V17, V31). Country codes are ISO 3166-1 alpha-2 (uppercase) so the UI
-- can render flags.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE airports (
    iata         CHAR(3)      PRIMARY KEY,
    city         VARCHAR(120) NOT NULL,
    country      VARCHAR(120) NOT NULL,
    country_code CHAR(2)      NOT NULL
);

CREATE INDEX idx_airports_country ON airports (LOWER(country));
CREATE INDEX idx_airports_city    ON airports (LOWER(city));

INSERT INTO airports (iata, city, country, country_code) VALUES
  ('AMS', 'Amsterdam',       'Netherlands',       'NL'),
  ('AQJ', 'Aqaba',           'Jordan',            'JO'),
  ('ATH', 'Athens',          'Greece',            'GR'),
  ('BCN', 'Barcelona',       'Spain',             'ES'),
  ('BGO', 'Bergen',          'Norway',            'NO'),
  ('BLQ', 'Bologna',         'Italy',             'IT'),
  ('BOB', 'Bora Bora',       'French Polynesia',  'PF'),
  ('BRI', 'Bari',            'Italy',             'IT'),
  ('BRU', 'Brussels',        'Belgium',           'BE'),
  ('BUD', 'Budapest',        'Hungary',           'HU'),
  ('CAG', 'Cagliari',        'Italy',             'IT'),
  ('CAI', 'Cairo',           'Egypt',             'EG'),
  ('CDG', 'Paris',           'France',            'FR'),
  ('CMB', 'Colombo',         'Sri Lanka',         'LK'),
  ('CNS', 'Cairns',          'Australia',         'AU'),
  ('CPH', 'Copenhagen',      'Denmark',           'DK'),
  ('CTA', 'Catania',         'Italy',             'IT'),
  ('CTG', 'Cartagena',       'Colombia',          'CO'),
  ('CUN', 'Cancún',          'Mexico',            'MX'),
  ('CUZ', 'Cusco',           'Peru',              'PE'),
  ('DBV', 'Dubrovnik',       'Croatia',           'HR'),
  ('EDI', 'Edinburgh',       'United Kingdom',    'GB'),
  ('ESU', 'Essaouira',       'Morocco',           'MA'),
  ('EZE', 'Buenos Aires',    'Argentina',         'AR'),
  ('FCO', 'Rome',            'Italy',             'IT'),
  ('FRA', 'Frankfurt',       'Germany',           'DE'),
  ('FTE', 'El Calafate',     'Argentina',         'AR'),
  ('GOA', 'Genoa',           'Italy',             'IT'),
  ('HAN', 'Hanoi',           'Vietnam',           'VN'),
  ('HAV', 'Havana',          'Cuba',              'CU'),
  ('HBA', 'Hobart',          'Australia',         'AU'),
  ('HKG', 'Hong Kong',       'Hong Kong',         'HK'),
  ('HKT', 'Phuket',          'Thailand',          'TH'),
  ('ICN', 'Seoul',           'South Korea',       'KR'),
  ('IST', 'Istanbul',        'Türkiye',           'TR'),
  ('JAI', 'Jaipur',          'India',             'IN'),
  ('JFK', 'New York',        'United States',     'US'),
  ('JMK', 'Mykonos',         'Greece',            'GR'),
  ('JRO', 'Kilimanjaro',     'Tanzania',          'TZ'),
  ('KEF', 'Reykjavík',       'Iceland',           'IS'),
  ('KIX', 'Osaka',           'Japan',             'JP'),
  ('KTM', 'Kathmandu',       'Nepal',             'NP'),
  ('LHR', 'London',          'United Kingdom',    'GB'),
  ('LIS', 'Lisbon',          'Portugal',          'PT'),
  ('LPQ', 'Luang Prabang',   'Laos',              'LA'),
  ('MCT', 'Muscat',          'Oman',              'OM'),
  ('MFM', 'Macau',           'Macau',             'MO'),
  ('MRU', 'Port Louis',      'Mauritius',         'MU'),
  ('MUC', 'Munich',          'Germany',           'DE'),
  ('MXP', 'Milan',           'Italy',             'IT'),
  ('NAN', 'Nadi',            'Fiji',              'FJ'),
  ('NAP', 'Naples',          'Italy',             'IT'),
  ('NCE', 'Nice',            'France',            'FR'),
  ('OLB', 'Olbia',           'Italy',             'IT'),
  ('PMO', 'Palermo',         'Italy',             'IT'),
  ('PPT', 'Papeete',         'French Polynesia',  'PF'),
  ('PRG', 'Prague',          'Czech Republic',    'CZ'),
  ('SFO', 'San Francisco',   'United States',     'US'),
  ('SIN', 'Singapore',       'Singapore',         'SG'),
  ('SJO', 'San José',        'Costa Rica',        'CR'),
  ('SVQ', 'Seville',         'Spain',             'ES'),
  ('TRN', 'Turin',           'Italy',             'IT'),
  ('VCE', 'Venice',          'Italy',             'IT'),
  ('VFA', 'Victoria Falls',  'Zimbabwe',          'ZW'),
  ('VIE', 'Vienna',          'Austria',           'AT'),
  ('VRN', 'Verona',          'Italy',             'IT'),
  ('YUL', 'Montreal',        'Canada',            'CA'),
  ('YVR', 'Vancouver',       'Canada',            'CA'),
  ('ZNZ', 'Zanzibar',        'Tanzania',          'TZ'),
  ('ZQN', 'Queenstown',      'New Zealand',       'NZ'),
  ('ZRH', 'Zurich',          'Switzerland',       'CH');
