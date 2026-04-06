-- =============================================
-- 1. Kategoriyalarga color va icon ustunlari qo'shish
-- =============================================
ALTER TABLE categories ADD COLUMN color VARCHAR(7) DEFAULT '#8a7a60';
ALTER TABLE categories ADD COLUMN icon VARCHAR(30) DEFAULT 'Package';

-- Mavjud kategoriyalarga rang va ikonka
UPDATE categories SET color='#8a7a60', icon='Gem' WHERE code='RAW';
UPDATE categories SET color='#4a9a5a', icon='Layers' WHERE code='MATERIAL';
UPDATE categories SET color='#6a8abc', icon='Box' WHERE code='ITEM';
UPDATE categories SET color='#c8a050', icon='Cpu' WHERE code='MODULE';

-- =============================================
-- 2. RAW kategoriya nomini o'zgartirish
-- =============================================
UPDATE categories SET
  name_ru='Базовый ресурс',
  name_uz='Bazoviy resurs',
  name_en='Base Resource',
  name_uz_cyr='Базовий ресурс'
WHERE code='RAW';

-- =============================================
-- 3. Mavjud RAW elementlar nomlarini to'g'rilash
-- =============================================

-- Железо-никель → Железо
UPDATE craft_items SET
  name='Железо',
  name_uz='Temir',
  name_en='Iron',
  name_uz_cyr='Темир',
  description='Основной металлический ресурс',
  description_uz='Asosiy metall resursi',
  description_en='Primary metallic resource',
  description_uz_cyr='Асосий металл ресурси'
WHERE name='Железо-никель';

-- Сульфиды → Сульфид
UPDATE craft_items SET
  name='Сульфид',
  name_uz='Sulfid',
  name_en='Sulfide',
  name_uz_cyr='Сулфид',
  description='Серосодержащий минерал',
  description_uz='Oltingugurt saqlovchi mineral',
  description_en='Sulfur-containing mineral',
  description_uz_cyr='Олтингугурт сақловчи минерал'
WHERE name='Сульфиды';

-- Летучие фракции → Летучая фракция
UPDATE craft_items SET
  name='Летучая фракция',
  name_uz='Uchuvchan fraktsiya',
  name_en='Volatile Fraction',
  name_uz_cyr='Учувчан фракция',
  description='Газообразный компонент из пород',
  description_uz='Tog jinslaridan gazsimon komponent',
  description_en='Gaseous component from rocks',
  description_uz_cyr='Тоғ жинсларидан газсимон компонент'
WHERE name='Летучие фракции';

-- =============================================
-- 4. Yangi RAW elementlar qo'shish
-- =============================================

-- Магнитная масса
INSERT INTO craft_items (name, name_uz, name_en, name_uz_cyr, description, description_uz, description_en, description_uz_cyr, category_id, craft_time_seconds)
VALUES (
  'Магнитная масса', 'Magnit massasi', 'Magnetic Mass', 'Магнит массаси',
  'Магнитный минеральный концентрат', 'Magnit mineral kontsentranti', 'Magnetic mineral concentrate', 'Магнит минерал концентранти',
  (SELECT id FROM categories WHERE code='RAW'), 0
);

-- Карбонат
INSERT INTO craft_items (name, name_uz, name_en, name_uz_cyr, description, description_uz, description_en, description_uz_cyr, category_id, craft_time_seconds)
VALUES (
  'Карбонат', 'Karbonat', 'Carbonate', 'Карбонат',
  'Углеродсодержащий минерал', 'Uglerod saqlovchi mineral', 'Carbon-containing mineral', 'Углерод сақловчи минерал',
  (SELECT id FROM categories WHERE code='RAW'), 0
);
