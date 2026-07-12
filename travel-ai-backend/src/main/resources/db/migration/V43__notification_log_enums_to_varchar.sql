-- ─────────────────────────────────────────────────────────────────────────────
-- V43 — Convert notification_log enum columns to VARCHAR
--
-- V7 converted every other enum column to VARCHAR to match the entities'
-- @Enumerated(STRING) mapping, but missed notification_log. Its channel/status
-- stayed Postgres enum types (notification_channel / notification_status), so
-- every INSERT bound as varchar failed — and because EmailService.sendHtml is
-- @Async and only catches MessagingException, the failure was swallowed (emails
-- still sent, but no row was logged). This left the in-app notifications center
-- permanently empty. Align the columns with the rest of the schema.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE notification_log
    ALTER COLUMN channel TYPE VARCHAR(50) USING channel::TEXT,
    ALTER COLUMN status  TYPE VARCHAR(50) USING status::TEXT;
