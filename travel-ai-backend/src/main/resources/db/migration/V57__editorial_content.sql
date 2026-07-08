-- Editorial / content-driven pages: blog, careers, press, help
-- Serves the footer marketing pages from the backend so content can be
-- managed without a frontend redeploy (single-language editorial content,
-- consistent with the stories/forum modules).

CREATE TABLE blog_posts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       VARCHAR(160) NOT NULL UNIQUE,
    title      VARCHAR(240) NOT NULL,
    excerpt    TEXT         NOT NULL,
    category   VARCHAR(80)  NOT NULL,
    read_min   INT          NOT NULL DEFAULT 5,
    date_label VARCHAR(40)  NOT NULL,
    icon       VARCHAR(60),
    accent     VARCHAR(120),
    featured   BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order INT          NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE job_positions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(160) NOT NULL,
    department      VARCHAR(80)  NOT NULL,
    location        VARCHAR(120) NOT NULL,
    employment_type VARCHAR(60)  NOT NULL,
    apply_email     VARCHAR(160) NOT NULL DEFAULT 'careers@travelai.com',
    sort_order      INT          NOT NULL DEFAULT 0,
    active          BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE press_coverage (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet     VARCHAR(120) NOT NULL,
    headline   TEXT         NOT NULL,
    url        VARCHAR(400),
    icon       VARCHAR(60),
    date_label VARCHAR(40)  NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE help_faqs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question   TEXT        NOT NULL,
    answer     TEXT        NOT NULL,
    category   VARCHAR(80),
    sort_order INT         NOT NULL DEFAULT 0,
    active     BOOLEAN     NOT NULL DEFAULT TRUE
);

-- ── Blog seed ────────────────────────────────────────────────────────────────
INSERT INTO blog_posts (slug, title, excerpt, category, read_min, date_label, icon, accent, featured, sort_order) VALUES
('ai-travel-planning', 'How AI is reinventing trip planning', 'From itinerary generation to real-time price alerts, discover how TravelAI turns hours of research into minutes of inspiration.', 'AI & Tech', 6, 'June 2025', 'smart_toy', 'linear-gradient(135deg, #BE4329, #A2371F)', TRUE, 0),
('hidden-gems-europe', 'Europe''s most underrated destinations for 2025', 'Skip the crowds. Our AI analysed millions of travel reviews to surface the places that locals love but tourists haven''t found yet.', 'Destinations', 8, 'May 2025', 'travel_explore', 'linear-gradient(135deg, #11664C, #0d5640)', FALSE, 1),
('budget-travel-tips', '5 ways to travel further on less', 'Flexible dates, price-watch alerts, and a few AI tricks that shave hundreds off your next trip without sacrificing comfort.', 'Tips', 5, 'May 2025', 'savings', 'linear-gradient(135deg, #C0892E, #a0731f)', FALSE, 2),
('solo-travel-guide', 'The complete solo travel guide', 'Everything you need to know about going it alone — safety, budgeting, meeting people, and making the most of freedom.', 'Guides', 10, 'Apr 2025', 'person', 'linear-gradient(135deg, #4338CA, #312e81)', FALSE, 3),
('sustainable-travel', 'How to travel more sustainably in 2025', 'Small choices, big impact. A practical guide to reducing your travel footprint without giving up the experiences you love.', 'Sustainability', 7, 'Apr 2025', 'eco', 'linear-gradient(135deg, #15803d, #14532d)', FALSE, 4),
('family-travel', 'Family travel hacks that actually work', 'Keeping kids happy, luggage light, and parents sane — our best tips for stress-free family adventures anywhere in the world.', 'Family', 6, 'Mar 2025', 'family_restroom', 'linear-gradient(135deg, #9333ea, #7e22ce)', FALSE, 5);

-- ── Careers seed ─────────────────────────────────────────────────────────────
INSERT INTO job_positions (title, department, location, employment_type, sort_order) VALUES
('Senior Frontend Engineer', 'Engineering', 'Remote', 'Full-time', 0),
('AI / ML Engineer', 'AI', 'Remote', 'Full-time', 1),
('Senior Product Designer', 'Design', 'Paris / Remote', 'Full-time', 2),
('Content Strategist', 'Marketing', 'Remote', 'Part-time', 3);

-- ── Press seed ───────────────────────────────────────────────────────────────
INSERT INTO press_coverage (outlet, headline, icon, date_label, sort_order) VALUES
('TechCrunch', 'TravelAI raises funding to bring AI trip planning to millions', 'newspaper', 'June 2025', 0),
('The Guardian', 'The app that''s making travel planning feel effortless', 'article', 'May 2025', 1),
('Forbes', 'TravelAI named one of the most innovative travel startups of 2025', 'business', 'Apr 2025', 2),
('Wired', 'How AI is making the travel agent obsolete — and why that''s OK', 'developer_mode', 'Mar 2025', 3);

-- ── Help FAQ seed ────────────────────────────────────────────────────────────
INSERT INTO help_faqs (question, answer, category, sort_order) VALUES
('How do I cancel or modify a booking?', 'Go to My Bookings, select the booking you want to change, and tap Modify or Cancel. Refunds are typically processed within 5-10 business days.', 'bookings', 0),
('Is my payment information secure?', 'Yes. All payments are processed through PCI-DSS certified providers. We never store your full card number. All data is encrypted in transit and at rest.', 'payments', 1),
('How does the AI Trip Planner work?', 'The AI planner uses large language models combined with our travel database to generate personalised day-by-day itineraries based on your preferences, budget, and travel dates.', 'ai', 2),
('Can I get a refund if my plans change?', 'Refund eligibility depends on the cancellation policy of each hotel, flight, or experience. You can find the policy on each booking''s detail page.', 'bookings', 3),
('How do I contact a hotel or airline directly?', 'Each booking confirmation email includes the supplier''s direct contact details. You can also find them on the booking detail page under Supplier info.', 'bookings', 4),
('What currencies are supported?', 'TravelAI displays prices in your local currency and supports payment in over 30 currencies. The exact currency is shown at checkout before you confirm payment.', 'account', 5);
