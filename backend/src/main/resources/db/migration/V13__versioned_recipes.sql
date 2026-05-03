-- Versioned recipes: GameVersion + Recipe entities, RecipeIngredient refactor.
-- Mavjud retseptlar "1.0.0" baseline versiyaga ko'chiriladi.

-- =========================================================================
-- 1. game_versions
-- =========================================================================
CREATE TABLE game_versions (
    id          BIGSERIAL PRIMARY KEY,
    version     VARCHAR(50) UNIQUE NOT NULL,
    released_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    notes       TEXT,
    is_current  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Faqat bittasi current bo'lishi mumkin (partial unique index).
CREATE UNIQUE INDEX uq_game_versions_current
    ON game_versions (is_current)
    WHERE is_current = TRUE;

CREATE INDEX idx_game_versions_released_at ON game_versions (released_at DESC);

-- Initial baseline versiya (mavjud retseptlar shunga ko'chiriladi).
INSERT INTO game_versions (version, released_at, notes, is_current)
VALUES ('1.0.0', NOW(), 'Initial baseline (auto-imported from legacy global recipes)', TRUE);


-- =========================================================================
-- 2. recipes
-- =========================================================================
CREATE TABLE recipes (
    id                 BIGSERIAL PRIMARY KEY,
    result_item_id     BIGINT      NOT NULL REFERENCES craft_items(id)  ON DELETE CASCADE,
    game_version_id    BIGINT      NOT NULL REFERENCES game_versions(id) ON DELETE RESTRICT,
    craft_time_seconds INT         NOT NULL DEFAULT 0,
    notes              TEXT,
    created_by_user_id BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_recipes_item_version UNIQUE (result_item_id, game_version_id)
);

CREATE INDEX idx_recipes_result_item   ON recipes (result_item_id);
CREATE INDEX idx_recipes_game_version  ON recipes (game_version_id);


-- =========================================================================
-- 3. Mavjud retseptlarni 1.0.0 ga ko'chirish
-- =========================================================================
-- Har bir distinct result_item_id uchun bitta Recipe yaratiladi.
INSERT INTO recipes (result_item_id, game_version_id, craft_time_seconds, notes, created_at, updated_at)
SELECT
    ri.result_item_id,
    (SELECT id FROM game_versions WHERE version = '1.0.0'),
    COALESCE(ci.craft_time_seconds, 0),
    NULL,
    NOW(),
    NOW()
FROM (SELECT DISTINCT result_item_id FROM recipe_ingredients) ri
JOIN craft_items ci ON ci.id = ri.result_item_id;


-- =========================================================================
-- 4. recipe_ingredients refactor: result_item_id → recipe_id
-- =========================================================================
-- 4.1 Yangi recipe_id ustunini qo'shamiz (avval nullable).
ALTER TABLE recipe_ingredients ADD COLUMN recipe_id BIGINT;

-- 4.2 Har bir mavjud row uchun mos recipe_id ni yozamiz.
UPDATE recipe_ingredients ri
SET recipe_id = r.id
FROM recipes r
WHERE r.result_item_id  = ri.result_item_id
  AND r.game_version_id = (SELECT id FROM game_versions WHERE version = '1.0.0');

-- 4.3 NOT NULL constraint va FK qo'shamiz.
ALTER TABLE recipe_ingredients ALTER COLUMN recipe_id SET NOT NULL;
ALTER TABLE recipe_ingredients
    ADD CONSTRAINT fk_recipe_ingredients_recipe
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;

-- 4.4 Eski UNIQUE constraint, FK va ustunni olib tashlaymiz.
ALTER TABLE recipe_ingredients
    DROP CONSTRAINT IF EXISTS recipe_ingredients_result_item_id_ingredient_item_id_key;
DROP INDEX IF EXISTS idx_recipe_result;
ALTER TABLE recipe_ingredients DROP COLUMN result_item_id;

-- 4.5 Yangi UNIQUE constraint va index.
ALTER TABLE recipe_ingredients
    ADD CONSTRAINT uq_recipe_ingredients_recipe_ingredient
    UNIQUE (recipe_id, ingredient_item_id);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients (recipe_id);
