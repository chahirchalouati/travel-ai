CREATE TABLE contact_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(120)  NOT NULL,
    email      VARCHAR(200)  NOT NULL,
    subject    VARCHAR(120)  NOT NULL,
    message    TEXT          NOT NULL,
    status     VARCHAR(32)   NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_messages_created_at ON contact_messages (created_at DESC);
CREATE INDEX idx_contact_messages_status ON contact_messages (status);
