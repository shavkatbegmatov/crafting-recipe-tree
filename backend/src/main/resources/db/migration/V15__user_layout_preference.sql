-- Foydalanuvchi shaxsiy sozlamasi: sahifa kontenti kengligi.
-- CENTERED — kontent markazda (default), FULL — butun mavjud kenglikni egallaydi.
-- Sozlama hisobga bog'langan, shuning uchun foydalanuvchi istalgan qurilmada bir xil ko'rinishni oladi.
ALTER TABLE users ADD COLUMN layout_width VARCHAR(20) NOT NULL DEFAULT 'CENTERED';
