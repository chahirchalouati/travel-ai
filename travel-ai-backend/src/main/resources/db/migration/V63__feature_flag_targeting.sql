-- Feature flags "pro": percentage rollout, role targeting and grouping.
ALTER TABLE feature_flags
    ADD COLUMN rollout_percentage INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN target_roles       TEXT,
    ADD COLUMN group_name         VARCHAR(80);

-- Keep already-defined flags fully on for everyone (explicit, matches the new default).
UPDATE feature_flags SET rollout_percentage = 100 WHERE rollout_percentage IS NULL;
