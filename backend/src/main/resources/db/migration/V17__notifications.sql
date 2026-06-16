-- Foydalanuvchi bildirishnomalari: real-vaqt WebSocket push + doimiy tarix.
-- Sarlavha/tana matni saqlanmaydi — frontend i18n type bo'yicha render qiladi (til-mustaqil).
CREATE TABLE notifications (
    id             BIGSERIAL    PRIMARY KEY,
    -- Foydalanuvchi o'chirilsa, uning bildirishnomalari ham o'chadi.
    recipient_id   BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type           VARCHAR(50)  NOT NULL,
    actor_username VARCHAR(50),
    link           VARCHAR(300),
    is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Asosiy so'rovlar: "mening o'qilmaganlarim soni" va "mening so'nggi bildirishnomalarim".
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, is_read);
CREATE INDEX idx_notifications_recipient_created ON notifications (recipient_id, created_at DESC);
