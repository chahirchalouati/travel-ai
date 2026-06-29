-- =============================================================================
-- V27: Reactive Living Itinerary (V1 — manual trigger + AI re-plan + approval)
-- Status/type columns are VARCHAR to match the codebase convention (see V7).
-- =============================================================================

CREATE TABLE live_itineraries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    watch_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_live_itineraries_booking ON live_itineraries (booking_id);

CREATE TABLE itinerary_segments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id    UUID NOT NULL REFERENCES live_itineraries(id) ON DELETE CASCADE,
    segment_type    VARCHAR(30) NOT NULL,                 -- FLIGHT | HOTEL | RESTAURANT
    entity_id       UUID NOT NULL,
    label           VARCHAR(255),
    current_status  VARCHAR(30) NOT NULL DEFAULT 'ON_SCHEDULE',
    scheduled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_itinerary_segments_itinerary ON itinerary_segments (itinerary_id);

CREATE TABLE itinerary_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id      UUID NOT NULL REFERENCES itinerary_segments(id) ON DELETE CASCADE,
    source          VARCHAR(30) NOT NULL,                 -- MANUAL | SCHEDULED_POLL | WEBHOOK
    description     TEXT NOT NULL,
    disruption_data TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_itinerary_events_segment ON itinerary_events (segment_id);

CREATE TABLE itinerary_proposals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id        UUID NOT NULL REFERENCES live_itineraries(id) ON DELETE CASCADE,
    triggering_event_id UUID REFERENCES itinerary_events(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    ai_summary          TEXT,
    expires_at          TIMESTAMPTZ NOT NULL,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_itinerary_proposals_itinerary ON itinerary_proposals (itinerary_id, status);

CREATE TABLE proposed_changes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id           UUID NOT NULL REFERENCES itinerary_proposals(id) ON DELETE CASCADE,
    segment_id            UUID NOT NULL REFERENCES itinerary_segments(id),
    change_type           VARCHAR(40) NOT NULL,           -- REPLACE_FLIGHT | REPLACE_HOTEL | REPLACE_RESTAURANT | ADJUST_TIME | CANCEL_SEGMENT
    replacement_entity_id UUID,
    replacement_label     VARCHAR(255),
    cost_delta            NUMERIC(10,2),
    ai_rationale          TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_proposed_changes_proposal ON proposed_changes (proposal_id);
