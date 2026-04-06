-- craft_items: til ustunlari (mavjud name = rus, description = rus)
ALTER TABLE craft_items ADD COLUMN name_uz VARCHAR(100);
ALTER TABLE craft_items ADD COLUMN name_en VARCHAR(100);
ALTER TABLE craft_items ADD COLUMN name_uz_cyr VARCHAR(100);
ALTER TABLE craft_items ADD COLUMN description_uz TEXT;
ALTER TABLE craft_items ADD COLUMN description_en TEXT;
ALTER TABLE craft_items ADD COLUMN description_uz_cyr TEXT;

-- categories: qo'shimcha til ustunlari
ALTER TABLE categories ADD COLUMN name_en VARCHAR(100);
ALTER TABLE categories ADD COLUMN name_uz_cyr VARCHAR(100);

-- Kategoriya tarjimalari
UPDATE categories SET name_en='Raw Material', name_uz_cyr='Хомашё' WHERE code='RAW';
UPDATE categories SET name_en='Material', name_uz_cyr='Материал' WHERE code='MATERIAL';
UPDATE categories SET name_en='Item', name_uz_cyr='Предмет' WHERE code='ITEM';
UPDATE categories SET name_en='Module', name_uz_cyr='Модул' WHERE code='MODULE';
