# Screenshot Upload + Avtomatik Icon Ajratish

## Context
Hozir rasmlar qo'lda terminal orqali background olib tashlanadi. Foydalanuvchi app ichida screenshot yuklaydi, app rembg yordamida fonni olib tashlab, transparent PNG ikonka yaratadi. Upload formda fon rangi ko'rsatiladi (default `#1a1610`).

## Arxitektura
```
Frontend (upload form + bg color input)
  → POST /api/items/{id}/upload-image?bgColor=#1a1610
    → Backend: faylni saqlaydi
    → Backend: Python rembg skriptni chaqiradi
    → Backend: natija PNG'ni saqlaydi, DB yangilanadi
  ← Response: yangi imageUrl
Frontend: rasm yangilanadi
```

## Bosqichlar

### 1. Backend — Upload endpoint + ImageService
- `ImageController.java` — `POST /api/items/{id}/upload-image` (multipart + bgColor param)
- `ImageService.java` — faylni saqlash, Python skript chaqirish, DB yangilash
- Rasmlar `uploads/` papkaga saqlanadi, backend static resource sifatida serve qiladi
- `application.yml` — upload max size, uploads path

### 2. Backend — Python skript (rembg)
- `backend/scripts/remove_bg.py` — rembg bilan background olib tashlash
- Input: rasm fayl yo'li, output fayl yo'li
- `ProcessBuilder` orqali Java'dan chaqiriladi

### 3. Backend — Static resource serve qilish
- `WebMvcConfig.java` — `/uploads/**` ni fayl tizimidan serve qilish
- Yoki `application.yml` da `spring.web.resources.static-locations`

### 4. Frontend — ImageUpload komponenti
- `ImageUpload.tsx` — fayl tanlash, bg color input, upload tugma, progress
- `ItemDetailPage.tsx` — upload tugmasi qo'shiladi
- `api/items.ts` — `uploadImage()` funksiya (FormData + axios)

### 5. Docker — Python + rembg
- Backend Dockerfile'ga Python3, pip, rembg o'rnatish

## Fayllar
- `backend/src/main/java/com/crafttree/controller/ImageController.java` (yangi)
- `backend/src/main/java/com/crafttree/service/ImageService.java` (yangi)
- `backend/src/main/java/com/crafttree/config/WebMvcConfig.java` (yangi)
- `backend/scripts/remove_bg.py` (yangi)
- `backend/src/main/resources/application.yml` (o'zgartirish)
- `backend/Dockerfile` (o'zgartirish)
- `frontend/src/components/items/ImageUpload.tsx` (yangi)
- `frontend/src/pages/ItemDetailPage.tsx` (o'zgartirish)
- `frontend/src/api/items.ts` (o'zgartirish)

## Tekshirish
1. Detail sahifada "Rasm yuklash" tugmasini bosish
2. Screenshot tanlash, fon rangi default `#1a1610`
3. Upload tugmasini bosish
4. Transparent PNG ikonka paydo bo'lishi
5. Sahifani yangilaganda rasm saqlanishi
