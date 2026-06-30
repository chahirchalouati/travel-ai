-- =============================================================================
-- V29: Cascade proposed_changes when its segment is deleted
-- -----------------------------------------------------------------------------
-- V27 created proposed_changes.segment_id as a FK to itinerary_segments(id)
-- WITHOUT ON DELETE CASCADE. Deleting a booking cascades through
-- live_itineraries -> itinerary_segments, but that segment delete is BLOCKED
-- whenever a proposed_changes row still references it, raising an FK violation
-- (e.g. "Key (id)=(...) is still referenced from table proposed_changes").
-- This made deleting a booking — or a user account via booking cascade —
-- impossible once any itinerary proposal existed.
--
-- A proposed change is meaningless without its segment, so cascade is the
-- correct behavior here (mirrors itinerary_events.segment_id in V27). The
-- proposal-level history is still independently retained via the
-- proposal_id -> itinerary_proposals cascade, which is driven by the booking
-- lifecycle rather than per-segment churn.
-- =============================================================================

ALTER TABLE proposed_changes
    DROP CONSTRAINT proposed_changes_segment_id_fkey;

ALTER TABLE proposed_changes
    ADD CONSTRAINT proposed_changes_segment_id_fkey
        FOREIGN KEY (segment_id) REFERENCES itinerary_segments(id) ON DELETE CASCADE;
