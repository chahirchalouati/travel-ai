-- =============================================================================
-- V46: Trip collaboration — travel companions + itinerary segment voting.
--
-- trip_member: a person invited to a trip. In this schema a routable "trip" is
-- a booking (the /trips page lists bookings and /trips/:id/live is keyed by
-- booking id, with live_itineraries.booking_id hanging off it), so trip_id
-- references bookings. user_id stays NULL until the invite is accepted by an
-- authenticated user.
--
-- segment_vote: one UP/DOWN vote per (segment, user) on an itinerary stop.
-- =============================================================================

CREATE TABLE trip_member (
    id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id        UUID           NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
    user_id        UUID           REFERENCES users (id) ON DELETE SET NULL,
    invited_email  VARCHAR(320)   NOT NULL,
    role           VARCHAR(20)    NOT NULL,                    -- VIEWER | EDITOR
    status         VARCHAR(20)    NOT NULL DEFAULT 'PENDING',  -- PENDING | ACCEPTED | DECLINED
    invite_token   VARCHAR(64)    NOT NULL UNIQUE,
    responded_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_member_trip ON trip_member (trip_id);
CREATE INDEX idx_trip_member_user ON trip_member (user_id);

CREATE TABLE segment_vote (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_id  UUID          NOT NULL REFERENCES itinerary_segments (id) ON DELETE CASCADE,
    user_id     UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    vote        VARCHAR(10)   NOT NULL,                        -- UP | DOWN
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_segment_vote UNIQUE (segment_id, user_id)
);

CREATE INDEX idx_segment_vote_segment ON segment_vote (segment_id);
