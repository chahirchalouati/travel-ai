-- Safety page + legal documents (privacy, terms, cookies, accessibility),
-- served through the existing site_content_items table.
--   safety  : sections tips | platform | badges | emergency
--   legal   : section 'meta' (title / value_text=updated / body=intro) +
--             ordered 'section' rows (title + bullets = newline-joined paragraphs)

-- ── SAFETY ───────────────────────────────────────────────────────────────────
INSERT INTO site_content_items (page, section, icon, title, body, sort_order) VALUES
('safety', 'tips', 'lock', 'Protect your account', 'Use a strong, unique password and enable two-factor authentication. Never share your login with anyone.', 0),
('safety', 'tips', 'verified_user', 'Verify your bookings', 'Always check your confirmation email. If anything looks wrong, contact support immediately.', 1),
('safety', 'tips', 'travel_explore', 'Research your destination', 'Check your government''s travel advisories for your destination before you book.', 2),
('safety', 'tips', 'location_on', 'Share your itinerary', 'Let someone at home know your travel plans, accommodation details, and key contacts.', 3),
('safety', 'tips', 'credit_card_off', 'Pay only on TravelAI', 'Never make payments outside the platform. We''ll never ask you to pay via bank transfer or gift card.', 4),
('safety', 'tips', 'health_and_safety', 'Check health requirements', 'Verify visa, vaccination, and entry requirements well before your departure date.', 5);

INSERT INTO site_content_items (page, section, body, sort_order) VALUES
('safety', 'platform', 'End-to-end SSL encryption on all connections', 0),
('safety', 'platform', 'Two-factor authentication available for all accounts', 1),
('safety', 'platform', 'Fraud detection and 24/7 payment monitoring', 2),
('safety', 'platform', 'Verified reviews from real travellers only', 3),
('safety', 'platform', 'GDPR compliant — your data is never sold', 4);

INSERT INTO site_content_items (page, section, icon, title, sort_order) VALUES
('safety', 'badges', 'https', 'SSL Encrypted', 0),
('safety', 'badges', 'verified', 'Verified Reviews', 1),
('safety', 'badges', 'gpp_good', 'GDPR Compliant', 2);

INSERT INTO site_content_items (page, section, icon, title, body, sort_order) VALUES
('safety', 'emergency', 'phone_in_talk', 'TravelAI 24/7 support', 'Reach our emergency support line any time via the app or at support@travelai.com', 0),
('safety', 'emergency', 'local_hospital', 'Medical emergencies', 'Contact local emergency services immediately. Keep your travel insurance documents accessible.', 1),
('safety', 'emergency', 'local_police', 'Police & crime', 'Report any crime to local police and keep a copy of the report for insurance purposes.', 2),
('safety', 'emergency', 'support_agent', 'Lost documents', 'Contact your country''s embassy or consulate. TravelAI can also help rebooking emergency accommodation.', 3);

-- ── PRIVACY ──────────────────────────────────────────────────────────────────
INSERT INTO site_content_items (page, section, title, value_text, body, sort_order) VALUES
('privacy', 'meta', 'Privacy Policy', 'July 2026', 'This Privacy Policy explains how TravelAI collects, uses, and protects your personal information when you use our platform.', 0);
INSERT INTO site_content_items (page, section, title, bullets, sort_order) VALUES
('privacy', 'section', 'Information we collect', E'We collect information you provide directly — such as your name, email address, and trip preferences — as well as data generated when you use the service, including searches, bookings, and interactions with our AI assistant.\nWe also collect technical data such as device type, browser, and IP address to keep the platform secure and reliable.', 0),
('privacy', 'section', 'How we use your data', 'Your data is used to personalise recommendations, process bookings, provide customer support, improve our AI models, and send you service-related communications.', 1),
('privacy', 'section', 'Sharing and disclosure', E'We share data with trusted travel partners strictly to fulfil your bookings — for example a hotel or airline you choose to book.\nWe never sell your personal data to third parties for advertising.', 2),
('privacy', 'section', 'Data retention', 'We keep your personal data only as long as needed to provide the service and to meet legal obligations, after which it is deleted or anonymised.', 3),
('privacy', 'section', 'Your rights', 'You can access, correct, export, or delete your data at any time from your account settings, or by contacting us. You may also object to certain processing.', 4),
('privacy', 'section', 'Security', 'We protect your data with encryption in transit and at rest, strict access controls, and regular security reviews.', 5);

-- ── TERMS ────────────────────────────────────────────────────────────────────
INSERT INTO site_content_items (page, section, title, value_text, body, sort_order) VALUES
('terms', 'meta', 'Terms of Service', 'July 2026', 'These Terms govern your access to and use of TravelAI. By creating an account or using the service, you agree to them.', 0);
INSERT INTO site_content_items (page, section, title, bullets, sort_order) VALUES
('terms', 'section', 'Eligibility', 'You must be at least 18 years old and able to enter into a binding contract to use TravelAI.', 0),
('terms', 'section', 'Your account', E'You are responsible for keeping your login credentials secure and for all activity under your account.\nNotify us immediately if you suspect unauthorised access.', 1),
('terms', 'section', 'Bookings and payments', 'Prices are confirmed at the time of booking. All fees, taxes, and cancellation terms are shown before you pay, and payment is processed securely.', 2),
('terms', 'section', 'Cancellations and refunds', 'Cancellation and refund rules depend on the travel provider and are displayed at checkout. Provider-specific terms apply.', 3),
('terms', 'section', 'Acceptable use', 'You agree not to misuse the platform, attempt to disrupt it, scrape data without permission, or use it for unlawful purposes.', 4),
('terms', 'section', 'Limitation of liability', 'TravelAI acts as an intermediary between you and travel providers. We are not liable for the acts or omissions of those providers beyond what the law requires.', 5),
('terms', 'section', 'Changes to these terms', 'We may update these Terms from time to time. Material changes will be communicated, and continued use means you accept the updated Terms.', 6);

-- ── COOKIES ──────────────────────────────────────────────────────────────────
INSERT INTO site_content_items (page, section, title, value_text, body, sort_order) VALUES
('cookies', 'meta', 'Cookie Policy', 'July 2026', 'This Cookie Policy explains how TravelAI uses cookies and similar technologies to make the platform work and to improve your experience.', 0);
INSERT INTO site_content_items (page, section, title, bullets, sort_order) VALUES
('cookies', 'section', 'What are cookies', 'Cookies are small text files stored on your device that help websites remember your preferences and recognise you on return visits.', 0),
('cookies', 'section', 'Essential cookies', 'These are required for core functionality such as signing in, keeping your session secure, and remembering your language. They cannot be turned off.', 1),
('cookies', 'section', 'Analytics cookies', 'These help us understand how the platform is used so we can improve it. They are anonymised and optional.', 2),
('cookies', 'section', 'Preference cookies', 'These remember choices like your currency, region, and interface settings to personalise your experience.', 3),
('cookies', 'section', 'Managing cookies', 'You can control or delete cookies through your browser settings. Blocking essential cookies may affect how the platform works.', 4);

-- ── ACCESSIBILITY ────────────────────────────────────────────────────────────
INSERT INTO site_content_items (page, section, title, value_text, body, sort_order) VALUES
('accessibility', 'meta', 'Accessibility', 'July 2026', 'TravelAI is committed to making travel planning accessible to everyone, regardless of ability.', 0);
INSERT INTO site_content_items (page, section, title, bullets, sort_order) VALUES
('accessibility', 'section', 'Our commitment', 'We aim to conform to WCAG 2.1 Level AA standards and continually improve the accessibility of our platform.', 0),
('accessibility', 'section', 'Keyboard and screen readers', 'The platform can be navigated with a keyboard, and we use semantic HTML and ARIA labels so screen readers can interpret content correctly.', 1),
('accessibility', 'section', 'Colour and contrast', 'We maintain sufficient colour contrast and never rely on colour alone to convey information.', 2),
('accessibility', 'section', 'Reduced motion', 'We respect your system reduced-motion preference and minimise non-essential animation when it is enabled.', 3),
('accessibility', 'section', 'Feedback', 'If you encounter an accessibility barrier, please tell us so we can fix it. Your feedback helps us improve for everyone.', 4);
