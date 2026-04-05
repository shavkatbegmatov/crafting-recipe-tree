-- =============================================
-- KATEGORIYALAR
-- =============================================
INSERT INTO categories (code, name_ru, name_uz, sort_order) VALUES
('RAW',      'Сырьё',    'Xomashyo', 1),
('MATERIAL', 'Материал', 'Material',  2),
('ITEM',     'Предмет',  'Predmet',   3),
('MODULE',   'Модуль',   'Modul',     4);

-- =============================================
-- XOMASHYO (RAW) — craft_time_seconds = 0
-- =============================================
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Вода',              'Базовый ресурс. Добывается дегидратором',   (SELECT id FROM categories WHERE code='RAW'), 0),
('Железо-никель',     'Металлический сплав из реголита',           (SELECT id FROM categories WHERE code='RAW'), 0),
('Уголь',             'Углеродное сырьё',                          (SELECT id FROM categories WHERE code='RAW'), 0),
('Силикат',           'Кремнийсодержащий минерал',                 (SELECT id FROM categories WHERE code='RAW'), 0),
('Камень',            'Горная порода',                             (SELECT id FROM categories WHERE code='RAW'), 0),
('Реголит',           'Лунный/планетарный грунт',                  (SELECT id FROM categories WHERE code='RAW'), 0),
('Сульфиды',          'Серосодержащие минералы',                   (SELECT id FROM categories WHERE code='RAW'), 0),
('Плагиоклаз',        'Алюмосиликатный минерал',                   (SELECT id FROM categories WHERE code='RAW'), 0),
('Шеелит',            'Вольфрамовая руда',                         (SELECT id FROM categories WHERE code='RAW'), 0),
('Соль',              'Минеральная соль из рассолов',              (SELECT id FROM categories WHERE code='RAW'), 0),
('Летучие фракции',   'Газообразные компоненты из пород',          (SELECT id FROM categories WHERE code='RAW'), 0),
('Апатит',            'Фосфатный минерал',                         (SELECT id FROM categories WHERE code='RAW'), 0);

-- =============================================
-- MATERIALLAR (MATERIAL)
-- =============================================

-- Кислород: Вода → 1.11 (2 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Кислород', 'Получается электролизом воды', (SELECT id FROM categories WHERE code='MATERIAL'), 2);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Кислород'), (SELECT id FROM craft_items WHERE name='Вода'), 1.11);

-- Водород: Вода → 9.00 (2 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Водород', 'Получается электролизом воды', (SELECT id FROM categories WHERE code='MATERIAL'), 2);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Водород'), (SELECT id FROM craft_items WHERE name='Вода'), 9.00);

-- Щёлочь: Соль → 2.00, Вода → 0.50 (6 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Щёлочь', 'Щелочной раствор', (SELECT id FROM categories WHERE code='MATERIAL'), 6);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Щёлочь'), (SELECT id FROM craft_items WHERE name='Соль'), 2.00),
((SELECT id FROM craft_items WHERE name='Щёлочь'), (SELECT id FROM craft_items WHERE name='Вода'), 0.50);

-- Пресс-порошок: Реголит → 0.50, Камень → 0.30, Силикат → 0.20 (2 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Пресс-порошок', 'Прессованный порошок из грунта', (SELECT id FROM categories WHERE code='MATERIAL'), 2);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Пресс-порошок'), (SELECT id FROM craft_items WHERE name='Реголит'), 0.50),
((SELECT id FROM craft_items WHERE name='Пресс-порошок'), (SELECT id FROM craft_items WHERE name='Камень'), 0.30),
((SELECT id FROM craft_items WHERE name='Пресс-порошок'), (SELECT id FROM craft_items WHERE name='Силикат'), 0.20);

-- Стекло: Камень → 8.00, Силикат → 2.00 (5 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Стекло', 'Кварцевое стекло', (SELECT id FROM categories WHERE code='MATERIAL'), 5);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Стекло'), (SELECT id FROM craft_items WHERE name='Камень'), 8.00),
((SELECT id FROM craft_items WHERE name='Стекло'), (SELECT id FROM craft_items WHERE name='Силикат'), 2.00);

-- Кремний: Силикат → 2.00, Уголь → 0.50 (30 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Кремний', 'Полупроводниковый кремний', (SELECT id FROM categories WHERE code='MATERIAL'), 30);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Кремний'), (SELECT id FROM craft_items WHERE name='Силикат'), 2.00),
((SELECT id FROM craft_items WHERE name='Кремний'), (SELECT id FROM craft_items WHERE name='Уголь'), 0.50);

-- Медь: Сульфиды → 4.00, Кислород → 1.50, Уголь → 0.50 (9 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Медь', 'Рафинированная медь', (SELECT id FROM categories WHERE code='MATERIAL'), 9);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Медь'), (SELECT id FROM craft_items WHERE name='Сульфиды'), 4.00),
((SELECT id FROM craft_items WHERE name='Медь'), (SELECT id FROM craft_items WHERE name='Кислород'), 1.50),
((SELECT id FROM craft_items WHERE name='Медь'), (SELECT id FROM craft_items WHERE name='Уголь'), 0.50);

-- Алюминий: Плагиоклаз → 6.00, Щёлочь → 1.00, Уголь → 0.50 (14 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Алюминий', 'Алюминиевый сплав', (SELECT id FROM categories WHERE code='MATERIAL'), 14);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Алюминий'), (SELECT id FROM craft_items WHERE name='Плагиоклаз'), 6.00),
((SELECT id FROM craft_items WHERE name='Алюминий'), (SELECT id FROM craft_items WHERE name='Щёлочь'), 1.00),
((SELECT id FROM craft_items WHERE name='Алюминий'), (SELECT id FROM craft_items WHERE name='Уголь'), 0.50);

-- Свинец: Сульфиды → 20.00, Уголь → 0.80, Пресс-порошок → 2.00 (11 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Свинец', 'Свинцовые слитки', (SELECT id FROM categories WHERE code='MATERIAL'), 11);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Свинец'), (SELECT id FROM craft_items WHERE name='Сульфиды'), 20.00),
((SELECT id FROM craft_items WHERE name='Свинец'), (SELECT id FROM craft_items WHERE name='Уголь'), 0.80),
((SELECT id FROM craft_items WHERE name='Свинец'), (SELECT id FROM craft_items WHERE name='Пресс-порошок'), 2.00);

-- Вольфрам: Шеелит → 4.00, Щёлочь → 1.00, Уголь → 0.50 (18 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Вольфрам', 'Вольфрамовый порошок', (SELECT id FROM categories WHERE code='MATERIAL'), 18);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Вольфрам'), (SELECT id FROM craft_items WHERE name='Шеелит'), 4.00),
((SELECT id FROM craft_items WHERE name='Вольфрам'), (SELECT id FROM craft_items WHERE name='Щёлочь'), 1.00),
((SELECT id FROM craft_items WHERE name='Вольфрам'), (SELECT id FROM craft_items WHERE name='Уголь'), 0.50);

-- Метан: Летучие фракции → 5.00, Кислород → 0.50 (10 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Метан', 'Метановый газ', (SELECT id FROM categories WHERE code='MATERIAL'), 10);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Метан'), (SELECT id FROM craft_items WHERE name='Летучие фракции'), 5.00),
((SELECT id FROM craft_items WHERE name='Метан'), (SELECT id FROM craft_items WHERE name='Кислород'), 0.50);

-- Аммиак: Летучие фракции → 7.00, Щёлочь → 2.00, Вода → 2.00 (8 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Аммиак', 'Аммиачный раствор', (SELECT id FROM categories WHERE code='MATERIAL'), 8);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Аммиак'), (SELECT id FROM craft_items WHERE name='Летучие фракции'), 7.00),
((SELECT id FROM craft_items WHERE name='Аммиак'), (SELECT id FROM craft_items WHERE name='Щёлочь'), 2.00),
((SELECT id FROM craft_items WHERE name='Аммиак'), (SELECT id FROM craft_items WHERE name='Вода'), 2.00);

-- Пластик: Метан → 2.00, Кислород → 0.25 (20 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Пластик', 'Полимерный пластик', (SELECT id FROM categories WHERE code='MATERIAL'), 20);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Пластик'), (SELECT id FROM craft_items WHERE name='Метан'), 2.00),
((SELECT id FROM craft_items WHERE name='Пластик'), (SELECT id FROM craft_items WHERE name='Кислород'), 0.25);

-- Серная кислота: Сульфиды → 2.00, Кислород → 0.65, Вода → 0.35 (8 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Серная кислота', 'Концентрированная серная кислота', (SELECT id FROM categories WHERE code='MATERIAL'), 8);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Серная кислота'), (SELECT id FROM craft_items WHERE name='Сульфиды'), 2.00),
((SELECT id FROM craft_items WHERE name='Серная кислота'), (SELECT id FROM craft_items WHERE name='Кислород'), 0.65),
((SELECT id FROM craft_items WHERE name='Серная кислота'), (SELECT id FROM craft_items WHERE name='Вода'), 0.35);

-- Азотная кислота: Аммиак → 0.35, Кислород → 0.65 (9 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Азотная кислота', 'Азотная кислота', (SELECT id FROM categories WHERE code='MATERIAL'), 9);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Азотная кислота'), (SELECT id FROM craft_items WHERE name='Аммиак'), 0.35),
((SELECT id FROM craft_items WHERE name='Азотная кислота'), (SELECT id FROM craft_items WHERE name='Кислород'), 0.65);

-- Реагент: Метан → 1.00, Щёлочь → 0.25, Сульфиды → 1.00 (30 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Реагент', 'Химический реагент', (SELECT id FROM categories WHERE code='MATERIAL'), 30);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Реагент'), (SELECT id FROM craft_items WHERE name='Метан'), 1.00),
((SELECT id FROM craft_items WHERE name='Реагент'), (SELECT id FROM craft_items WHERE name='Щёлочь'), 0.25),
((SELECT id FROM craft_items WHERE name='Реагент'), (SELECT id FROM craft_items WHERE name='Сульфиды'), 1.00);

-- Взрывчатое вещество: Метан → 1.00, Азотная кислота → 1.00, Серная кислота → 0.50 (10 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Взрывчатое вещество', 'Взрывчатка для горных работ', (SELECT id FROM categories WHERE code='MATERIAL'), 10);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Взрывчатое вещество'), (SELECT id FROM craft_items WHERE name='Метан'), 1.00),
((SELECT id FROM craft_items WHERE name='Взрывчатое вещество'), (SELECT id FROM craft_items WHERE name='Азотная кислота'), 1.00),
((SELECT id FROM craft_items WHERE name='Взрывчатое вещество'), (SELECT id FROM craft_items WHERE name='Серная кислота'), 0.50);

-- Эластомер: Метан → 2.00, Азотная кислота → 0.50, Щёлочь → 0.20 (90 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Эластомер', 'Эластичный полимер', (SELECT id FROM categories WHERE code='MATERIAL'), 90);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Эластомер'), (SELECT id FROM craft_items WHERE name='Метан'), 2.00),
((SELECT id FROM craft_items WHERE name='Эластомер'), (SELECT id FROM craft_items WHERE name='Азотная кислота'), 0.50),
((SELECT id FROM craft_items WHERE name='Эластомер'), (SELECT id FROM craft_items WHERE name='Щёлочь'), 0.20);

-- Удобрение: Апатит → 1.00, Серная кислота → 1.00, Аммиак → 0.50 (70 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Удобрение', 'Минеральное удобрение', (SELECT id FROM categories WHERE code='MATERIAL'), 70);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Удобрение'), (SELECT id FROM craft_items WHERE name='Апатит'), 1.00),
((SELECT id FROM craft_items WHERE name='Удобрение'), (SELECT id FROM craft_items WHERE name='Серная кислота'), 1.00),
((SELECT id FROM craft_items WHERE name='Удобрение'), (SELECT id FROM craft_items WHERE name='Аммиак'), 0.50);

-- =============================================
-- PREDMETLAR (ITEM)
-- =============================================

-- Детали: Железо-никель → 0.95, Уголь → 0.05 (2 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Детали', 'Стандартные металлические детали', (SELECT id FROM categories WHERE code='ITEM'), 2);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Детали'), (SELECT id FROM craft_items WHERE name='Железо-никель'), 0.95),
((SELECT id FROM craft_items WHERE name='Детали'), (SELECT id FROM craft_items WHERE name='Уголь'), 0.05);

-- Заготовка: Железо-никель → 30.00, Уголь → 2.00 (3 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Заготовка', 'Металлическая заготовка', (SELECT id FROM categories WHERE code='ITEM'), 3);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Заготовка'), (SELECT id FROM craft_items WHERE name='Железо-никель'), 30.00),
((SELECT id FROM craft_items WHERE name='Заготовка'), (SELECT id FROM craft_items WHERE name='Уголь'), 2.00);

-- Стержень: Уголь → 4.00, Камень → 1.00 (2 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Стержень', 'Углеродный стержень', (SELECT id FROM categories WHERE code='ITEM'), 2);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Стержень'), (SELECT id FROM craft_items WHERE name='Уголь'), 4.00),
((SELECT id FROM craft_items WHERE name='Стержень'), (SELECT id FROM craft_items WHERE name='Камень'), 1.00);

-- Фильтр: Пресс-порошок → 10.00, Детали → 1 (6 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Фильтр', 'Промышленный фильтр', (SELECT id FROM categories WHERE code='ITEM'), 6);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Фильтр'), (SELECT id FROM craft_items WHERE name='Пресс-порошок'), 10.00),
((SELECT id FROM craft_items WHERE name='Фильтр'), (SELECT id FROM craft_items WHERE name='Детали'), 1);

-- Барабан: Заготовка → 2, Детали → 10 (4 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Барабан', 'Вращающийся барабан', (SELECT id FROM categories WHERE code='ITEM'), 4);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Барабан'), (SELECT id FROM craft_items WHERE name='Заготовка'), 2),
((SELECT id FROM craft_items WHERE name='Барабан'), (SELECT id FROM craft_items WHERE name='Детали'), 10);

-- Индуктор: Заготовка → 1, Медь → 1.00, Камень → 0.50 (9 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Индуктор', 'Электромагнитный индуктор', (SELECT id FROM categories WHERE code='ITEM'), 9);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Индуктор'), (SELECT id FROM craft_items WHERE name='Заготовка'), 1),
((SELECT id FROM craft_items WHERE name='Индуктор'), (SELECT id FROM craft_items WHERE name='Медь'), 1.00),
((SELECT id FROM craft_items WHERE name='Индуктор'), (SELECT id FROM craft_items WHERE name='Камень'), 0.50);

-- Мотор: Индуктор → 2, Заготовка → 1, Детали → 4 (21 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Мотор', 'Электрический мотор', (SELECT id FROM categories WHERE code='ITEM'), 21);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Мотор'), (SELECT id FROM craft_items WHERE name='Индуктор'), 2),
((SELECT id FROM craft_items WHERE name='Мотор'), (SELECT id FROM craft_items WHERE name='Заготовка'), 1),
((SELECT id FROM craft_items WHERE name='Мотор'), (SELECT id FROM craft_items WHERE name='Детали'), 4);

-- Проточный модуль: Пресс-порошок → 0.06, Мотор → 1, Медь → 2.00 (15 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Проточный модуль', 'Проточная система', (SELECT id FROM categories WHERE code='ITEM'), 15);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Проточный модуль'), (SELECT id FROM craft_items WHERE name='Пресс-порошок'), 0.06),
((SELECT id FROM craft_items WHERE name='Проточный модуль'), (SELECT id FROM craft_items WHERE name='Мотор'), 1),
((SELECT id FROM craft_items WHERE name='Проточный модуль'), (SELECT id FROM craft_items WHERE name='Медь'), 2.00);

-- Электроника: Кремний → 0.50, Медь → 1.00, Пластик → 0.25 (20 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Электроника', 'Электронные компоненты', (SELECT id FROM categories WHERE code='ITEM'), 20);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Электроника'), (SELECT id FROM craft_items WHERE name='Кремний'), 0.50),
((SELECT id FROM craft_items WHERE name='Электроника'), (SELECT id FROM craft_items WHERE name='Медь'), 1.00),
((SELECT id FROM craft_items WHERE name='Электроника'), (SELECT id FROM craft_items WHERE name='Пластик'), 0.25);

-- Бомба: Электроника → 1, Взрывчатое вещество → 5.00 (10 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Бомба', 'Подрывной заряд', (SELECT id FROM categories WHERE code='ITEM'), 10);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Бомба'), (SELECT id FROM craft_items WHERE name='Электроника'), 1),
((SELECT id FROM craft_items WHERE name='Бомба'), (SELECT id FROM craft_items WHERE name='Взрывчатое вещество'), 5.00);

-- Солнечная панель: Кремний → 10.00, Стекло → 20.00, Алюминий → 10.00 (160 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Солнечная панель', 'Фотоэлектрическая панель', (SELECT id FROM categories WHERE code='ITEM'), 160);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Солнечная панель'), (SELECT id FROM craft_items WHERE name='Кремний'), 10.00),
((SELECT id FROM craft_items WHERE name='Солнечная панель'), (SELECT id FROM craft_items WHERE name='Стекло'), 20.00),
((SELECT id FROM craft_items WHERE name='Солнечная панель'), (SELECT id FROM craft_items WHERE name='Алюминий'), 10.00);

-- Рентген-излучатель: Вольфрам → 2.50, Стекло → 40.00, Электроника → 10 (220 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Рентген-излучатель', 'Рентгеновская трубка', (SELECT id FROM categories WHERE code='ITEM'), 220);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Рентген-излучатель'), (SELECT id FROM craft_items WHERE name='Вольфрам'), 2.50),
((SELECT id FROM craft_items WHERE name='Рентген-излучатель'), (SELECT id FROM craft_items WHERE name='Стекло'), 40.00),
((SELECT id FROM craft_items WHERE name='Рентген-излучатель'), (SELECT id FROM craft_items WHERE name='Электроника'), 10);

-- Топливный бак: Алюминий → 12.00, Водород → 15.00, Кислород → 85.00 (200 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Топливный бак', 'Криогенный топливный бак', (SELECT id FROM categories WHERE code='ITEM'), 200);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Топливный бак'), (SELECT id FROM craft_items WHERE name='Алюминий'), 12.00),
((SELECT id FROM craft_items WHERE name='Топливный бак'), (SELECT id FROM craft_items WHERE name='Водород'), 15.00),
((SELECT id FROM craft_items WHERE name='Топливный бак'), (SELECT id FROM craft_items WHERE name='Кислород'), 85.00);

-- =============================================
-- MODULLAR (MODULE)
-- =============================================

-- Дегидратор: Барабан → 2, Детали → 20, Стержень → 6 (16 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Дегидратор', 'Устройство для извлечения воды', (SELECT id FROM categories WHERE code='MODULE'), 16);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Дегидратор'), (SELECT id FROM craft_items WHERE name='Барабан'), 2),
((SELECT id FROM craft_items WHERE name='Дегидратор'), (SELECT id FROM craft_items WHERE name='Детали'), 20),
((SELECT id FROM craft_items WHERE name='Дегидратор'), (SELECT id FROM craft_items WHERE name='Стержень'), 6);

-- Центрифуга: Барабан → 1, Детали → 8, Заготовка → 10 (12 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Центрифуга', 'Промышленная центрифуга', (SELECT id FROM categories WHERE code='MODULE'), 12);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Центрифуга'), (SELECT id FROM craft_items WHERE name='Барабан'), 1),
((SELECT id FROM craft_items WHERE name='Центрифуга'), (SELECT id FROM craft_items WHERE name='Детали'), 8),
((SELECT id FROM craft_items WHERE name='Центрифуга'), (SELECT id FROM craft_items WHERE name='Заготовка'), 10);

-- Выпариватель: Барабан → 3, Проточный модуль → 2, Стержень → 10 (48 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Выпариватель', 'Промышленный выпариватель', (SELECT id FROM categories WHERE code='MODULE'), 48);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Выпариватель'), (SELECT id FROM craft_items WHERE name='Барабан'), 3),
((SELECT id FROM craft_items WHERE name='Выпариватель'), (SELECT id FROM craft_items WHERE name='Проточный модуль'), 2),
((SELECT id FROM craft_items WHERE name='Выпариватель'), (SELECT id FROM craft_items WHERE name='Стержень'), 10);

-- Газоулавливатель: Барабан → 5, Проточный модуль → 1, Детали → 12 (42 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Газоулавливатель', 'Система улавливания газов', (SELECT id FROM categories WHERE code='MODULE'), 42);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Газоулавливатель'), (SELECT id FROM craft_items WHERE name='Барабан'), 5),
((SELECT id FROM craft_items WHERE name='Газоулавливатель'), (SELECT id FROM craft_items WHERE name='Проточный модуль'), 1),
((SELECT id FROM craft_items WHERE name='Газоулавливатель'), (SELECT id FROM craft_items WHERE name='Детали'), 12);

-- Электростатический сепаратор: Барабан → 7, Фильтр → 20, Индуктор → 10 (42 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Электростатический сепаратор', 'Электростатический разделитель', (SELECT id FROM categories WHERE code='MODULE'), 42);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Электростатический сепаратор'), (SELECT id FROM craft_items WHERE name='Барабан'), 7),
((SELECT id FROM craft_items WHERE name='Электростатический сепаратор'), (SELECT id FROM craft_items WHERE name='Фильтр'), 20),
((SELECT id FROM craft_items WHERE name='Электростатический сепаратор'), (SELECT id FROM craft_items WHERE name='Индуктор'), 10);

-- Батарея: Свинец → 40.00, Серная кислота → 9.00, Пластик → 9.00 (47 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Батарея', 'Свинцово-кислотная батарея', (SELECT id FROM categories WHERE code='MODULE'), 47);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Батарея'), (SELECT id FROM craft_items WHERE name='Свинец'), 40.00),
((SELECT id FROM craft_items WHERE name='Батарея'), (SELECT id FROM craft_items WHERE name='Серная кислота'), 9.00),
((SELECT id FROM craft_items WHERE name='Батарея'), (SELECT id FROM craft_items WHERE name='Пластик'), 9.00);

-- Рентген-сканер: Центрифуга → 5, Рентген-излучатель → 2, Электроника → 50 (350 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Рентген-сканер', 'Рентгеновский сканер для анализа', (SELECT id FROM categories WHERE code='MODULE'), 350);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Рентген-сканер'), (SELECT id FROM craft_items WHERE name='Центрифуга'), 5),
((SELECT id FROM craft_items WHERE name='Рентген-сканер'), (SELECT id FROM craft_items WHERE name='Рентген-излучатель'), 2),
((SELECT id FROM craft_items WHERE name='Рентген-сканер'), (SELECT id FROM craft_items WHERE name='Электроника'), 50);

-- Флотационная ячейка: Барабан → 10, Проточный модуль → 10, Реагент → 10.00 (89 сек)
INSERT INTO craft_items (name, description, category_id, craft_time_seconds) VALUES
('Флотационная ячейка', 'Флотационная камера', (SELECT id FROM categories WHERE code='MODULE'), 89);
INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity) VALUES
((SELECT id FROM craft_items WHERE name='Флотационная ячейка'), (SELECT id FROM craft_items WHERE name='Барабан'), 10),
((SELECT id FROM craft_items WHERE name='Флотационная ячейка'), (SELECT id FROM craft_items WHERE name='Проточный модуль'), 10),
((SELECT id FROM craft_items WHERE name='Флотационная ячейка'), (SELECT id FROM craft_items WHERE name='Реагент'), 10.00);
