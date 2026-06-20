-- Chat fayl ulanmalari (rasm/hujjat). Ma'lumot DB'da (BYTEA) saqlanadi — deploy'da yo'qolmaydi,
-- alohida obyekt-saqlash (S3 va h.k.) infratuzilmasi talab qilinmaydi. Hajm controller'da cheklangan.
CREATE TABLE chat_attachments (
    id             BIGSERIAL    PRIMARY KEY,
    filename       VARCHAR(255) NOT NULL,
    content_type   VARCHAR(100) NOT NULL,
    size_bytes     BIGINT       NOT NULL,
    data           BYTEA        NOT NULL,
    uploaded_by_id BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Xabarga ixtiyoriy fayl. Ulanma o'chsa — xabar qoladi (SET NULL).
ALTER TABLE chat_messages
    ADD COLUMN attachment_id BIGINT REFERENCES chat_attachments(id) ON DELETE SET NULL;
