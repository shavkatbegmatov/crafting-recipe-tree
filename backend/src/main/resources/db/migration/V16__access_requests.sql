-- "Admin huquqini so'rash" arizalari: oddiy foydalanuvchi yuqori rol so'raydi,
-- super-admin esa tasdiqlaydi yoki rad etadi.
CREATE TABLE access_requests (
    id             BIGSERIAL    PRIMARY KEY,
    -- Foydalanuvchi o'chirilsa, uning arizalari ham o'chadi.
    user_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_role VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    message        TEXT,
    -- Ko'rib chiqqan super-admin o'chirilsa, tarix saqlanib, bog'lanish bo'shaydi.
    reviewed_by    BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    review_note    TEXT,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    reviewed_at    TIMESTAMP
);

-- Holat bo'yicha filtr va "kutilayotganlar soni" badge'i tez ishlashi uchun.
CREATE INDEX idx_access_requests_status ON access_requests (status);
CREATE INDEX idx_access_requests_user   ON access_requests (user_id);

-- Bitta foydalanuvchida ayni vaqtda faqat bitta ochiq (PENDING) ariza bo'la oladi.
-- Yakunlangan arizalar (APPROVED/REJECTED/CANCELLED) bu cheklovga tushmaydi,
-- shuning uchun foydalanuvchi rad etilgandan keyin qayta ariza bera oladi.
CREATE UNIQUE INDEX uq_access_requests_one_pending
    ON access_requests (user_id)
    WHERE status = 'PENDING';
