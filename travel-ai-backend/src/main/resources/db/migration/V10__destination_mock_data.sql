-- =============================================================================
-- V10: Realistic destination mock data
-- =============================================================================

INSERT INTO destinations (name, country, continent, description, image_url, tags, climate, best_months, avg_daily_cost, currency, language, timezone, latitude, longitude, popularity_score, featured) VALUES

-- EUROPE
('Paris', 'France', 'Europe',
 'The City of Light captivates with its iconic landmarks, world-class museums, and unparalleled culinary scene. From the Eiffel Tower to hidden bistros in Le Marais, Paris offers romance, culture, and gastronomy at every corner.',
 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
 'romantic,cultural,luxury,gastronomy,city',
 'continental', '4,5,6,9,10', 180.00, 'EUR', 'French', 'Europe/Paris', 48.8566, 2.3522, 98, TRUE),

('Rome', 'Italy', 'Europe',
 'The Eternal City is an open-air museum where ancient ruins stand alongside baroque churches and bustling trattorias. Every cobblestone tells a story spanning three millennia of Western civilization.',
 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
 'cultural,historical,gastronomy,romantic,city',
 'mediterranean', '4,5,6,9,10', 150.00, 'EUR', 'Italian', 'Europe/Rome', 41.9028, 12.4964, 95, TRUE),

('Barcelona', 'Spain', 'Europe',
 'Where Gaudí''s surreal architecture meets golden Mediterranean beaches. Barcelona pulses with creativity, tapas culture, and a nightlife that doesn''t start until midnight.',
 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
 'beach,cultural,nightlife,gastronomy,architecture',
 'mediterranean', '5,6,9,10', 140.00, 'EUR', 'Spanish', 'Europe/Madrid', 41.3874, 2.1686, 92, TRUE),

('Santorini', 'Greece', 'Europe',
 'Iconic white-washed villages perched on volcanic cliffs overlooking the azure Aegean Sea. Santorini is the quintessential Greek island experience with legendary sunsets and volcanic wine.',
 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
 'romantic,beach,luxury,island,scenic',
 'mediterranean', '5,6,7,8,9', 200.00, 'EUR', 'Greek', 'Europe/Athens', 36.3932, 25.4615, 90, TRUE),

('Amsterdam', 'Netherlands', 'Europe',
 'A city of canals, cycling, and creativity. Amsterdam blends golden age history with cutting-edge design, world-class museums, and a famously open culture.',
 'https://images.unsplash.com/photo-1534351590666-13e3e96b5571?w=800',
 'cultural,city,cycling,museums,nightlife',
 'continental', '4,5,6,7,8,9', 160.00, 'EUR', 'Dutch', 'Europe/Amsterdam', 52.3676, 4.9041, 88, FALSE),

('Prague', 'Czech Republic', 'Europe',
 'A fairytale city of Gothic spires, cobblestone lanes, and some of Europe''s best beer. Prague offers stunning architecture and rich history at remarkably affordable prices.',
 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
 'cultural,budget,historical,nightlife,romantic',
 'continental', '4,5,6,9,10', 80.00, 'EUR', 'Czech', 'Europe/Prague', 50.0755, 14.4378, 85, FALSE),

-- ASIA
('Bali', 'Indonesia', 'Asia',
 'The Island of the Gods enchants with lush rice terraces, ancient temples, world-class surf breaks, and a spiritual energy that transforms every visitor. From Ubud''s artistic heart to Seminyak''s beach clubs.',
 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
 'beach,spiritual,adventure,luxury,budget,nature',
 'tropical', '4,5,6,7,8,9', 60.00, 'USD', 'Indonesian', 'Asia/Makassar', -8.3405, 115.0920, 94, TRUE),

('Tokyo', 'Japan', 'Asia',
 'A mind-bending metropolis where ancient shrines hide between neon-lit skyscrapers, and where you can find the world''s best sushi next to a robot restaurant. Tokyo never ceases to amaze.',
 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
 'cultural,gastronomy,city,technology,shopping',
 'continental', '3,4,5,10,11', 130.00, 'JPY', 'Japanese', 'Asia/Tokyo', 35.6762, 139.6503, 93, TRUE),

('Bangkok', 'Thailand', 'Asia',
 'A sensory overload of golden temples, floating markets, sizzling street food, and rooftop bars with skyline views. Bangkok is Southeast Asia''s most dynamic city.',
 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
 'cultural,budget,gastronomy,nightlife,temples',
 'tropical', '11,12,1,2,3', 45.00, 'THB', 'Thai', 'Asia/Bangkok', 13.7563, 100.5018, 89, FALSE),

('Dubai', 'UAE', 'Asia',
 'A city that defies imagination with the world''s tallest buildings, man-made islands, and luxury experiences. Dubai blends futuristic ambition with traditional Arabian heritage.',
 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
 'luxury,shopping,city,adventure,beach,modern',
 'arid', '11,12,1,2,3', 220.00, 'AED', 'Arabic', 'Asia/Dubai', 25.2048, 55.2708, 87, FALSE),

-- AMERICAS
('New York', 'United States', 'North America',
 'The city that never sleeps offers unmatched cultural diversity, Broadway shows, Central Park, and neighborhoods each with their own distinct personality. NYC is the ultimate urban adventure.',
 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
 'city,cultural,gastronomy,shopping,nightlife',
 'continental', '4,5,6,9,10', 250.00, 'USD', 'English', 'America/New_York', 40.7128, -74.0060, 96, TRUE),

('Cancún', 'Mexico', 'North America',
 'Where turquoise Caribbean waters meet ancient Mayan ruins. Cancún offers pristine beaches, world-class diving in cenotes, and a vibrant nightlife scene.',
 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800',
 'beach,adventure,nightlife,historical,family',
 'tropical', '12,1,2,3,4', 100.00, 'MXN', 'Spanish', 'America/Cancun', 21.1619, -86.8515, 86, FALSE),

('Rio de Janeiro', 'Brazil', 'South America',
 'Cidade Maravilhosa - the Marvelous City lives up to its name with Sugarloaf Mountain, Copacabana Beach, Christ the Redeemer, and samba rhythms that fill the streets.',
 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
 'beach,cultural,nightlife,adventure,scenic',
 'tropical', '5,6,7,8,9', 80.00, 'BRL', 'Portuguese', 'America/Sao_Paulo', -22.9068, -43.1729, 84, FALSE),

('Machu Picchu', 'Peru', 'South America',
 'The lost citadel of the Incas perched high in the Andes. One of the New Seven Wonders of the World, Machu Picchu delivers a once-in-a-lifetime experience of ancient engineering genius.',
 'https://images.unsplash.com/photo-1587595431973-160d0d163795?w=800',
 'adventure,historical,cultural,nature,hiking',
 'continental', '4,5,6,7,8,9', 70.00, 'PEN', 'Spanish', 'America/Lima', -13.1631, -72.5450, 88, TRUE),

-- AFRICA
('Marrakech', 'Morocco', 'Africa',
 'A sensory feast of spice-scented souks, intricate mosaics, and the hypnotic call to prayer echoing across terracotta rooftops. Marrakech is North Africa''s most enchanting city.',
 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800',
 'cultural,budget,gastronomy,shopping,historical',
 'arid', '3,4,5,10,11', 55.00, 'MAD', 'Arabic', 'Africa/Casablanca', 31.6295, -7.9811, 82, FALSE),

('Cape Town', 'South Africa', 'Africa',
 'Where Table Mountain meets two oceans. Cape Town dazzles with dramatic landscapes, world-class wine regions, and a cultural vibrancy born from incredible diversity.',
 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800',
 'adventure,scenic,wine,beach,nature,cultural',
 'mediterranean', '10,11,12,1,2,3', 75.00, 'ZAR', 'English', 'Africa/Johannesburg', -33.9249, 18.4241, 80, FALSE),

-- OCEANIA
('Sydney', 'Australia', 'Oceania',
 'Harbor city extraordinaire with its iconic Opera House and Bridge. Sydney combines stunning beaches, diverse food scenes, and an outdoor lifestyle that''s the envy of the world.',
 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
 'beach,city,cultural,adventure,family',
 'continental', '10,11,12,1,2,3', 170.00, 'AUD', 'English', 'Australia/Sydney', -33.8688, 151.2093, 83, FALSE),

('Queenstown', 'New Zealand', 'Oceania',
 'The adventure capital of the world surrounded by dramatic mountain scenery and crystal-clear lakes. Bungee jumping was invented here, and the thrills never stop.',
 'https://images.unsplash.com/photo-1589871973318-9ca1258faa5d?w=800',
 'adventure,nature,scenic,luxury,skiing',
 'continental', '12,1,2,3,6,7,8', 150.00, 'NZD', 'English', 'Pacific/Auckland', -45.0312, 168.6626, 78, FALSE),

('Maldives', 'Maldives', 'Asia',
 'Paradise found in the Indian Ocean. Crystal-clear waters, overwater villas, and some of the world''s most pristine coral reefs make the Maldives the ultimate luxury escape.',
 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
 'beach,luxury,romantic,island,diving,honeymoon',
 'tropical', '1,2,3,4,11,12', 350.00, 'USD', 'Dhivehi', 'Indian/Maldives', 3.2028, 73.2207, 91, TRUE);
