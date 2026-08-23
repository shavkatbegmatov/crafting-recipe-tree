-- Kategoriyalarni o'yin versiyasiga bog'lash.
--
-- V27 itemlarni versiyaga bog'lagan edi, kategoriyalar esa global qolgan: natijada
-- yangi o'yin versiyasida eski versiyaning kategoriyalari ham ro'yxatda turardi va
-- aksincha. Endi har kategoriya aynan bitta versiyaga tegishli.
--
-- Taqsimlash qoidasi:
--   * kategoriyani ishlatadigan versiyalar bo'lsa — asl qator ENG ESKI shundaylikda
--     qoladi, qolgan har versiya uchun nusxa yaratiladi va o'sha versiyaning itemlari
--     nusxaga ulanadi;
--   * hech qayerda ishlatilmasa — JORIY versiyaga biriktiriladi (u yaqinda shu versiya
--     uchun yaratilgan bo'lishi ehtimoli yuqori).

ALTER TABLE categories ADD COLUMN game_version_id BIGINT;

-- Kod endi faqat versiya ichida noyob: bir xil kategoriya turli versiyalarda bo'ladi.
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_code_key;

DO $$
DECLARE
    cur       BIGINT;
    cat       RECORD;
    owner_ver BIGINT;
    other_ver RECORD;
    new_id    BIGINT;
BEGIN
    SELECT COALESCE(
        (SELECT id FROM game_versions WHERE is_current LIMIT 1),
        (SELECT id FROM game_versions ORDER BY released_at DESC, id DESC LIMIT 1))
    INTO cur;

    FOR cat IN SELECT id FROM categories ORDER BY id LOOP
        -- Kategoriyani ishlatadigan eng eski versiya asl qatorni oladi.
        SELECT gv.id INTO owner_ver
          FROM craft_items ci
          JOIN game_versions gv ON gv.id = ci.game_version_id
         WHERE ci.category_id = cat.id
         ORDER BY gv.released_at ASC, gv.id ASC
         LIMIT 1;

        IF owner_ver IS NULL THEN
            -- Ishlatilmagan kategoriya — joriy versiyaga.
            UPDATE categories SET game_version_id = cur WHERE id = cat.id;
            CONTINUE;
        END IF;

        UPDATE categories SET game_version_id = owner_ver WHERE id = cat.id;

        -- Qolgan har bir versiya uchun nusxa va o'sha versiya itemlarini unga ulash.
        FOR other_ver IN
            SELECT DISTINCT ci.game_version_id AS gv_id
              FROM craft_items ci
             WHERE ci.category_id = cat.id
               AND ci.game_version_id <> owner_ver
        LOOP
            INSERT INTO categories (code, name_ru, name_uz, name_en, name_uz_cyr,
                                    color, icon, sort_order, game_version_id)
            SELECT c.code, c.name_ru, c.name_uz, c.name_en, c.name_uz_cyr,
                   c.color, c.icon, c.sort_order, other_ver.gv_id
              FROM categories c WHERE c.id = cat.id
            RETURNING id INTO new_id;

            UPDATE craft_items
               SET category_id = new_id
             WHERE category_id = cat.id
               AND game_version_id = other_ver.gv_id;
        END LOOP;
    END LOOP;
END $$;

ALTER TABLE categories ALTER COLUMN game_version_id SET NOT NULL;

ALTER TABLE categories
    ADD CONSTRAINT fk_categories_game_version
    FOREIGN KEY (game_version_id) REFERENCES game_versions (id);

ALTER TABLE categories
    ADD CONSTRAINT uq_categories_code_version UNIQUE (code, game_version_id);

-- Kompozit tashqi kalit uchun kerak.
ALTER TABLE categories
    ADD CONSTRAINT uq_categories_id_version UNIQUE (id, game_version_id);

-- Item va uning kategoriyasi AYNAN bir versiyada bo'lishini DB kafolatlaydi:
-- kod xatosi jimgina versiyalararo bog'lanish yarata olmaydi.
ALTER TABLE craft_items
    ADD CONSTRAINT fk_craft_items_category_version
    FOREIGN KEY (category_id, game_version_id)
    REFERENCES categories (id, game_version_id);

CREATE INDEX IF NOT EXISTS idx_categories_game_version ON categories (game_version_id);
