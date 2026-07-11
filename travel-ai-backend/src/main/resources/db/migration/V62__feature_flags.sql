CREATE TABLE feature_flags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key    VARCHAR(80)  NOT NULL UNIQUE,
    enabled     BOOLEAN      NOT NULL DEFAULT false,
    description TEXT,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_flags_enabled ON feature_flags (enabled);
