-- =============================================
-- XOMASHYO (RAW) — 12 ta element
-- =============================================
UPDATE craft_items SET name_uz='Suv', name_en='Water', name_uz_cyr='Сув',
  description_uz='Asosiy resurs. Degidrator orqali olinadi',
  description_en='Basic resource. Extracted via dehydrator',
  description_uz_cyr='Асосий ресурс. Дегидратор орқали олинади'
WHERE name='Вода';

UPDATE craft_items SET name_uz='Temir-nikel', name_en='Iron-Nickel', name_uz_cyr='Темир-никел',
  description_uz='Regolitdan olingan metall qotishmasi',
  description_en='Metallic alloy from regolith',
  description_uz_cyr='Реголитдан олинган металл қотишмаси'
WHERE name='Железо-никель';

UPDATE craft_items SET name_uz='Grafit', name_en='Graphite', name_uz_cyr='Графит',
  description_uz='Uglerodli xomashyo. Sterjenlar va metallurgiya uchun',
  description_en='Carbon raw material. For rods and metallurgy',
  description_uz_cyr='Углеродли хомашё. Стерженлар ва металлургия учун'
WHERE name='Графит';

UPDATE craft_items SET name_uz='Silikat', name_en='Silicate', name_uz_cyr='Силикат',
  description_uz='Kremniy saqlovchi mineral',
  description_en='Silicon-containing mineral',
  description_uz_cyr='Кремний сақловчи минерал'
WHERE name='Силикат';

UPDATE craft_items SET name_uz='Tosh', name_en='Stone', name_uz_cyr='Тош',
  description_uz='Tog jinsi',
  description_en='Rock formation',
  description_uz_cyr='Тоғ жинси'
WHERE name='Камень';

UPDATE craft_items SET name_uz='Regolit', name_en='Regolith', name_uz_cyr='Реголит',
  description_uz='Oy/sayyora gruntlari',
  description_en='Lunar/planetary soil',
  description_uz_cyr='Ой/сайёра грунтлари'
WHERE name='Реголит';

UPDATE craft_items SET name_uz='Sulfidlar', name_en='Sulfides', name_uz_cyr='Сулфидлар',
  description_uz='Oltingugurt saqlovchi minerallar',
  description_en='Sulfur-containing minerals',
  description_uz_cyr='Олтингугурт сақловчи минераллар'
WHERE name='Сульфиды';

UPDATE craft_items SET name_uz='Plagioklaz', name_en='Plagioclase', name_uz_cyr='Плагиоклаз',
  description_uz='Alyumosilikat minerali',
  description_en='Aluminosilicate mineral',
  description_uz_cyr='Алюмосиликат минерали'
WHERE name='Плагиоклаз';

UPDATE craft_items SET name_uz='Sheelit', name_en='Scheelite', name_uz_cyr='Шеелит',
  description_uz='Volfram rudasi',
  description_en='Tungsten ore',
  description_uz_cyr='Волфрам рудаси'
WHERE name='Шеелит';

UPDATE craft_items SET name_uz='Tuz', name_en='Salt', name_uz_cyr='Туз',
  description_uz='Mineral tuzi',
  description_en='Mineral salt from brines',
  description_uz_cyr='Минерал тузи'
WHERE name='Соль';

UPDATE craft_items SET name_uz='Uchuvchan fraktsiyalar', name_en='Volatile Fractions', name_uz_cyr='Учувчан фракциялар',
  description_uz='Tog jinslaridan gazsimon komponentlar',
  description_en='Gaseous components from rocks',
  description_uz_cyr='Тоғ жинсларидан газсимон компонентлар'
WHERE name='Летучие фракции';

UPDATE craft_items SET name_uz='Apatit', name_en='Apatite', name_uz_cyr='Апатит',
  description_uz='Fosfatli mineral',
  description_en='Phosphate mineral',
  description_uz_cyr='Фосфатли минерал'
WHERE name='Апатит';

-- =============================================
-- MATERIALLAR (MATERIAL) — 19 ta element
-- =============================================
UPDATE craft_items SET name_uz='Kislorod', name_en='Oxygen', name_uz_cyr='Кислород',
  description_uz='Suvni elektroliz qilish orqali olinadi',
  description_en='Obtained by water electrolysis',
  description_uz_cyr='Сувни электролиз қилиш орқали олинади'
WHERE name='Кислород';

UPDATE craft_items SET name_uz='Vodorod', name_en='Hydrogen', name_uz_cyr='Водород',
  description_uz='Suvni elektroliz qilish orqali olinadi',
  description_en='Obtained by water electrolysis',
  description_uz_cyr='Сувни электролиз қилиш орқали олинади'
WHERE name='Водород';

UPDATE craft_items SET name_uz='Ishqor', name_en='Alkali', name_uz_cyr='Ишқор',
  description_uz='Ishqoriy eritma',
  description_en='Alkaline solution',
  description_uz_cyr='Ишқорий эритма'
WHERE name='Щёлочь';

UPDATE craft_items SET name_uz='Press-kukun', name_en='Press Powder', name_uz_cyr='Пресс-кукун',
  description_uz='Gruntdan presslangan kukun',
  description_en='Pressed powder from soil',
  description_uz_cyr='Грунтдан пресланган кукун'
WHERE name='Пресс-порошок';

UPDATE craft_items SET name_uz='Shisha', name_en='Glass', name_uz_cyr='Шиша',
  description_uz='Kvarts shishasi',
  description_en='Quartz glass',
  description_uz_cyr='Кварц шишаси'
WHERE name='Стекло';

UPDATE craft_items SET name_uz='Kremniy', name_en='Silicon', name_uz_cyr='Кремний',
  description_uz='Yarim o''tkazgich kremniy',
  description_en='Semiconductor silicon',
  description_uz_cyr='Ярим ўтказгич кремний'
WHERE name='Кремний';

UPDATE craft_items SET name_uz='Mis', name_en='Copper', name_uz_cyr='Мис',
  description_uz='Tozalangan mis',
  description_en='Refined copper',
  description_uz_cyr='Тозаланган мис'
WHERE name='Медь';

UPDATE craft_items SET name_uz='Alyuminiy', name_en='Aluminum', name_uz_cyr='Алюминий',
  description_uz='Alyuminiy qotishmasi',
  description_en='Aluminum alloy',
  description_uz_cyr='Алюминий қотишмаси'
WHERE name='Алюминий';

UPDATE craft_items SET name_uz='Qo''rg''oshin', name_en='Lead', name_uz_cyr='Қўрғошин',
  description_uz='Qo''rg''oshin quymalari',
  description_en='Lead ingots',
  description_uz_cyr='Қўрғошин қуймалари'
WHERE name='Свинец';

UPDATE craft_items SET name_uz='Volfram', name_en='Tungsten', name_uz_cyr='Волфрам',
  description_uz='Volfram kukuni',
  description_en='Tungsten powder',
  description_uz_cyr='Волфрам кукуни'
WHERE name='Вольфрам';

UPDATE craft_items SET name_uz='Metan', name_en='Methane', name_uz_cyr='Метан',
  description_uz='Metan gazi',
  description_en='Methane gas',
  description_uz_cyr='Метан гази'
WHERE name='Метан';

UPDATE craft_items SET name_uz='Ammiak', name_en='Ammonia', name_uz_cyr='Аммиак',
  description_uz='Ammiak eritmasi',
  description_en='Ammonia solution',
  description_uz_cyr='Аммиак эритмаси'
WHERE name='Аммиак';

UPDATE craft_items SET name_uz='Plastik', name_en='Plastic', name_uz_cyr='Пластик',
  description_uz='Polimer plastik',
  description_en='Polymer plastic',
  description_uz_cyr='Полимер пластик'
WHERE name='Пластик';

UPDATE craft_items SET name_uz='Sulfat kislotasi', name_en='Sulfuric Acid', name_uz_cyr='Сулфат кислотаси',
  description_uz='Konsentrlangan sulfat kislotasi',
  description_en='Concentrated sulfuric acid',
  description_uz_cyr='Концентрланган сулфат кислотаси'
WHERE name='Серная кислота';

UPDATE craft_items SET name_uz='Azot kislotasi', name_en='Nitric Acid', name_uz_cyr='Азот кислотаси',
  description_uz='Azot kislotasi',
  description_en='Nitric acid',
  description_uz_cyr='Азот кислотаси'
WHERE name='Азотная кислота';

UPDATE craft_items SET name_uz='Reagent', name_en='Reagent', name_uz_cyr='Реагент',
  description_uz='Kimyoviy reagent',
  description_en='Chemical reagent',
  description_uz_cyr='Кимёвий реагент'
WHERE name='Реагент';

UPDATE craft_items SET name_uz='Portlovchi modda', name_en='Explosive', name_uz_cyr='Портловчи модда',
  description_uz='Tog-kon ishlari uchun portlovchi modda',
  description_en='Explosive for mining operations',
  description_uz_cyr='Тоғ-кон ишлари учун портловчи модда'
WHERE name='Взрывчатое вещество';

UPDATE craft_items SET name_uz='Elastomer', name_en='Elastomer', name_uz_cyr='Эластомер',
  description_uz='Elastik polimer',
  description_en='Elastic polymer',
  description_uz_cyr='Эластик полимер'
WHERE name='Эластомер';

UPDATE craft_items SET name_uz='O''g''it', name_en='Fertilizer', name_uz_cyr='Ўғит',
  description_uz='Mineral o''g''it',
  description_en='Mineral fertilizer',
  description_uz_cyr='Минерал ўғит'
WHERE name='Удобрение';

-- =============================================
-- PREDMETLAR (ITEM) — 13 ta element
-- =============================================
UPDATE craft_items SET name_uz='Detallar', name_en='Parts', name_uz_cyr='Деталлар',
  description_uz='Standart metall detallar',
  description_en='Standard metal parts',
  description_uz_cyr='Стандарт металл деталлар'
WHERE name='Детали';

UPDATE craft_items SET name_uz='Zagotovka', name_en='Workpiece', name_uz_cyr='Заготовка',
  description_uz='Metall zagotovka',
  description_en='Metal workpiece',
  description_uz_cyr='Металл заготовка'
WHERE name='Заготовка';

UPDATE craft_items SET name_uz='Sterjen', name_en='Rod', name_uz_cyr='Стержен',
  description_uz='Grafit isitish sterjeni',
  description_en='Graphite heating rod',
  description_uz_cyr='Графит иситиш стержени'
WHERE name='Стержень';

UPDATE craft_items SET name_uz='Filtr', name_en='Filter', name_uz_cyr='Филтр',
  description_uz='Sanoat filtri',
  description_en='Industrial filter',
  description_uz_cyr='Саноат филтри'
WHERE name='Фильтр';

UPDATE craft_items SET name_uz='Baraban', name_en='Drum', name_uz_cyr='Барабан',
  description_uz='Aylanuvchi baraban',
  description_en='Rotating drum',
  description_uz_cyr='Айланувчи барабан'
WHERE name='Барабан';

UPDATE craft_items SET name_uz='Induktor', name_en='Inductor', name_uz_cyr='Индуктор',
  description_uz='Elektromagnit induktor',
  description_en='Electromagnetic inductor',
  description_uz_cyr='Электромагнит индуктор'
WHERE name='Индуктор';

UPDATE craft_items SET name_uz='Motor', name_en='Motor', name_uz_cyr='Мотор',
  description_uz='Elektr motori',
  description_en='Electric motor',
  description_uz_cyr='Электр мотори'
WHERE name='Мотор';

UPDATE craft_items SET name_uz='Oqim moduli', name_en='Flow Module', name_uz_cyr='Оқим модули',
  description_uz='Oqim tizimi',
  description_en='Flow system',
  description_uz_cyr='Оқим тизими'
WHERE name='Проточный модуль';

UPDATE craft_items SET name_uz='Elektronika', name_en='Electronics', name_uz_cyr='Электроника',
  description_uz='Elektron komponentlar',
  description_en='Electronic components',
  description_uz_cyr='Электрон компонентлар'
WHERE name='Электроника';

UPDATE craft_items SET name_uz='Bomba', name_en='Bomb', name_uz_cyr='Бомба',
  description_uz='Portlatish zaryadi',
  description_en='Blasting charge',
  description_uz_cyr='Портлатиш заряди'
WHERE name='Бомба';

UPDATE craft_items SET name_uz='Quyosh paneli', name_en='Solar Panel', name_uz_cyr='Қуёш панели',
  description_uz='Fotoelektrik panel',
  description_en='Photovoltaic panel',
  description_uz_cyr='Фотоэлектрик панел'
WHERE name='Солнечная панель';

UPDATE craft_items SET name_uz='Rentgen nurlantirgich', name_en='X-Ray Emitter', name_uz_cyr='Рентген нурлантиргич',
  description_uz='Rentgen trubkasi',
  description_en='X-ray tube',
  description_uz_cyr='Рентген трубкаси'
WHERE name='Рентген-излучатель';

UPDATE craft_items SET name_uz='Yoqilg''i baki', name_en='Fuel Tank', name_uz_cyr='Ёқилғи баки',
  description_uz='Kriogen yoqilg''i idishi',
  description_en='Cryogenic fuel container',
  description_uz_cyr='Криоген ёқилғи идиши'
WHERE name='Топливный бак';

-- =============================================
-- MODULLAR (MODULE) — 8 ta element
-- =============================================
UPDATE craft_items SET name_uz='Degidrator', name_en='Dehydrator', name_uz_cyr='Дегидратор',
  description_uz='Suv ajratib olish qurilmasi',
  description_en='Water extraction device',
  description_uz_cyr='Сув ажратиб олиш қурилмаси'
WHERE name='Дегидратор';

UPDATE craft_items SET name_uz='Sentrifuga', name_en='Centrifuge', name_uz_cyr='Центрифуга',
  description_uz='Sanoat sentrifugasi',
  description_en='Industrial centrifuge',
  description_uz_cyr='Саноат центрифугаси'
WHERE name='Центрифуга';

UPDATE craft_items SET name_uz='Bug''latgich', name_en='Evaporator', name_uz_cyr='Буғлатгич',
  description_uz='Sanoat bug''latgichi',
  description_en='Industrial evaporator',
  description_uz_cyr='Саноат буғлатгичи'
WHERE name='Выпариватель';

UPDATE craft_items SET name_uz='Gaz tutgich', name_en='Gas Scrubber', name_uz_cyr='Газ тутгич',
  description_uz='Gazlarni tutish tizimi',
  description_en='Gas capture system',
  description_uz_cyr='Газларни тутиш тизими'
WHERE name='Газоулавливатель';

UPDATE craft_items SET name_uz='Elektrostatik separator', name_en='Electrostatic Separator', name_uz_cyr='Электростатик сепаратор',
  description_uz='Elektrostatik ajratgich',
  description_en='Electrostatic separator',
  description_uz_cyr='Электростатик ажратгич'
WHERE name='Электростатический сепаратор';

UPDATE craft_items SET name_uz='Batareya', name_en='Battery', name_uz_cyr='Батарея',
  description_uz='Qo''rg''oshin-kislotali batareya',
  description_en='Lead-acid battery',
  description_uz_cyr='Қўрғошин-кислотали батарея'
WHERE name='Батарея';

UPDATE craft_items SET name_uz='Rentgen skaner', name_en='X-Ray Scanner', name_uz_cyr='Рентген сканер',
  description_uz='Tahlil uchun rentgen skaneri',
  description_en='X-ray scanner for analysis',
  description_uz_cyr='Таҳлил учун рентген сканери'
WHERE name='Рентген-сканер';

UPDATE craft_items SET name_uz='Flotatsion yacheyka', name_en='Flotation Cell', name_uz_cyr='Флотацион ячейка',
  description_uz='Flotatsion kamera',
  description_en='Flotation chamber',
  description_uz_cyr='Флотацион камера'
WHERE name='Флотационная ячейка';
