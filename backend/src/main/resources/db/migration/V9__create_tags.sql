-- Teglar jadvali
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name_ru VARCHAR(100) NOT NULL,
    name_uz VARCHAR(100),
    name_en VARCHAR(100),
    name_uz_cyr VARCHAR(100),
    color VARCHAR(7) DEFAULT '#8a7a60',
    sort_order INT DEFAULT 0
);

-- Element-teg bog'lanish jadvali (many-to-many)
CREATE TABLE item_tags (
    item_id BIGINT NOT NULL REFERENCES craft_items(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

CREATE INDEX idx_item_tags_item ON item_tags(item_id);
CREATE INDEX idx_item_tags_tag ON item_tags(tag_id);

-- Boshlang'ich teglar
INSERT INTO tags (code, name_ru, name_uz, name_en, name_uz_cyr, color, sort_order) VALUES
('MINABLE',   'Добываемый',   'Qazib olinadigan', 'Minable',      'Қазиб олинадиган', '#4a9a5a', 1),
('BASE',      'Базовый',      'Bazoviy',          'Base',          'Базовий',          '#6a8abc', 2),
('CRAFTABLE', 'Крафтовый',    'Kraft qilinadigan', 'Craftable',    'Крафт қилинадиган', '#c8a050', 3),
('ORGANIC',   'Органический', 'Organik',          'Organic',       'Органик',          '#5a9a4a', 4),
('CHEMICAL',  'Химический',   'Kimyoviy',         'Chemical',      'Кимёвий',          '#9a5a8a', 5),
('METALLIC',  'Металлический','Metall',            'Metallic',      'Металл',           '#7a8a9a', 6),
('MINERAL',   'Минеральный',  'Mineral',          'Mineral',       'Минерал',          '#8a7a60', 7),
('EXPLOSIVE', 'Взрывчатый',   'Portlovchi',       'Explosive',     'Портловчи',        '#c04040', 8);
