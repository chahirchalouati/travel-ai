-- V44: password reset tokens + email verification token
-- users.email_verified exists since V1 (DEFAULT FALSE). Existing accounts predate
-- verification emails, so grandfather them in as verified; new rows keep FALSE.
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(64);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
