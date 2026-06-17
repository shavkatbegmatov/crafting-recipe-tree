-- Chat moderatsiyasi: foydalanuvchini chatda yozishdan vaqtincha yoki doimiy mute qilish.
-- NULL yoki o'tmishdagi sana — yoza oladi; kelajakdagi sana — mute (o'qiy oladi, yoza olmaydi).
ALTER TABLE users ADD COLUMN chat_muted_until TIMESTAMP;
