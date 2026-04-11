-- Static seed rasmlari endi `/uploads/` volume'idan xizmat qilinadi.
-- V3 va V4 migration'lari `/images/items/*` yo'llarini seed qilgan, biroq ushbu
-- static fayllar git'dan olib tashlandi va hammasi backend'ning uploads volume'iga
-- ko'chirildi (fayl nomi o'zgarmagan, faqat path'ning prefiksi o'zgardi).
--
-- Production'da bu query no-op bo'ladi, chunki o'sha konvertatsiya qo'lda bajarilgan.
-- Fresh deploy'larda esa V3/V4 seed qilgan yo'llar avtomatik `/uploads/*`'ga
-- o'tadi va tizim toza holatda qoladi (uploads volume'ida tegishli fayllar
-- bo'lsa — rasmlar ko'rinadi).

UPDATE craft_items
SET image_url = REPLACE(image_url, '/images/items/', '/uploads/')
WHERE image_url LIKE '/images/items/%';
