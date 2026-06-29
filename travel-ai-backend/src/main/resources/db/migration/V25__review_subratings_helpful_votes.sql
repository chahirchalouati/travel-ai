-- Sub-ratings: nullable per-aspect scores (1-5). Null means the reviewer skipped the aspect.
ALTER TABLE reviews ADD COLUMN rating_service     SMALLINT;
ALTER TABLE reviews ADD COLUMN rating_value       SMALLINT;
ALTER TABLE reviews ADD COLUMN rating_cleanliness SMALLINT;
ALTER TABLE reviews ADD COLUMN rating_location    SMALLINT;

-- Helpful votes: one row per (review, user) so a user can mark a review helpful at most once.
CREATE TABLE review_helpful_votes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id  UUID NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_review_helpful_vote UNIQUE (review_id, user_id)
);

CREATE INDEX idx_review_helpful_votes_review ON review_helpful_votes (review_id);

-- Backfill helpful_count to match the (currently empty) votes table so the counter is authoritative going forward.
UPDATE reviews SET helpful_count = 0;
