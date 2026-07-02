-- =============================================================================
-- V47: Trip budget & spending summary
-- Adds an optional budget to a trip (travel_requests) and a table of manual
-- extra expenses. Booked spend is aggregated from the bookings table at read
-- time (linked via proposal_id -> travel_proposals, or by date overlap).
-- =============================================================================

ALTER TABLE travel_requests
    ADD COLUMN budget_amount   NUMERIC(12,2),                        -- NULL = no budget set
    ADD COLUMN budget_currency VARCHAR(3) NOT NULL DEFAULT 'EUR';

-- ---------------------------------------------------------------------------
-- Manual out-of-pocket expenses logged by the traveller against a trip.
-- category: FOOD | TRANSPORT | SHOPPING | ACTIVITIES | OTHER
-- ---------------------------------------------------------------------------
CREATE TABLE trip_expense (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id     UUID           NOT NULL REFERENCES travel_requests (id) ON DELETE CASCADE,
    user_id     UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category    VARCHAR(30)    NOT NULL,
    description VARCHAR(255),
    amount      NUMERIC(12,2)  NOT NULL,
    spent_on    DATE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_expense_trip ON trip_expense (trip_id);
CREATE INDEX idx_trip_expense_user ON trip_expense (user_id);
