-- =============================================================================
-- V50: Two-factor authentication (TOTP / authenticator apps)
-- Adds an opt-in TOTP second factor. mfa_secret holds the base32 shared secret
-- (populated at setup, but only enforced once mfa_enabled flips true after the
-- user verifies a code). One-time recovery codes are stored hashed.
-- Existing rows default to disabled.
-- =============================================================================

ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN mfa_secret  VARCHAR(64);

CREATE TABLE mfa_recovery_code (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   VARCHAR(100) NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_recovery_code_user ON mfa_recovery_code (user_id);
