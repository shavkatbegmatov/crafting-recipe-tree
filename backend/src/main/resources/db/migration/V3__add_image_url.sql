ALTER TABLE craft_items ADD COLUMN image_url VARCHAR(255);

-- MATERIAL
UPDATE craft_items SET image_url = '/images/items/kislorod.jpg' WHERE name = 'Кислород';
UPDATE craft_items SET image_url = '/images/items/vodorod.jpg' WHERE name = 'Водород';
UPDATE craft_items SET image_url = '/images/items/shyoloch.jpg' WHERE name = 'Щёлочь';
UPDATE craft_items SET image_url = '/images/items/press-poroshok.jpg' WHERE name = 'Пресс-порошок';
UPDATE craft_items SET image_url = '/images/items/steklo.jpg' WHERE name = 'Стекло';
UPDATE craft_items SET image_url = '/images/items/kremniy.jpg' WHERE name = 'Кремний';
UPDATE craft_items SET image_url = '/images/items/med.jpg' WHERE name = 'Медь';
UPDATE craft_items SET image_url = '/images/items/alyuminiy.jpg' WHERE name = 'Алюминий';
UPDATE craft_items SET image_url = '/images/items/svinec.jpg' WHERE name = 'Свинец';
UPDATE craft_items SET image_url = '/images/items/volfram.jpg' WHERE name = 'Вольфрам';
UPDATE craft_items SET image_url = '/images/items/metan.jpg' WHERE name = 'Метан';
UPDATE craft_items SET image_url = '/images/items/ammiak.jpg' WHERE name = 'Аммиак';
UPDATE craft_items SET image_url = '/images/items/plastik.jpg' WHERE name = 'Пластик';
UPDATE craft_items SET image_url = '/images/items/sernaya-kislota.jpg' WHERE name = 'Серная кислота';
UPDATE craft_items SET image_url = '/images/items/azotnaya-kislota.jpg' WHERE name = 'Азотная кислота';
UPDATE craft_items SET image_url = '/images/items/reagent.jpg' WHERE name = 'Реагент';
UPDATE craft_items SET image_url = '/images/items/vzryvchatoe-veshchestvo.jpg' WHERE name = 'Взрывчатое вещество';
UPDATE craft_items SET image_url = '/images/items/elastomer.jpg' WHERE name = 'Эластомер';
UPDATE craft_items SET image_url = '/images/items/udobrenie.jpg' WHERE name = 'Удобрение';

-- ITEM
UPDATE craft_items SET image_url = '/images/items/detali.jpg' WHERE name = 'Детали';
UPDATE craft_items SET image_url = '/images/items/zagotovka.jpg' WHERE name = 'Заготовка';
UPDATE craft_items SET image_url = '/images/items/sterzhen.jpg' WHERE name = 'Стержень';
UPDATE craft_items SET image_url = '/images/items/filtr.jpg' WHERE name = 'Фильтр';
UPDATE craft_items SET image_url = '/images/items/baraban.jpg' WHERE name = 'Барабан';
UPDATE craft_items SET image_url = '/images/items/induktor.jpg' WHERE name = 'Индуктор';
UPDATE craft_items SET image_url = '/images/items/motor.jpg' WHERE name = 'Мотор';
UPDATE craft_items SET image_url = '/images/items/protochniy-modul.jpg' WHERE name = 'Проточный модуль';
UPDATE craft_items SET image_url = '/images/items/elektronika.jpg' WHERE name = 'Электроника';
UPDATE craft_items SET image_url = '/images/items/bomba.jpg' WHERE name = 'Бомба';
UPDATE craft_items SET image_url = '/images/items/solnechnaya-panel.jpg' WHERE name = 'Солнечная панель';
UPDATE craft_items SET image_url = '/images/items/rentgen-izluchatel.jpg' WHERE name = 'Рентген-излучатель';
UPDATE craft_items SET image_url = '/images/items/toplivniy-bak.jpg' WHERE name = 'Топливный бак';

-- MODULE
UPDATE craft_items SET image_url = '/images/items/degidrator.jpg' WHERE name = 'Дегидратор';
UPDATE craft_items SET image_url = '/images/items/centrifuga.jpg' WHERE name = 'Центрифуга';
UPDATE craft_items SET image_url = '/images/items/vyparivatel.jpg' WHERE name = 'Выпариватель';
UPDATE craft_items SET image_url = '/images/items/gazoulavlivatel.jpg' WHERE name = 'Газоулавливатель';
UPDATE craft_items SET image_url = '/images/items/elektrostaticheskiy-separator.jpg' WHERE name = 'Электростатический сепаратор';
UPDATE craft_items SET image_url = '/images/items/batareya.jpg' WHERE name = 'Батарея';
UPDATE craft_items SET image_url = '/images/items/rentgen-skaner.jpg' WHERE name = 'Рентген-сканер';
UPDATE craft_items SET image_url = '/images/items/flotacionnaya-yacheyka.jpg' WHERE name = 'Флотационная ячейка';
