-- =============================================================================
-- V48: Loyalty points program
-- One account per user; points earned on successful payments (1 pt / EUR paid,
-- boosted by tier), redeemed at checkout as a discount (100 pts = 1 EUR).
-- Tiers by lifetime points: EXPLORER 0+ | VOYAGER 1000+ | ELITE 5000+.
-- =============================================================================

CREATE TABLE loyalty_accounts (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    points_balance   INT         NOT NULL DEFAULT 0,
    lifetime_points  INT         NOT NULL DEFAULT 0,
    tier             VARCHAR(20) NOT NULL DEFAULT 'EXPLORER',   -- EXPLORER | VOYAGER | ELITE
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE loyalty_transactions (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id   UUID         NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    type         VARCHAR(20)  NOT NULL,        -- EARN | REDEEM | ADJUST
    points       INT          NOT NULL,        -- signed: positive earn, negative redeem
    booking_id   UUID,
    description  VARCHAR(255),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_tx_account_created
    ON loyalty_transactions (account_id, created_at DESC);
