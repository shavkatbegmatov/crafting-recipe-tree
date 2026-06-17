-- Foydalanuvchining sevimli (yulduzchali) itemlari.
-- Har bir foydalanuvchi-item juftligi bir marta — UNIQUE bilan kafolatlanadi.
-- Foydalanuvchi yoki item o'chsa, mos yozuvlar avtomatik o'chadi (ON DELETE CASCADE).
CREATE TABLE user_favorites (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT    NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    craft_item_id BIGINT    NOT NULL REFERENCES craft_items(id) ON DELETE CASCADE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_favorite UNIQUE (user_id, craft_item_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites (user_id, created_at DESC);
