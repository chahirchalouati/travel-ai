-- ─────────────────────────────────────────────────────────────────────────────
-- V35 — Normalise airports key columns to VARCHAR
--
-- V34 created `iata`/`country_code` as CHAR, which Postgres reports as `bpchar`.
-- The JPA Airport entity maps them as String (varchar), so Hibernate schema
-- validation fails ("found bpchar, expecting varchar"). Widen to VARCHAR to
-- match the entity. CHAR→VARCHAR preserves data and is a no-op where already
-- applied as VARCHAR.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE airports ALTER COLUMN iata         TYPE VARCHAR(3);
ALTER TABLE airports ALTER COLUMN country_code TYPE VARCHAR(2);
