# rembg servisi — fon o'chirish

O'yin skrinshotidan ikonkani ajratib, shaffof PNG qaytaradigan kichik HTTP servis.

## Nega alohida

Ilgari bu mantiq backend konteyneri ichida `scripts/remove_bg.py` sifatida ishlardi.
Natijada ML steki (`onnxruntime`, `scipy`, `numpy`, `rembg`) backend image'ining bir
qismi edi va uni **~1.5 GB** ga shishirardi — har bir oddiy backend deploy'i shuncha
hajmni tortishga majbur qilardi (bir marta 6+ daqiqa kutilgan). Holbuki bu funksiya
faqat admin item rasm yuklaganda, o'sha ham ixtiyoriy bayroq bilan ishlaydi.

Ajratilgandan keyin:

| | Ilgari | Hozir |
|---|---|---|
| Backend image | ~1.5 GB | ~300 MB |
| ML kutubxonalari production API konteynerida | bor | yo'q |
| Fon o'chirishni yangilash | backend deploy | shu servis deploy'i |

## API

| Endpoint | Tavsif |
|---|---|
| `GET /health` | `{"status":"UP","model":"u2net"}` — Docker/Coolify healthcheck |
| `POST /remove-bg` | `multipart/form-data`, `file` maydoni → `image/png` qaytaradi |

Xato javoblari: `400` (bo'sh fayl), `413` (juda katta), `422` (rasmni qayta ishlab bo'lmadi).

## Qayta ishlash bosqichlari

1. `rembg` (u2net) fonni o'chiradi;
2. eng katta bog'langan shaffof bo'lmagan soha topiladi — bu ikonka
   (skrinshotdagi matn parchalari shu bosqichda tashlanadi);
3. natija bounding box bo'yicha 6px padding bilan kesiladi.

Chegara qiymatlari (`ALPHA_BLOB_THRESHOLD=30`, `ALPHA_CROP_THRESHOLD=10`,
`CROP_PADDING=6`) eski skriptdan o'zgarishsiz ko'chirilgan — ko'chirish
bayt darajasida bir xil natija berishi tekshirilgan.

## Sozlamalar

| Env | Default | Tavsif |
|---|---|---|
| `REMBG_MODEL` | `u2net` | rembg modeli |
| `MAX_UPLOAD_BYTES` | `15728640` (15 MB) | maksimal fayl hajmi |
| `U2NET_HOME` | `/opt/models` | model katalogi (image ichiga oldindan yuklangan) |

Model **build vaqtida** image ichiga joylanadi, shuning uchun birinchi so'rov sekin
bo'lmaydi va konteyner ishga tushishi tashqi tarmoqqa bog'liq emas.

## Backend bilan bog'lanish

Backend `app.rembg.url` (env: `REMBG_URL`) orqali murojaat qiladi.
**Bu servis ishlamasa ilova buzilmaydi**: backend xatoni log qiladi va rasmni asl
holida saqlaydi, ya'ni yuklash baribir muvaffaqiyatli tugaydi.

`REMBG_URL` bo'sh bo'lsa funksiya butunlay o'chiriladi — lokal dev uchun bu servisni
ko'tarish shart emas.

## Lokal ishga tushirish

```bash
cd services/rembg
pip install -r requirements.txt
uvicorn app:app --port 8000
```

So'ng backend'ni `REMBG_URL=http://localhost:8000` bilan ishga tushiring.

Docker bilan:

```bash
docker build -t rembg services/rembg
docker run -p 8000:8000 rembg
```

## Deploy

`.github/workflows/rembg.yml` faqat `services/rembg/**` o'zgarganda ishga tushadi:
image quriladi, GHCR ga push qilinadi va `COOLIFY_REMBG_WEBHOOK_URL` secret'i
sozlangan bo'lsa Coolify deploy'i chaqiriladi. Secret bo'lmasa deploy jimgina
o'tkazib yuboriladi (xato bermaydi).
