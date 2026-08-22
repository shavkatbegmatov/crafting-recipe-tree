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

## Bog'liqliklar — diqqat

`requirements.txt` dagi ML paketlari **ataylab aniq versiyaga qadab qo'yilgan**.

Production serverimizning protsessori **x86-64-v2** ko'rsatmalar to'plamini qo'llab-quvvatlamaydi,
NumPy 2.x g'ildiraklari esa aynan shunga qurilgan — natijada konteyner ishga tushishda darhol
yiqiladi:

```
RuntimeError: NumPy was built with baseline optimizations (X86_V2)
but your machine doesn't support (X86_V2)
```

`numpy<2.0` bo'lganda `rembg` ham unga mos eski versiyada bo'lishi shart (yangi rembg
`numpy>=2.3` talab qiladi), aks holda o'rnatma ichdan nomuvofiq bo'lib qoladi.

Versiyalarni yangilashdan oldin **serverda** tekshiring:

```bash
docker run --rm python:3.11-slim sh -c 'pip install --dry-run rembg "numpy<2.0" "scipy<1.14" onnxruntime "Pillow<12" 2>&1 | tail -4'
```

Lokal mashinada ishlashi bu serverda ham ishlashini kafolatlamaydi.

## Sozlamalar

| Env | Default | Tavsif |
|---|---|---|
| `REMBG_MODEL` | `u2net` | rembg modeli |
| `MAX_UPLOAD_BYTES` | `15728640` (15 MB) | maksimal fayl hajmi |
| `U2NET_HOME` | `/opt/models` | model katalogi (image ichiga oldindan yuklangan) |
| `REMBG_PRELOAD` | `0` | `1` bo'lsa model ishga tushishda yuklanadi |
| `REMBG_IDLE_TIMEOUT_SECONDS` | `900` | shuncha ishlatilmasa model xotiradan bo'shatiladi (`0` — bo'shatmaslik) |
| `NUMBA_CACHE_DIR` | `/opt/numba-cache` | numba JIT keshi (non-root uchun yoziladigan joy) |

Model fayli **build vaqtida** image ichiga joylanadi — shuning uchun konteyner ishga
tushishi tashqi tarmoqqa bog'liq emas.

**Xotira boshqaruvi.** Server xotirasi tor (~8 GB, ko'p loyiha birga), fon o'chirish
esa kuniga bir necha marta kerak bo'ladigan funksiya. Shuning uchun model:

1. *birinchi so'rovda* RAM'ga yuklanadi (ishga tushishda emas);
2. `REMBG_IDLE_TIMEOUT_SECONDS` davomida ishlatilmasa **xotiradan bo'shatiladi**;
3. keyingi so'rovda qayta yuklanadi.

O'lchangan sarf: bo'sh turganda **~540 MB**, model yuklangach **~1.17 GB**.

Evaziga tanaffusdan keyingi birinchi rasm bir oz sekinroq ishlanadi. Javob tezligi
muhimroq bo'lsa: `REMBG_PRELOAD=1` (ishga tushishda yuklash) va/yoki
`REMBG_IDLE_TIMEOUT_SECONDS=0` (hech qachon bo'shatmaslik).

Bo'shatish ayni paytda bajarilayotgan so'rovni buzmaydi: u modelga o'z havolasini
ushlab turadi, obyekt esa ish tugagach yo'q qilinadi.

`GET /health` xotira holatini ham ko'rsatadi:

```json
{"status":"UP","model":"u2net","model_loaded":false,"idle_seconds":0.0,"idle_timeout":900}
```

`/health` ataylab modelga tegmaydi — healthcheck og'ir ishga bog'liq bo'lmasligi kerak.
`/remove-bg` esa sinxron endpoint: FastAPI uni threadpool'da bajaradi, shuning uchun
uzoq CPU ishi event loop'ni (va healthcheck javobini) bloklamaydi.

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
