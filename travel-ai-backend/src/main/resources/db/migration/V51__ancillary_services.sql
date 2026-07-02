-- =============================================================================
-- V51: Ancillary services (paid add-ons at checkout)
-- The highest-margin OTA revenue lever: optional extras sold alongside the core
-- booking (travel insurance, checked baggage, seat selection, priority boarding,
-- airport transfer, shore excursion, wine pairing).
--   ancillary_option  : the sellable catalogue (server-authoritative prices).
--   booking_ancillary : the line items actually purchased on a given booking.
-- A NULL vertical means the option applies to every vertical.
-- =============================================================================

CREATE TABLE ancillary_option (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    code          VARCHAR(40)  NOT NULL UNIQUE,
    label         VARCHAR(120) NOT NULL,
    description   VARCHAR(255),
    vertical      VARCHAR(20),                       -- flight | restaurant | cruise | NULL = all
    price         NUMERIC(12,2) NOT NULL,
    currency      VARCHAR(3)   NOT NULL DEFAULT 'EUR',
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order    INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE booking_ancillary (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id  UUID          NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    code        VARCHAR(40)   NOT NULL,
    label       VARCHAR(120)  NOT NULL,
    unit_price  NUMERIC(12,2) NOT NULL,
    quantity    INT           NOT NULL DEFAULT 1,
    currency    VARCHAR(3)    NOT NULL DEFAULT 'EUR',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_ancillary_booking ON booking_ancillary (booking_id);

-- Total add-on revenue captured on the booking, for revenue reporting (V53).
ALTER TABLE bookings ADD COLUMN ancillary_amount NUMERIC(12,2);

-- Seed the initial add-on catalogue.
INSERT INTO ancillary_option (code, label, description, vertical, price, sort_order) VALUES
    ('INSURANCE', 'Travel insurance',      'Medical, cancellation and baggage cover for the whole trip.', NULL,         19.90, 10),
    ('TRANSFER',  'Airport transfer',      'Private door-to-door transfer to and from the airport.',       NULL,         34.90, 20),
    ('BAGGAGE',   'Checked baggage',       'Add a 23 kg checked bag per traveller.',                       'flight',     29.90, 30),
    ('SEAT',      'Seat selection',        'Choose your seat in advance.',                                 'flight',     14.90, 40),
    ('PRIORITY',  'Priority boarding',     'Board first and secure overhead cabin space.',                 'flight',      9.90, 50),
    ('EXCURSION', 'Shore excursion',       'Guided excursion at one of the ports of call.',                'cruise',     59.00, 60),
    ('WINE',      'Wine pairing',          'Sommelier-selected wine pairing for the table.',               'restaurant', 24.90, 70);
