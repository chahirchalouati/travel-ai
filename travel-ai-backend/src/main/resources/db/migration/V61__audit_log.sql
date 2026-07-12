CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor       VARCHAR(255) NOT NULL,
    method      VARCHAR(10)  NOT NULL,
    path        TEXT         NOT NULL,
    action      VARCHAR(255) NOT NULL,
    target_id   VARCHAR(255),
    status_code INTEGER      NOT NULL,
    ip          VARCHAR(64),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
