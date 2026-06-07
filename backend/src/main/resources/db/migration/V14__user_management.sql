-- Foydalanuvchi boshqaruvi: akkauntni bloklash imkoni + super-admin darajasi.

-- Bloklash uchun "enabled" ustuni. Bloklangan (enabled=false) akkaunt na login qila oladi,
-- na mavjud JWT tokeni bilan kira oladi.
ALTER TABLE users ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Mavjud asosiy admin akkauntini eng yuqori darajaga ko'tarish.
-- SUPER_ADMIN — yagona rol bera oladigan va boshqa adminlarni boshqara oladigan daraja.
UPDATE users SET role = 'SUPER_ADMIN' WHERE username = 'admin';

-- Rol bo'yicha filtrlash va statistika tez ishlashi uchun indeks.
CREATE INDEX idx_users_role ON users (role);
