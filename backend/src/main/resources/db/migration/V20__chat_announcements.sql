-- Chat e'lonlari (pinned announcement): super-admin chat tepasida e'lon qo'yadi.
-- Faol e'lon — eng so'nggi qator. "Tozalash" amali barcha qatorlarni o'chiradi.
CREATE TABLE chat_announcements (
    id              BIGSERIAL    PRIMARY KEY,
    message         TEXT         NOT NULL,
    author_username VARCHAR(50),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_announcements_created ON chat_announcements (created_at DESC);
