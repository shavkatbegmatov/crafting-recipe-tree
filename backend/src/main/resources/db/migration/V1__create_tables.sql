-- Kategoriyalar
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name_ru VARCHAR(100) NOT NULL,
    name_uz VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0
);

-- Kraft elementlari
CREATE TABLE craft_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    craft_time_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Retsept ingredientlari
CREATE TABLE recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    result_item_id BIGINT NOT NULL REFERENCES craft_items(id),
    ingredient_item_id BIGINT NOT NULL REFERENCES craft_items(id),
    quantity DECIMAL(10,4) NOT NULL,
    UNIQUE(result_item_id, ingredient_item_id)
);

-- Indekslar
CREATE INDEX idx_recipe_result ON recipe_ingredients(result_item_id);
CREATE INDEX idx_recipe_ingredient ON recipe_ingredients(ingredient_item_id);
CREATE INDEX idx_craft_items_category ON craft_items(category_id);
CREATE INDEX idx_craft_items_name ON craft_items(name);
