-- Chat xabarlariga emoji reaksiyalar. Bir foydalanuvchi bitta xabarga bir emoji'ni bir marta
-- qo'ya oladi (UNIQUE). Xabar yoki foydalanuvchi o'chsa — reaksiyalar ham (ON DELETE CASCADE).
CREATE TABLE chat_message_reactions (
    id         BIGSERIAL   PRIMARY KEY,
    message_id BIGINT      NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    emoji      VARCHAR(16) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_chat_reaction UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX idx_chat_reactions_message ON chat_message_reactions (message_id);
