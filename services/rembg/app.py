"""Craft Tree — fon o'chirish servisi (HTTP qatlami).

Bitta vazifa: o'yin skrinshotini qabul qilib, fonini o'chirib, ikonkani kesib
shaffof PNG qaytarish. Qayta ishlash mantig'i `processing.py` da.

Nega alohida servis: ilgari bu mantiq backend konteyneri ichida python skript
sifatida ishlardi va ML steki (onnxruntime, scipy, numpy) API image'ini ~1.5 GB
ga shishirardi — har bir backend deploy'i gigabaytlab tortardi. Endi backend
image yengil, bu servis esa kamdan-kam yangilanadi.
"""

import logging
import os
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response

import processing
from processing import IDLE_TIMEOUT_SECONDS, MODEL_NAME, get_session, process_image

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("rembg-service")

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", 15 * 1024 * 1024))

# Model sukut bo'yicha BIRINCHI SO'ROVDA yuklanadi va uzoq ishlatilmasa
# xotiradan bo'shatiladi. Sababi: server xotirasi tor (~8 GB, ko'p loyiha birga),
# fon o'chirish esa kuniga bir necha marta kerak bo'ladi.
# REMBG_PRELOAD=1 — ishga tushishda yuklash (birinchi so'rov tez bo'lsin).
PRELOAD_MODEL = os.getenv("REMBG_PRELOAD", "0") == "1"

# Bo'shatish uchun tekshiruv oralig'i: tez-tez tekshirish ma'nosiz, kech
# tekshirish esa xotirani ortiqcha ushlab turadi.
_CHECK_INTERVAL = max(5, min(60, (IDLE_TIMEOUT_SECONDS // 3) or 60))

_stop = threading.Event()


def _idle_reaper():
    """Fon oqimi: model bo'sh tursa uni xotiradan bo'shatadi."""
    while not _stop.wait(_CHECK_INTERVAL):
        try:
            if processing.release_if_idle():
                log.info(
                    "Model xotiradan bo'shatildi (%ds ishlatilmadi). Keyingi so'rovda qayta yuklanadi.",
                    IDLE_TIMEOUT_SECONDS,
                )
        except Exception:  # noqa: BLE001 — fon oqimi hech qachon yiqilmasin
            log.exception("Bo'shatishda kutilmagan xato")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if PRELOAD_MODEL:
        get_session()
        log.info("Model oldindan yuklandi: %s", MODEL_NAME)
    else:
        log.info("Model birinchi so'rovda yuklanadi (oldindan yuklash: REMBG_PRELOAD=1)")

    reaper = None
    if IDLE_TIMEOUT_SECONDS > 0:
        reaper = threading.Thread(target=_idle_reaper, daemon=True, name="rembg-idle-reaper")
        reaper.start()
        log.info(
            "Bo'sh turish chegarasi: %ds (tekshiruv har %ds)",
            IDLE_TIMEOUT_SECONDS,
            _CHECK_INTERVAL,
        )
    else:
        log.info("Bo'shatish o'chirilgan (REMBG_IDLE_TIMEOUT_SECONDS=0)")

    yield

    _stop.set()
    if reaper is not None:
        reaper.join(timeout=5)


app = FastAPI(title="Craft Tree — background removal", version="1.2.0", lifespan=lifespan)


@app.get("/health")
def health():
    """Konteyner sog'ligi (Docker/Coolify healthcheck shu yerga uradi).

    Ataylab modelni YUKLAMAYDI — healthcheck og'ir ishga bog'liq bo'lmasligi kerak.
    `model_loaded` orqali xotira holatini kuzatish mumkin.
    """
    return {
        "status": "UP",
        "model": MODEL_NAME,
        "model_loaded": processing.is_loaded(),
        "idle_seconds": round(processing.idle_seconds(), 1),
        "idle_timeout": IDLE_TIMEOUT_SECONDS,
    }


# DIQQAT: bu `def`, `async def` EMAS. Rasm qayta ishlash — bir necha soniyalik
# CPU ishi; `async def` bo'lsa u event loop'ni bloklab, shu vaqt ichida
# /health ga ham javob bermay qolardi va healthcheck konteynerni "unhealthy"
# deb belgilardi. Sinxron endpoint'ni FastAPI threadpool'da bajaradi.
@app.post("/remove-bg")
def remove_bg(file: UploadFile = File(...)):
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Bo'sh fayl")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Fayl juda katta")

    try:
        png = process_image(data)
    except Exception as exc:  # noqa: BLE001 — sabab qanday bo'lsa ham 422 qaytaramiz
        log.exception("Fon o'chirishda xato")
        raise HTTPException(status_code=422, detail=f"Rasmni qayta ishlab bo'lmadi: {exc}") from exc

    log.info("Qayta ishlandi: %d -> %d bayt", len(data), len(png))
    return Response(content=png, media_type="image/png")
