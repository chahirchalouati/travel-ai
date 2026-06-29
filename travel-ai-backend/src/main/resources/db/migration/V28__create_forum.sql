-- =============================================================================
-- V28: Community Q&A / Forum
-- TripAdvisor-style traveler forums. Questions can be tagged to a target
-- (DESTINATION / ATTRACTION / HOTEL ...) and/or a free-text location.
-- =============================================================================

CREATE TABLE forum_questions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id    UUID NOT NULL,
    author_name  VARCHAR(255) NOT NULL,
    target_type  VARCHAR(40),
    target_id    UUID,
    location     VARCHAR(255),
    title        VARCHAR(300) NOT NULL,
    body         TEXT NOT NULL,
    answer_count INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_forum_questions_target  ON forum_questions (target_type, target_id);
CREATE INDEX idx_forum_questions_created ON forum_questions (created_at DESC);

CREATE TABLE forum_answers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id   UUID NOT NULL REFERENCES forum_questions(id) ON DELETE CASCADE,
    author_id     UUID NOT NULL,
    author_name   VARCHAR(255) NOT NULL,
    body          TEXT NOT NULL,
    helpful_count INT NOT NULL DEFAULT 0,
    accepted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_forum_answers_question ON forum_answers (question_id);
