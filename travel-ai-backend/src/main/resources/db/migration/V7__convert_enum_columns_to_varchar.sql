-- ============================================================
-- V7 — Convert native PostgreSQL enum columns to VARCHAR
-- Reason: Hibernate @Enumerated(EnumType.STRING) sends
-- character varying; native PG enum types reject this.
-- Java enum values also diverge from PG enum labels for
-- payment_type, payment_status, and proposal_status.
-- Converting to VARCHAR lets Hibernate store the Java enum
-- name directly without any casting issue.
-- ============================================================

-- ─── users ───────────────────────────────────────────────────
ALTER TABLE users
    ALTER COLUMN role TYPE VARCHAR(50) USING role::TEXT;

-- ─── user_preferences ────────────────────────────────────────
ALTER TABLE user_preferences
    ALTER COLUMN spending_priority TYPE VARCHAR(50) USING spending_priority::TEXT;

-- ─── partners ────────────────────────────────────────────────
ALTER TABLE partners
    ALTER COLUMN type   TYPE VARCHAR(50) USING type::TEXT,
    ALTER COLUMN status TYPE VARCHAR(50) USING status::TEXT;

-- ─── travel_requests ─────────────────────────────────────────
ALTER TABLE travel_requests
    ALTER COLUMN date_mode         TYPE VARCHAR(50) USING date_mode::TEXT,
    ALTER COLUMN spending_priority TYPE VARCHAR(50) USING spending_priority::TEXT;

-- ─── travel_proposals ────────────────────────────────────────
ALTER TABLE travel_proposals
    ALTER COLUMN status TYPE VARCHAR(50) USING status::TEXT;

-- ─── bookings ────────────────────────────────────────────────
ALTER TABLE bookings
    ALTER COLUMN status TYPE VARCHAR(50) USING status::TEXT;

-- ─── payments ────────────────────────────────────────────────
ALTER TABLE payments
    ALTER COLUMN gateway TYPE VARCHAR(50) USING gateway::TEXT,
    ALTER COLUMN status  TYPE VARCHAR(50) USING status::TEXT;

-- The 'type' column was renamed from 'payment_type' in V5.
-- Convert whichever name currently exists.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'type'
    ) THEN
        ALTER TABLE payments ALTER COLUMN type TYPE VARCHAR(50) USING type::TEXT;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'payment_type'
    ) THEN
        ALTER TABLE payments ALTER COLUMN payment_type TYPE VARCHAR(50) USING payment_type::TEXT;
    END IF;
END $$;

-- ─── payment_webhooks ────────────────────────────────────────
ALTER TABLE payment_webhooks
    ALTER COLUMN gateway TYPE VARCHAR(50) USING gateway::TEXT;

-- ─── ai_audit_logs ───────────────────────────────────────────
ALTER TABLE ai_audit_logs
    ALTER COLUMN agent TYPE VARCHAR(50) USING agent::TEXT;

-- ─── Drop now-unused custom enum types (safe to ignore if other objects depend on them) ───
DO $$ BEGIN DROP TYPE IF EXISTS user_role CASCADE;        EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS partner_type CASCADE;     EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS partner_status CASCADE;   EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS booking_status CASCADE;   EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS payment_status CASCADE;   EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS payment_type CASCADE;     EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS payment_gateway CASCADE;  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS proposal_status CASCADE;  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS spending_priority CASCADE;EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS date_mode CASCADE;        EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS agent_type CASCADE;       EXCEPTION WHEN others THEN NULL; END $$;
