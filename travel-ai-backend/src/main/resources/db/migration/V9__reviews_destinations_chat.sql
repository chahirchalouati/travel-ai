-- =============================================================================
-- V9: Reviews, Destinations, and AI Chat tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. DESTINATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE destinations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)   NOT NULL,
    country         VARCHAR(255)   NOT NULL,
    continent       VARCHAR(100),
    description     TEXT,
    image_url       VARCHAR(1024),
    gallery_urls    TEXT,
    tags            VARCHAR(512),
    climate         VARCHAR(100),
    best_months     VARCHAR(100),
    avg_daily_cost  NUMERIC(10,2),
    currency        VARCHAR(10),
    language        VARCHAR(100),
    timezone        VARCHAR(100),
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),
    popularity_score INT          NOT NULL DEFAULT 0,
    featured        BOOLEAN       NOT NULL DEFAULT FALSE,
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_destinations_country   ON destinations (LOWER(country));
CREATE INDEX idx_destinations_continent ON destinations (LOWER(continent));
CREATE INDEX idx_destinations_featured  ON destinations (featured) WHERE featured = TRUE;
CREATE INDEX idx_destinations_popular   ON destinations (popularity_score DESC);

-- ---------------------------------------------------------------------------
-- 2. REVIEWS
-- ---------------------------------------------------------------------------
CREATE TABLE reviews (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID         NOT NULL REFERENCES users(id),
    target_type             VARCHAR(50)  NOT NULL,
    target_id               UUID         NOT NULL,
    rating                  SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title                   VARCHAR(500),
    content                 TEXT,
    photo_urls              TEXT,
    helpful_count           INT          NOT NULL DEFAULT 0,
    verified                BOOLEAN      NOT NULL DEFAULT FALSE,
    ai_summary_contribution TEXT,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_target     ON reviews (target_type, target_id);
CREATE INDEX idx_reviews_user       ON reviews (user_id);
CREATE UNIQUE INDEX idx_reviews_unique_per_user ON reviews (user_id, target_type, target_id);

-- ---------------------------------------------------------------------------
-- 3. AI CHAT CONVERSATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE chat_conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id),
    title       VARCHAR(500),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_conversations_user ON chat_conversations (user_id);

-- ---------------------------------------------------------------------------
-- 4. AI CHAT MESSAGES
-- ---------------------------------------------------------------------------
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID         NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20)  NOT NULL,
    content         TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages (conversation_id, created_at);
