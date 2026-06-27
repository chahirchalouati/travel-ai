CREATE TYPE notification_channel AS ENUM ('EMAIL', 'PUSH', 'IN_APP');
CREATE TYPE notification_status  AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE notification_log (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID,
    channel       notification_channel NOT NULL DEFAULT 'EMAIL',
    recipient     VARCHAR(255) NOT NULL,
    subject       VARCHAR(500),
    body          TEXT,
    status        notification_status NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_log_user   ON notification_log(user_id);
CREATE INDEX idx_notification_log_status ON notification_log(status);
