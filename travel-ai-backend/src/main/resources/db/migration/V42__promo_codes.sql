-- =============================================================================
-- V42: Promo codes / discount validation
-- Simple discount codes applied at checkout in the booking funnel.
-- discount_type: PERCENT (value = % off) | FIXED (value = currency amount off).
-- =============================================================================

CREATE TABLE promo_codes (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code             VARCHAR(60)    NOT NULL UNIQUE,
    discount_type    VARCHAR(20)    NOT NULL,          -- PERCENT | FIXED
    value            NUMERIC(12,2)  NOT NULL,
    active           BOOLEAN        NOT NULL DEFAULT TRUE,
    expires_at       TIMESTAMPTZ,
    max_redemptions  INT,
    times_redeemed   INT            NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_promo_codes_code ON promo_codes (LOWER(code));

-- ---------------------------------------------------------------------------
-- Seed two launch codes.
-- ---------------------------------------------------------------------------
INSERT INTO promo_codes (code, discount_type, value, active)
VALUES
    ('WELCOME10', 'PERCENT', 10.00, TRUE),
    ('SUMMER25',  'FIXED',   25.00, TRUE);
