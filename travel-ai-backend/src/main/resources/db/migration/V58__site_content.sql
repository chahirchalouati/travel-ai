-- Generic editorial content for marketing site pages (about, partners, developers).
-- One row per item within a section of a page; flexible columns cover the
-- different shapes (stats, value cards, partner types with bullets, endpoints, SDKs).

CREATE TABLE site_content_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page       VARCHAR(40)  NOT NULL,
    section    VARCHAR(40)  NOT NULL,
    title      TEXT,
    body       TEXT,
    icon       VARCHAR(60),
    accent     VARCHAR(120),
    value_text VARCHAR(160),
    bullets    TEXT,
    sort_order INT          NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_site_content_page ON site_content_items (page, section, sort_order);

-- ── ABOUT ────────────────────────────────────────────────────────────────────
INSERT INTO site_content_items (page, section, value_text, title, sort_order) VALUES
('about', 'stats', '150+',  'Destinations',     0),
('about', 'stats', '2M+',   'Happy travellers', 1),
('about', 'stats', '500K+', 'Bookings made',    2),
('about', 'stats', '80+',   'Countries covered', 3);

INSERT INTO site_content_items (page, section, icon, title, body, sort_order) VALUES
('about', 'values', 'travel_explore', 'Relentlessly curious', 'We explore every corner of travel to bring you hidden gems and honest insights.', 0),
('about', 'values', 'verified', 'Radically trustworthy', 'Real reviews, transparent pricing, no hidden fees — ever.', 1),
('about', 'values', 'bolt', 'Boldly innovative', 'We use the latest AI to make trip planning feel effortless and personal.', 2),
('about', 'values', 'public', 'Globally inclusive', 'Travel is for everyone. We design for every budget, language, and ability.', 3);

-- ── PARTNERS ─────────────────────────────────────────────────────────────────
INSERT INTO site_content_items (page, section, value_text, title, sort_order) VALUES
('partners', 'stats', '2,000+', 'Active partners', 0),
('partners', 'stats', '500K+',  'Bookings facilitated', 1),
('partners', 'stats', '80+',    'Countries', 2);

INSERT INTO site_content_items (page, section, icon, accent, title, body, bullets, sort_order) VALUES
('partners', 'types', 'hotel', 'linear-gradient(135deg, #BE4329, #A2371F)', 'Hotels & Accommodation', 'From boutique guesthouses to luxury resorts — reach travellers actively looking for where to stay.', E'Real-time availability sync\nCompetitive commission rates\nAI-powered demand forecasting', 0),
('partners', 'types', 'flight', 'linear-gradient(135deg, #11664C, #0d5640)', 'Airlines & Transport', 'Integrate your flight inventory and reach travellers at the moment they''re ready to book.', E'Live fare and seat availability\nDynamic bundling with hotels\nFlexible distribution options', 1),
('partners', 'types', 'celebration', 'linear-gradient(135deg, #C0892E, #a0731f)', 'Experiences & Activities', 'Tours, tastings, cultural events — connect your experiences with travellers already at the destination.', E'Last-minute booking optimisation\nAI concierge recommendations\nGroup booking management', 2);

INSERT INTO site_content_items (page, section, value_text, title, body, sort_order) VALUES
('partners', 'steps', '1', 'Apply online', 'Tell us about your business and inventory. Takes under 10 minutes.', 0),
('partners', 'steps', '2', 'We review', 'Our team evaluates your application and gets back to you within 48 hours.', 1),
('partners', 'steps', '3', 'Go live', 'Connect your systems via API or our dashboard and start receiving bookings.', 2);

-- ── DEVELOPERS ───────────────────────────────────────────────────────────────
INSERT INTO site_content_items (page, section, icon, title, body, sort_order) VALUES
('developers', 'features', 'api', 'REST API', 'Clean, versioned endpoints for hotels, flights, destinations, and bookings.', 0),
('developers', 'features', 'search', 'Powerful search', 'Full-text and semantic search across our entire travel inventory.', 1),
('developers', 'features', 'webhook', 'Webhooks', 'Real-time event notifications for booking status changes and price updates.', 2),
('developers', 'features', 'smart_toy', 'AI endpoints', 'Access our LLM-powered recommendation and itinerary generation endpoints.', 3),
('developers', 'features', 'speed', 'Fast & reliable', '99.9% uptime SLA with sub-100ms average latency across global regions.', 4),
('developers', 'features', 'gpp_good', 'Secure by default', 'OAuth 2.0, rate limiting, and SOC 2 Type II compliant infrastructure.', 5);

INSERT INTO site_content_items (page, section, value_text, title, body, sort_order) VALUES
('developers', 'endpoints', 'GET',   '/api/hotels', 'Search hotels by location, dates, and filters', 0),
('developers', 'endpoints', 'GET',   '/api/flights', 'Search available flights between two points', 1),
('developers', 'endpoints', 'GET',   '/api/destinations', 'Browse destination catalogue with rich content', 2),
('developers', 'endpoints', 'POST',  '/api/bookings', 'Create a new booking for a hotel or flight', 3),
('developers', 'endpoints', 'GET',   '/api/bookings/{id}', 'Retrieve booking details and status', 4),
('developers', 'endpoints', 'PATCH', '/api/bookings/{id}', 'Modify or cancel an existing booking', 5);

INSERT INTO site_content_items (page, section, icon, accent, title, value_text, sort_order) VALUES
('developers', 'sdks', '🟨', '#f7df1e22', 'JavaScript / TypeScript', 'npm install @travelai/sdk', 0),
('developers', 'sdks', '🐍', '#3776ab22', 'Python', 'pip install travelai', 1),
('developers', 'sdks', '☕', '#ed8b0022', 'Java', 'implementation "com.travelai:sdk"', 2),
('developers', 'sdks', '🐹', '#00add822', 'Go', 'go get travelai.com/sdk', 3);
