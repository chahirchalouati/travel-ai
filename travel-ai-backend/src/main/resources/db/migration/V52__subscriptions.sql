-- =============================================================================
-- V52: Membership subscriptions (Travel AI Prime)
-- Recurring-revenue tier: a paid plan that waives the platform service fee and
-- grants a members-only discount on every booking.
--   subscription_plan : the sellable plans (server-authoritative benefits/price).
--   user_subscription : a user's membership, one active row per user.
-- =============================================================================

CREATE TABLE subscription_plan (
    id                   UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                 VARCHAR(40)   NOT NULL UNIQUE,
    name                 VARCHAR(120)  NOT NULL,
    description          VARCHAR(255),
    price                NUMERIC(12,2) NOT NULL,
    currency             VARCHAR(3)    NOT NULL DEFAULT 'EUR',
    billing_interval     VARCHAR(20)   NOT NULL DEFAULT 'ANNUAL',   -- ANNUAL | MONTHLY
    service_fee_waived   BOOLEAN       NOT NULL DEFAULT FALSE,
    member_discount_pct  NUMERIC(5,2)  NOT NULL DEFAULT 0,
    active               BOOLEAN       NOT NULL DEFAULT TRUE,
    sort_order           INT           NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE user_subscription (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_code     VARCHAR(40)  NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',           -- ACTIVE | CANCELLED | EXPIRED
    started_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    renews_at     TIMESTAMPTZ,
    cancelled_at  TIMESTAMPTZ,
    price_paid    NUMERIC(12,2) NOT NULL,
    currency      VARCHAR(3)   NOT NULL DEFAULT 'EUR',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_subscription_user_status ON user_subscription (user_id, status);

-- Seed the Prime plan.
INSERT INTO subscription_plan
    (code, name, description, price, billing_interval, service_fee_waived, member_discount_pct, sort_order)
VALUES
    ('PRIME', 'Travel AI Prime',
     'Zero service fees on every booking plus an exclusive members-only discount.',
     39.00, 'ANNUAL', TRUE, 5.00, 10);
