-- Global chat messages table
CREATE TABLE chat_messages (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id),
    content    TEXT         NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_created_at ON chat_messages (created_at DESC);
