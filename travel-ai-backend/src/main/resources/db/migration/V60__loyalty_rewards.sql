-- =============================================================================
-- V60: Loyalty rewards program (thresholds -> unlocked rewards)
-- Builds on the loyalty points program (V48). Two paths converge on a member
-- reward instance:
--   MILESTONE   : crossing a lifetime-points threshold auto-unlocks a reward,
--                 kept forever, without spending points.
--   REDEEMABLE  : spending the points balance claims a reward from the catalogue.
--   loyalty_reward        : the sellable/unlockable catalogue (server-authoritative).
--   loyalty_member_reward : a reward a user has unlocked or claimed.
-- =============================================================================

CREATE TABLE loyalty_reward (
    id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    code              VARCHAR(40)   NOT NULL UNIQUE,
    name              VARCHAR(120)  NOT NULL,
    description       VARCHAR(255),
    type              VARCHAR(20)   NOT NULL,               -- VOUCHER | PERK | GIFT
    unlock_kind       VARCHAR(20)   NOT NULL,               -- MILESTONE | REDEEMABLE
    threshold_points  INT,                                  -- MILESTONE: lifetime points required
    cost_points       INT,                                  -- REDEEMABLE: balance cost
    discount_amount   NUMERIC(12,2),                        -- VOUCHER: fixed EUR value
    discount_pct      NUMERIC(5,2),                         -- VOUCHER: percentage value (alt to amount)
    perk_code         VARCHAR(40),                          -- PERK: which benefit
    valid_days        INT,                                  -- days the unlocked reward stays usable (null = no expiry)
    active            BOOLEAN       NOT NULL DEFAULT TRUE,
    sort_order        INT           NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE loyalty_member_reward (
    id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_code      VARCHAR(40)   NOT NULL,
    source           VARCHAR(20)   NOT NULL,                -- MILESTONE | REDEMPTION
    status           VARCHAR(20)   NOT NULL DEFAULT 'UNLOCKED', -- UNLOCKED | USED | EXPIRED
    type             VARCHAR(20)   NOT NULL,                -- snapshot of reward type
    discount_amount  NUMERIC(12,2),                         -- snapshot for VOUCHER
    discount_pct     NUMERIC(5,2),
    perk_code        VARCHAR(40),
    unlocked_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    expires_at       TIMESTAMPTZ,
    used_at          TIMESTAMPTZ,
    booking_id       UUID,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_member_reward_user_status ON loyalty_member_reward (user_id, status);

-- A given milestone reward can be auto-unlocked at most once per user.
CREATE UNIQUE INDEX uq_member_reward_milestone
    ON loyalty_member_reward (user_id, reward_code)
    WHERE source = 'MILESTONE';

-- Seed the catalogue -------------------------------------------------------
INSERT INTO loyalty_reward
    (code, name, description, type, unlock_kind, threshold_points, cost_points,
     discount_amount, discount_pct, perk_code, valid_days, sort_order)
VALUES
    -- Milestones: crossed on lifetime points, kept forever.
    ('MILESTONE_VOUCHER_15', 'EUR 15 travel voucher',
     'Unlocked at 2,000 lifetime points. A EUR 15 discount on a future booking.',
     'VOUCHER', 'MILESTONE', 2000, NULL, 15.00, NULL, NULL, 365, 10),
    ('MILESTONE_PERK_CHECKIN', 'Priority check-in',
     'Unlocked at 3,500 lifetime points. Priority check-in on your next trip.',
     'PERK', 'MILESTONE', 3500, NULL, NULL, NULL, 'PRIORITY_CHECKIN', 365, 20),
    ('MILESTONE_GIFT_KIT', 'Travel essentials kit',
     'Unlocked at 7,500 lifetime points. A physical travel kit shipped to you.',
     'GIFT', 'MILESTONE', 7500, NULL, NULL, NULL, NULL, NULL, 30),
    -- Redeemable: claimed by spending the points balance.
    ('SHOP_VOUCHER_10', 'EUR 10 voucher (1,500 pts)',
     'Redeem 1,500 points for a EUR 10 discount on a future booking.',
     'VOUCHER', 'REDEEMABLE', NULL, 1500, 10.00, NULL, NULL, 180, 40),
    ('SHOP_PERK_FLEX', 'Flexible cancellation (4,000 pts)',
     'Redeem 4,000 points for free flexible cancellation on a booking.',
     'PERK', 'REDEEMABLE', NULL, 4000, NULL, NULL, 'FLEX_CANCELLATION', 180, 50);
