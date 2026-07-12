-- V64: favorites table — persisted wishlist entries per user/entity combination.
-- entity_type stored uppercase (HOTEL, FLIGHT, RESTAURANT, ATTRACTION, CRUISE).
-- entity_id stored as text to support both UUID-keyed and numeric-keyed entities.

CREATE TABLE favorites (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   VARCHAR(100) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    subtitle    VARCHAR(255),
    image_url   VARCHAR(1000),
    route       VARCHAR(500) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_favorites PRIMARY KEY (id),
    CONSTRAINT uq_favorite_user_type_entity UNIQUE (user_id, entity_type, entity_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_favorites_user_id ON favorites (user_id);
CREATE INDEX idx_favorites_user_type ON favorites (user_id, entity_type);
