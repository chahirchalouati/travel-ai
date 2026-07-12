-- Messaging: user inbox of conversations with the platform / support / partners.

CREATE TABLE conversations (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL,
    subject         VARCHAR(200) NOT NULL,
    last_message_at TIMESTAMPTZ NOT NULL,
    unread_for_user BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_conversations_user ON conversations (user_id, last_message_at DESC);

CREATE TABLE conversation_messages (
    id              UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender          VARCHAR(20) NOT NULL,
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_messages_conversation ON conversation_messages (conversation_id, created_at);
