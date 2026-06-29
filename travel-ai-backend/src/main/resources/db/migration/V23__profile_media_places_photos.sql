-- Profile enrichment: persisted avatar/cover/bio, travel-map places and a photo gallery.

ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN cover_url  VARCHAR(500);
ALTER TABLE users ADD COLUMN bio        VARCHAR(500);
ALTER TABLE users ADD COLUMN location   VARCHAR(120);
ALTER TABLE users ADD COLUMN handle     VARCHAR(60);

-- Places pinned on the user's travel map.
CREATE TABLE user_places (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name        VARCHAR(160) NOT NULL,
    country     VARCHAR(120),
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    note        VARCHAR(500),
    visited_on  DATE,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_user_places_user ON user_places (user_id, visited_on DESC);

-- Photos uploaded to the user's personal gallery.
CREATE TABLE user_photos (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    caption     VARCHAR(280),
    place       VARCHAR(160),
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_user_photos_user ON user_photos (user_id, created_at DESC);
