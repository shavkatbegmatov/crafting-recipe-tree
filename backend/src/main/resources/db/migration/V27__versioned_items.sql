-- Itemlarni o'yin versiyasiga bog'lash.
--
-- Ilgari craft_items GLOBAL edi: har bir item barcha versiyalarda ko'rinardi va yangi
-- versiya yaratilganda avtomatik "meros" bo'lardi. Endi har bir item aniq bir
-- versiyaga tegishli; yangi versiya BO'SH boshlanadi va kerakli itemlar eski
-- versiyadan nusxa olinadi.
--
-- Versiyalar bo'ylab "bu bir xil item" ekanini bilish uchun barqaror `item_key`
-- ishlatiladi (nusxa olishda o'zgarmaydi) — versiyani almashtirganda foydalanuvchini
-- mos itemga olib o'tish uchun.
--
-- MAVJUD MA'LUMOT. Itemlar retseptlari eng ko'p bo'lgan versiyaga biriktiriladi.
-- Agar BOSHQA versiyalarda ham retsept bo'lsa, o'sha retseptlar ishlatadigan itemlar
-- shu versiyalarga NUSXA qilinadi va retsept/ingredient bog'lanishlari nusxalarga
-- qayta ulanadi — aks holda quyidagi kompozit kalitlar ularni rad etardi.

-- =========================================================================
-- 1. Ustunlar (avval nullable)
-- =========================================================================
ALTER TABLE craft_items ADD COLUMN game_version_id BIGINT;
ALTER TABLE craft_items ADD COLUMN item_key        VARCHAR(140);

-- Nom global UNIQUE edi — endi u versiya ichida unique bo'ladi, chunki bir xil item
-- turli versiyalarda bir xil nom bilan mavjud bo'ladi. Yangi cheklov quyida,
-- backfill tugagach qo'shiladi.
ALTER TABLE craft_items DROP CONSTRAINT IF EXISTS craft_items_name_key;

-- =========================================================================
-- 2. Backfill + boshqa versiyalar uchun nusxalar
-- =========================================================================
DO $$
DECLARE
    prim   BIGINT;
    rec    RECORD;
    new_id BIGINT;
BEGIN
    -- Asosiy versiya: retseptlari eng ko'p bo'lgani; retsept umuman bo'lmasa — eng eskisi.
    SELECT COALESCE(
        (SELECT r.game_version_id FROM recipes r
          GROUP BY r.game_version_id ORDER BY COUNT(*) DESC, r.game_version_id ASC LIMIT 1),
        (SELECT id FROM game_versions ORDER BY released_at ASC, id ASC LIMIT 1))
    INTO prim;

    UPDATE craft_items SET game_version_id = prim WHERE game_version_id IS NULL;

    -- item_key: inglizcha nomdan o'qiladigan slug + id (id tufayli takrorlanmaydi).
    UPDATE craft_items
    SET item_key = btrim(
            lower(regexp_replace(COALESCE(NULLIF(btrim(name_en), ''), 'item'), '[^a-zA-Z0-9]+', '-', 'g')),
            '-') || '-' || id
    WHERE item_key IS NULL;

    CREATE TEMP TABLE _item_copy_map (
        src_item_id BIGINT,
        gv_id       BIGINT,
        new_item_id BIGINT
    ) ON COMMIT DROP;

    -- Asosiy bo'lmagan versiyalardagi retseptlar ishlatadigan har bir item uchun nusxa.
    FOR rec IN
        SELECT DISTINCT gv_id, item_id
        FROM (
            SELECT r.game_version_id AS gv_id, r.result_item_id AS item_id
              FROM recipes r
            UNION
            SELECT r.game_version_id, ri.ingredient_item_id
              FROM recipe_ingredients ri
              JOIN recipes r ON r.id = ri.recipe_id
        ) x
        WHERE gv_id <> prim
    LOOP
        INSERT INTO craft_items (
            name, description, category_id, craft_time_seconds, image_url,
            name_uz, name_en, name_uz_cyr, description_uz, description_en, description_uz_cyr,
            game_version_id, item_key, created_at, updated_at)
        SELECT
            ci.name, ci.description, ci.category_id, ci.craft_time_seconds, ci.image_url,
            ci.name_uz, ci.name_en, ci.name_uz_cyr, ci.description_uz, ci.description_en, ci.description_uz_cyr,
            rec.gv_id, ci.item_key, NOW(), NOW()
        FROM craft_items ci
        WHERE ci.id = rec.item_id
        RETURNING id INTO new_id;

        INSERT INTO _item_copy_map VALUES (rec.item_id, rec.gv_id, new_id);

        -- Teglar ham nusxaga ko'chiriladi.
        INSERT INTO item_tags (item_id, tag_id)
        SELECT new_id, it.tag_id FROM item_tags it WHERE it.item_id = rec.item_id;
    END LOOP;

    -- Bog'lanishlarni nusxalarga qayta ulaymiz.
    UPDATE recipes r
    SET result_item_id = m.new_item_id
    FROM _item_copy_map m
    WHERE m.src_item_id = r.result_item_id
      AND m.gv_id       = r.game_version_id;

    UPDATE recipe_ingredients ri
    SET ingredient_item_id = m.new_item_id
    FROM _item_copy_map m, recipes r
    WHERE r.id          = ri.recipe_id
      AND m.gv_id       = r.game_version_id
      AND m.src_item_id = ri.ingredient_item_id;
END $$;

ALTER TABLE craft_items ALTER COLUMN game_version_id SET NOT NULL;
ALTER TABLE craft_items ALTER COLUMN item_key        SET NOT NULL;

-- =========================================================================
-- 3. Cheklovlar
-- =========================================================================
ALTER TABLE craft_items
    ADD CONSTRAINT fk_craft_items_game_version
    FOREIGN KEY (game_version_id) REFERENCES game_versions (id) ON DELETE RESTRICT;

-- Bitta versiya ichida item_key takrorlanmaydi; turli versiyalarda esa AYNAN
-- bir xil bo'ladi — bu o'sha itemning boshqa versiyadagi nusxasi.
ALTER TABLE craft_items
    ADD CONSTRAINT uq_craft_items_key_version UNIQUE (item_key, game_version_id);

-- Nom ham endi versiya ichida unique (ilgari global UNIQUE edi).
ALTER TABLE craft_items
    ADD CONSTRAINT uq_craft_items_name_version UNIQUE (name, game_version_id);

-- Quyidagi kompozit tashqi kalitlar uchun kerak.
ALTER TABLE craft_items
    ADD CONSTRAINT uq_craft_items_id_version UNIQUE (id, game_version_id);

CREATE INDEX idx_craft_items_game_version ON craft_items (game_version_id);

-- =========================================================================
-- 4. recipes → faqat O'Z versiyasidagi itemga bog'lansin
-- =========================================================================
-- Kompozit FK tufayli retseptni boshqa versiyadagi itemga ulash DB darajasida
-- imkonsiz — nusxa olishdagi xato jimgina buzuq daraxt yaratmaydi.
ALTER TABLE recipes ADD CONSTRAINT uq_recipes_id_version UNIQUE (id, game_version_id);

ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_result_item_id_fkey;
ALTER TABLE recipes
    ADD CONSTRAINT fk_recipes_item_version
    FOREIGN KEY (result_item_id, game_version_id)
    REFERENCES craft_items (id, game_version_id) ON DELETE CASCADE;

-- =========================================================================
-- 5. recipe_ingredients → o'z versiyasi ichida qolsin
-- =========================================================================
ALTER TABLE recipe_ingredients ADD COLUMN game_version_id BIGINT;

UPDATE recipe_ingredients ri
SET game_version_id = r.game_version_id
FROM recipes r
WHERE r.id = ri.recipe_id;

ALTER TABLE recipe_ingredients ALTER COLUMN game_version_id SET NOT NULL;

ALTER TABLE recipe_ingredients DROP CONSTRAINT IF EXISTS fk_recipe_ingredients_recipe;
ALTER TABLE recipe_ingredients
    ADD CONSTRAINT fk_recipe_ingredients_recipe_version
    FOREIGN KEY (recipe_id, game_version_id)
    REFERENCES recipes (id, game_version_id) ON DELETE CASCADE;

-- Ingredient ham SHU versiyadagi item bo'lishi shart.
-- ON DELETE ataylab berilmagan (NO ACTION): retseptda ishlatilayotgan itemni
-- o'chirishga urinish xato beradi — avvalgi xatti-harakat saqlanadi.
ALTER TABLE recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_ingredient_item_id_fkey;
ALTER TABLE recipe_ingredients
    ADD CONSTRAINT fk_recipe_ingredients_item_version
    FOREIGN KEY (ingredient_item_id, game_version_id)
    REFERENCES craft_items (id, game_version_id);

CREATE INDEX idx_recipe_ingredients_game_version ON recipe_ingredients (game_version_id);
