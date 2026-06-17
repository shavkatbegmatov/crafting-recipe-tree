-- Chatga "javob berish" (reply) va "tahrirlash" (edit) qo'llab-quvvatlash.
-- reply_to_id: javob berilgan xabar (o'z-o'ziga FK). O'sha xabar o'chsa — bog'lanish uziladi (SET NULL),
-- javob xabarning o'zi qoladi. edited_at: tahrirlangan vaqt (null — tahrirlanmagan).
ALTER TABLE chat_messages
    ADD COLUMN reply_to_id BIGINT REFERENCES chat_messages(id) ON DELETE SET NULL;

ALTER TABLE chat_messages
    ADD COLUMN edited_at TIMESTAMP;

CREATE INDEX idx_chat_messages_reply_to ON chat_messages (reply_to_id);
