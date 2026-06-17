-- Foydalanuvchining "inventari" — qo'lidagi materiallar (item + miqdor).
-- "Nima yasay olaman?" qidiruvi shu inventardan avtomatik foydalanadi.
-- Har bir foydalanuvchi-item juftligi bir marta (UNIQUE). Cascade: user/item o'chsa — yozuv ham.
CREATE TABLE user_inventory (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT    NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    craft_item_id BIGINT    NOT NULL REFERENCES craft_items(id) ON DELETE CASCADE,
    quantity      INTEGER   NOT NULL DEFAULT 1 CHECK (quantity > 0),
    CONSTRAINT uq_user_inventory UNIQUE (user_id, craft_item_id)
);

CREATE INDEX idx_user_inventory_user ON user_inventory (user_id);
