-- V19__seed_cruises.sql
-- Seed cruises table with 42 realistic cruise offerings

INSERT INTO cruises (operator, name, ship_name, departure_port, arrival_port, departure_date, return_date, duration_nights, price_per_person, cabins_available, cruise_type, description, image_url, itinerary, all_inclusive, active, created_at)
VALUES

-- =============================================
-- MEDITERRANEAN CRUISES (16)
-- =============================================

-- Western Mediterranean
('MSC Crociere', 'Splendori del Mediterraneo Occidentale', 'MSC Seascape', 'Genova', 'Genova', CURRENT_DATE + 18, CURRENT_DATE + 25, 7, 899.00, 320, 'Mediterranean',
 'Scopri le meraviglie del Mediterraneo occidentale a bordo della MSC Seascape. Visita le città più iconiche della costa con escursioni guidate e intrattenimento a bordo di livello mondiale.',
 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800', 'Genova, Marsiglia, Barcellona, Palma di Maiorca, Cagliari, Civitavecchia, Genova', false, true, now()),

('Costa Crociere', 'Magia del Tirreno', 'Costa Toscana', 'Civitavecchia', 'Civitavecchia', CURRENT_DATE + 22, CURRENT_DATE + 29, 7, 749.00, 400, 'Mediterranean',
 'Naviga lungo le coste tirreniche a bordo della Costa Toscana. Un viaggio tra storia, cultura e sapori mediterranei con soste nelle perle del mare nostrum.',
 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=800', 'Civitavecchia, Napoli, Palermo, Tunisi, Barcellona, Marsiglia, Civitavecchia', false, true, now()),

('Royal Caribbean', 'Western Med Explorer', 'Wonder of the Seas', 'Barcellona', 'Barcellona', CURRENT_DATE + 30, CURRENT_DATE + 40, 10, 1499.00, 280, 'Mediterranean',
 'Experience the best of the Western Mediterranean aboard the Wonder of the Seas. From the beaches of Barcelona to the cliffs of Santorini, every port is a masterpiece.',
 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800', 'Barcellona, Marsiglia, Genova, Civitavecchia, Napoli, Messina, Valletta, Barcellona', false, true, now()),

('MSC Crociere', 'Perle del Mediterraneo', 'MSC World Europa', 'Napoli', 'Napoli', CURRENT_DATE + 35, CURRENT_DATE + 42, 7, 849.00, 350, 'Mediterranean',
 'Un itinerario unico che parte dal cuore del Mediterraneo. Napoli, con il suo golfo spettacolare, è il punto di partenza ideale per esplorare le gemme costiere.',
 'https://images.unsplash.com/photo-1580541631950-7282082b53ce?w=800', 'Napoli, Palermo, Tunisi, Palma di Maiorca, Barcellona, Marsiglia, Napoli', false, true, now()),

('Princess Cruises', 'Riviera Romance', 'Sky Princess', 'Marsiglia', 'Civitavecchia', CURRENT_DATE + 45, CURRENT_DATE + 55, 10, 1299.00, 200, 'Mediterranean',
 'Sail the French and Italian Rivieras aboard the elegant Sky Princess. Enjoy gourmet dining, world-class entertainment, and stunning coastal vistas at every turn.',
 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800', 'Marsiglia, Montecarlo, Genova, Livorno, Civitavecchia, Napoli, Civitavecchia', false, true, now()),

-- Eastern Mediterranean
('Celebrity Cruises', 'Eastern Med Odyssey', 'Celebrity Beyond', 'Piraeus', 'Piraeus', CURRENT_DATE + 20, CURRENT_DATE + 30, 10, 1599.00, 180, 'Mediterranean',
 'Journey through the cradle of civilization on Celebrity Beyond. Visit ancient ruins, turquoise waters, and vibrant port cities across the Eastern Mediterranean.',
 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', 'Piraeus, Kusadasi, Istanbul, Mykonos, Santorini, Creta, Piraeus', false, true, now()),

('Costa Crociere', 'Tesori dell''Egeo', 'Costa Smeralda', 'Bari', 'Bari', CURRENT_DATE + 25, CURRENT_DATE + 32, 7, 699.00, 380, 'Mediterranean',
 'Esplora i tesori nascosti dell''Egeo partendo da Bari. Un viaggio che unisce la tradizione pugliese alla magia delle isole greche e della costa turca.',
 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=800', 'Bari, Corfù, Piraeus, Mykonos, Santorini, Katakolon, Bari', false, true, now()),

-- Greek Islands
('Silversea', 'Greek Islands Luxury Voyage', 'Silver Moon', 'Piraeus', 'Piraeus', CURRENT_DATE + 28, CURRENT_DATE + 35, 7, 3200.00, 60, 'Greek Islands',
 'An ultra-luxury voyage through the Cyclades and Dodecanese islands. Silversea''s all-inclusive service ensures every moment is perfection, from butler service to shore excursions.',
 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=800', 'Piraeus, Mykonos, Patmos, Rodi, Santorini, Paros, Piraeus', true, true, now()),

('Windstar Cruises', 'Intimate Greek Isles', 'Wind Star', 'Piraeus', 'Piraeus', CURRENT_DATE + 40, CURRENT_DATE + 47, 7, 2800.00, 50, 'Greek Islands',
 'Discover hidden harbors and secluded coves aboard the intimate Wind Star. This sailing yacht experience brings you closer to the authentic Greek island life.',
 'https://images.unsplash.com/photo-1504204267155-aabd4cb10ce4?w=800', 'Piraeus, Hydra, Nafplio, Monemvasia, Santorini, Paros, Piraeus', true, true, now()),

('MSC Crociere', 'Isole Greche da Sogno', 'MSC Musica', 'Venezia', 'Venezia', CURRENT_DATE + 50, CURRENT_DATE + 57, 7, 799.00, 300, 'Greek Islands',
 'Parti da Venezia alla scoperta delle isole greche più affascinanti. Un viaggio tra acque cristalline, villaggi bianchi e tramonti indimenticabili nel cuore dell''Egeo.',
 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800', 'Venezia, Spalato, Santorini, Mykonos, Dubrovnik, Venezia', false, true, now()),

-- Adriatic
('Costa Crociere', 'Perle dell''Adriatico', 'Costa Deliziosa', 'Venezia', 'Venezia', CURRENT_DATE + 19, CURRENT_DATE + 26, 7, 729.00, 340, 'Adriatic',
 'Naviga lungo le coste dell''Adriatico da Venezia alle perle della Dalmazia. Un itinerario che unisce arte, storia e paesaggi mozzafiato tra Italia, Croazia e Grecia.',
 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800', 'Venezia, Spalato, Dubrovnik, Corfù, Kotor, Venezia', false, true, now()),

('MSC Crociere', 'Adriatico e Isole Greche', 'MSC Lirica', 'Trieste', 'Trieste', CURRENT_DATE + 55, CURRENT_DATE + 62, 7, 699.00, 280, 'Adriatic',
 'Da Trieste alle isole greche, un percorso che attraversa l''Adriatico in tutta la sua bellezza. Soste a Dubrovnik, Corfù e le magiche Isole Ionie.',
 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800', 'Trieste, Venezia, Spalato, Dubrovnik, Corfù, Bari, Trieste', false, true, now()),

('Norwegian Cruise Line', 'Adriatic Jewels', 'Norwegian Viva', 'Venezia', 'Venezia', CURRENT_DATE + 60, CURRENT_DATE + 70, 10, 1399.00, 250, 'Adriatic',
 'Explore the jewels of the Adriatic Sea on Norwegian Viva. From the canals of Venice to the medieval walls of Dubrovnik, history comes alive at every port.',
 'https://images.unsplash.com/photo-1580820267682-426da823b514?w=800', 'Venezia, Kotor, Dubrovnik, Corfù, Santorini, Piraeus, Spalato, Venezia', false, true, now()),

('Cunard', 'Adriatic Heritage Voyage', 'Queen Victoria', 'Ancona', 'Venezia', CURRENT_DATE + 75, CURRENT_DATE + 85, 10, 1899.00, 150, 'Adriatic',
 'A refined voyage through the Adriatic aboard Queen Victoria. Cunard''s legendary White Star Service meets the timeless beauty of the Adriatic coastline.',
 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800', 'Ancona, Spalato, Hvar, Dubrovnik, Kotor, Corfù, Piraeus, Venezia', false, true, now()),

('Viking Ocean Cruises', 'Mediterranean Masterpiece', 'Viking Star', 'Civitavecchia', 'Piraeus', CURRENT_DATE + 32, CURRENT_DATE + 44, 12, 3500.00, 70, 'Mediterranean',
 'Viking''s culturally immersive voyage from Rome to Athens. Includes enrichment lectures, local cuisine experiences, and shore excursions at every port of call.',
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Civitavecchia, Napoli, Messina, Valletta, Creta, Santorini, Piraeus', true, true, now()),

('Royal Caribbean', 'Costa Azzurra e Isole', 'Allure of the Seas', 'Genova', 'Genova', CURRENT_DATE + 65, CURRENT_DATE + 72, 7, 999.00, 420, 'Mediterranean',
 'The ultimate family cruise along the Côte d''Azur and Mediterranean islands. Featuring FlowRider surf simulator, zip line, and Broadway-style entertainment.',
 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 'Genova, Marsiglia, Palma di Maiorca, Ibiza, Barcellona, Genova', false, true, now()),

-- =============================================
-- CARIBBEAN / TRANSATLANTIC (8)
-- =============================================

('Royal Caribbean', 'Caribbean Paradise', 'Symphony of the Seas', 'Miami', 'Miami', CURRENT_DATE + 16, CURRENT_DATE + 23, 7, 1199.00, 450, 'Caribbean',
 'Set sail from Miami to the turquoise waters of the Caribbean. Swim with stingrays, explore Mayan ruins, and relax on pristine white-sand beaches.',
 'https://images.unsplash.com/photo-1580541631950-7282082b53ce?w=800', 'Miami, Cozumel, Grand Cayman, Giamaica, Miami', false, true, now()),

('Norwegian Cruise Line', 'Eastern Caribbean Bliss', 'Norwegian Prima', 'Miami', 'Miami', CURRENT_DATE + 38, CURRENT_DATE + 45, 7, 1099.00, 300, 'Caribbean',
 'Discover the Eastern Caribbean''s most beautiful islands aboard Norwegian Prima. Freestyle cruising means no fixed dining times and ultimate freedom.',
 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800', 'Miami, San Juan, St. Thomas, Tortola, Nassau, Miami', false, true, now()),

('Celebrity Cruises', 'Southern Caribbean Discovery', 'Celebrity Edge', 'Fort Lauderdale', 'Fort Lauderdale', CURRENT_DATE + 42, CURRENT_DATE + 53, 11, 1899.00, 200, 'Caribbean',
 'A deep dive into the Southern Caribbean aboard the revolutionary Celebrity Edge. Visit lesser-known islands with rich culture and unspoiled nature.',
 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 'Fort Lauderdale, Aruba, Curaçao, Bonaire, Grenada, Barbados, St. Lucia, Fort Lauderdale', false, true, now()),

('Princess Cruises', 'Western Caribbean Adventure', 'Caribbean Princess', 'Fort Lauderdale', 'Fort Lauderdale', CURRENT_DATE + 48, CURRENT_DATE + 55, 7, 949.00, 280, 'Caribbean',
 'Explore the Western Caribbean with Princess Cruises'' signature MedallionClass experience. Personalized service and stunning destinations await.',
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Fort Lauderdale, Princess Cays, Grand Cayman, Cozumel, Fort Lauderdale', false, true, now()),

('MSC Crociere', 'Caraibi e Antille', 'MSC Seaside', 'Miami', 'Miami', CURRENT_DATE + 52, CURRENT_DATE + 59, 7, 899.00, 380, 'Caribbean',
 'Vivi la magia dei Caraibi con MSC Seaside. Spiagge da sogno, acque cristalline e il calore delle isole antillane in un viaggio indimenticabile.',
 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 'Miami, Ocean Cay, Ocho Rios, Grand Cayman, Cozumel, Miami', false, true, now()),

('Royal Caribbean', 'Caribbean Island Hopper', 'Icon of the Seas', 'San Juan', 'San Juan', CURRENT_DATE + 70, CURRENT_DATE + 77, 7, 1349.00, 350, 'Caribbean',
 'Hop between the most stunning Caribbean islands aboard the revolutionary Icon of the Seas. The largest cruise ship ever built delivers an unmatched experience.',
 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800', 'San Juan, St. Thomas, St. Kitts, Antigua, St. Maarten, San Juan', false, true, now()),

-- Transatlantic
('Cunard', 'Transatlantic Crossing', 'Queen Mary 2', 'Southampton', 'New York', CURRENT_DATE + 80, CURRENT_DATE + 87, 7, 1699.00, 180, 'Transatlantic',
 'The legendary Transatlantic Crossing aboard Queen Mary 2. Seven days of refined luxury, afternoon tea, and the romance of ocean travel at its finest.',
 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800', 'Southampton, New York', false, true, now()),

('MSC Crociere', 'Traversata Atlantica', 'MSC Divina', 'Civitavecchia', 'Miami', CURRENT_DATE + 90, CURRENT_DATE + 105, 15, 1299.00, 260, 'Transatlantic',
 'La grande traversata atlantica da Roma a Miami. Quindici giorni di navigazione con soste alle Azzorre, Madeira e nelle isole caraibiche prima dell''arrivo in Florida.',
 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800', 'Civitavecchia, Azzorre, Madeira, St. Maarten, San Juan, Miami', false, true, now()),

-- =============================================
-- NORTHERN EUROPE (8)
-- =============================================

-- Norwegian Fjords
('Viking Ocean Cruises', 'Viking Homeland Fjords', 'Viking Sky', 'Copenhagen', 'Copenhagen', CURRENT_DATE + 24, CURRENT_DATE + 36, 12, 3800.00, 65, 'Norwegian Fjords',
 'Sail through Norway''s dramatic fjords aboard Viking Sky. This culturally enriching voyage includes onboard lectures, local cuisine, and excursions to Viking heritage sites.',
 'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=800', 'Copenhagen, Stavanger, Flåm, Geiranger, Ålesund, Bergen, Copenhagen', true, true, now()),

('Norwegian Cruise Line', 'Norwegian Fjords Spectacular', 'Norwegian Star', 'Southampton', 'Southampton', CURRENT_DATE + 33, CURRENT_DATE + 43, 10, 1599.00, 240, 'Norwegian Fjords',
 'Witness the awe-inspiring Norwegian Fjords from Southampton. Towering waterfalls, glacier-carved valleys, and charming Nordic villages await at every stop.',
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Southampton, Bergen, Geiranger, Ålesund, Stavanger, Southampton', false, true, now()),

('Princess Cruises', 'Scandinavia & Fjords', 'Regal Princess', 'Copenhagen', 'Copenhagen', CURRENT_DATE + 58, CURRENT_DATE + 68, 10, 1449.00, 220, 'Norwegian Fjords',
 'Combine the magic of Scandinavian cities with the raw beauty of Norwegian Fjords. Princess Cruises delivers an unforgettable Nordic adventure.',
 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', 'Copenhagen, Oslo, Stavanger, Flåm, Bergen, Kristiansand, Copenhagen', false, true, now()),

-- Baltic
('Celebrity Cruises', 'Baltic Capitals', 'Celebrity Apex', 'Copenhagen', 'Copenhagen', CURRENT_DATE + 26, CURRENT_DATE + 38, 12, 1999.00, 170, 'Baltic',
 'Explore the grand capitals of the Baltic aboard Celebrity Apex. From the Hermitage in St. Petersburg to the Old Town of Tallinn, history unfolds at every port.',
 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'Copenhagen, Warnemünde, Tallinn, Helsinki, Stoccolma, Copenhagen', false, true, now()),

('MSC Crociere', 'Capitali del Baltico', 'MSC Euribia', 'Kiel', 'Kiel', CURRENT_DATE + 44, CURRENT_DATE + 55, 11, 1199.00, 340, 'Baltic',
 'Parti da Kiel alla scoperta delle affascinanti capitali del Baltico. Un viaggio tra palazzi imperiali, cattedrali gotiche e le notti bianche del nord Europa.',
 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800', 'Kiel, Copenhagen, Tallinn, Helsinki, Stoccolma, Kiel', false, true, now()),

('Silversea', 'Baltic Luxury Expedition', 'Silver Dawn', 'Stockholm', 'Copenhagen', CURRENT_DATE + 62, CURRENT_DATE + 74, 12, 4500.00, 55, 'Baltic',
 'An ultra-luxury Baltic journey with Silversea''s legendary all-inclusive service. Butler-attended suites, Michelin-inspired dining, and curated shore excursions.',
 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', 'Stoccolma, Helsinki, Tallinn, Riga, Gdansk, Warnemünde, Copenhagen', true, true, now()),

-- Iceland
('Viking Ocean Cruises', 'Iceland & Norway Explorer', 'Viking Jupiter', 'Reykjavik', 'Reykjavik', CURRENT_DATE + 46, CURRENT_DATE + 58, 12, 4200.00, 60, 'Northern Europe',
 'From geysers to glaciers, explore the raw beauty of Iceland and Northern Norway. Viking''s enrichment program brings the sagas and natural wonders to life.',
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Reykjavik, Akureyri, Isafjordur, Tromsø, Lofoten, Bergen, Reykjavik', true, true, now()),

('Cunard', 'Iceland & British Isles', 'Queen Elizabeth', 'Southampton', 'Southampton', CURRENT_DATE + 82, CURRENT_DATE + 96, 14, 2199.00, 160, 'Northern Europe',
 'A grand voyage to Iceland via the British Isles aboard Queen Elizabeth. Experience Cunard''s legendary service while exploring dramatic northern landscapes.',
 'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=800', 'Southampton, Edimburgo, Kirkwall, Reykjavik, Akureyri, Isafjordur, Southampton', false, true, now()),

-- =============================================
-- OTHER ROUTES (10)
-- =============================================

-- Canary Islands
('Costa Crociere', 'Isole Canarie e Madeira', 'Costa Pacifica', 'Lisbona', 'Lisbona', CURRENT_DATE + 36, CURRENT_DATE + 46, 10, 999.00, 310, 'Canary Islands',
 'Naviga verso le Isole Canarie e Madeira partendo da Lisbona. Vulcani, spiagge dorate e giardini tropicali ti attendono in questo viaggio nell''Atlantico.',
 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 'Lisbona, Funchal, Tenerife, Gran Canaria, Lanzarote, Lisbona', false, true, now()),

('MSC Crociere', 'Canarie e Marocco', 'MSC Orchestra', 'Las Palmas', 'Las Palmas', CURRENT_DATE + 56, CURRENT_DATE + 63, 7, 749.00, 290, 'Canary Islands',
 'Un viaggio tra le Isole Canarie e la costa marocchina. Sole, mare e culture millenarie si fondono in un''esperienza unica nel cuore dell''Atlantico.',
 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800', 'Las Palmas, Tenerife, La Palma, Agadir, Casablanca, Lanzarote, Las Palmas', false, true, now()),

-- Around Italy
('Costa Crociere', 'Giro d''Italia in Nave', 'Costa Firenze', 'Genova', 'Genova', CURRENT_DATE + 21, CURRENT_DATE + 28, 7, 679.00, 360, 'Around Italy',
 'Il giro d''Italia via mare! Scopri le città costiere più belle della penisola italiana da una prospettiva unica, navigando da Genova lungo tutte le coste.',
 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=800', 'Genova, Napoli, Messina, Catania, Bari, Venezia, Genova', false, true, now()),

('MSC Crociere', 'Italia Magnifica', 'MSC Fantasia', 'Civitavecchia', 'Civitavecchia', CURRENT_DATE + 68, CURRENT_DATE + 71, 3, 449.00, 400, 'Around Italy',
 'Un mini-crociera perfetta per un weekend lungo alla scoperta delle perle italiane. Tre notti di relax, buona cucina e panorami costieri indimenticabili.',
 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800', 'Civitavecchia, Napoli, Palermo, Civitavecchia', false, true, now()),

-- Middle East
('MSC Crociere', 'Emirati e Oman', 'MSC World America', 'Dubai', 'Dubai', CURRENT_DATE + 29, CURRENT_DATE + 36, 7, 1099.00, 350, 'Middle East',
 'Esplora il lusso degli Emirati Arabi e la bellezza dell''Oman. Dai grattacieli di Dubai ai souq tradizionali di Muscat, un viaggio tra modernità e tradizione.',
 'https://images.unsplash.com/photo-1580820267682-426da823b514?w=800', 'Dubai, Abu Dhabi, Muscat, Khasab, Sir Bani Yas, Dubai', false, true, now()),

('Celebrity Cruises', 'Arabian Gulf Discovery', 'Celebrity Constellation', 'Abu Dhabi', 'Abu Dhabi', CURRENT_DATE + 72, CURRENT_DATE + 79, 7, 1399.00, 160, 'Middle East',
 'Discover the wonders of the Arabian Gulf from Abu Dhabi. From the futuristic skyline of Dubai to the ancient forts of Oman, East meets West in spectacular fashion.',
 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800', 'Abu Dhabi, Dubai, Muscat, Khasab, Doha, Abu Dhabi', false, true, now()),

('Silversea', 'Arabian Luxury Voyage', 'Silver Spirit', 'Dubai', 'Dubai', CURRENT_DATE + 85, CURRENT_DATE + 95, 10, 4800.00, 50, 'Middle East',
 'The ultimate luxury experience in the Arabian Gulf. Silversea''s intimate ship brings you to hidden gems along the coast, with butler service and gourmet dining included.',
 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800', 'Dubai, Abu Dhabi, Bahrain, Doha, Muscat, Khasab, Dubai', true, true, now()),

-- Asia
('Royal Caribbean', 'Southeast Asia Odyssey', 'Spectrum of the Seas', 'Singapore', 'Singapore', CURRENT_DATE + 34, CURRENT_DATE + 45, 11, 1599.00, 300, 'Asia',
 'Explore the vibrant cultures of Southeast Asia from Singapore. Ancient temples, floating markets, and tropical beaches create an unforgettable Asian adventure.',
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Singapore, Ho Chi Minh City, Bangkok, Ko Samui, Penang, Kuala Lumpur, Singapore', false, true, now()),

('Viking Ocean Cruises', 'Grand Asia Voyage', 'Viking Orion', 'Hong Kong', 'Singapore', CURRENT_DATE + 78, CURRENT_DATE + 99, 21, 4900.00, 55, 'Asia',
 'Viking''s most comprehensive Asia itinerary. Twenty-one days of cultural immersion, from the temples of Angkor to the emerald waters of Ha Long Bay.',
 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', 'Hong Kong, Ha Long Bay, Da Nang, Ho Chi Minh City, Bangkok, Ko Samui, Kuala Lumpur, Singapore', true, true, now()),

('Princess Cruises', 'Japan & East Asia', 'Diamond Princess', 'Singapore', 'Hong Kong', CURRENT_DATE + 100, CURRENT_DATE + 114, 14, 2199.00, 190, 'Asia',
 'From the gardens of Singapore to the neon streets of Hong Kong, with stops at stunning Japanese ports. A true East Asian odyssey aboard the Diamond Princess.',
 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'Singapore, Ho Chi Minh City, Da Nang, Hong Kong', false, true, now()),

('Windstar Cruises', 'Bali & Indonesian Islands', 'Wind Spirit', 'Singapore', 'Singapore', CURRENT_DATE + 110, CURRENT_DATE + 120, 10, 3400.00, 50, 'Asia',
 'An intimate sailing voyage through the Indonesian archipelago. Windstar''s small ship reaches hidden bays and remote islands that larger vessels cannot access.',
 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 'Singapore, Semarang, Bali, Komodo, Lombok, Singapore', true, true, now());
