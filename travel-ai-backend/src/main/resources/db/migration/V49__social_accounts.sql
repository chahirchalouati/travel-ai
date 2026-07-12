-- =============================================================================
-- V49: Social login accounts (Google now; structured so Apple can be added later).
--
-- social_account links an external identity provider identity to a local users
-- row. provider is a VARCHAR (mapped by @Enumerated(STRING) — never a Postgres
-- enum type, to stay compatible with Hibernate ddl-auto: validate). For Google
-- provider_user_id holds the OpenID `sub` claim, which is stable and unique per
-- Google account. A single user may link several providers, but a given
-- (provider, provider_user_id) pair maps to exactly one account.
-- =============================================================================

CREATE TABLE social_account (
    id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider          VARCHAR(32)   NOT NULL,
    provider_user_id  VARCHAR(255)  NOT NULL,
    email             VARCHAR(320),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_account_provider_sub UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_social_account_user ON social_account (user_id);
