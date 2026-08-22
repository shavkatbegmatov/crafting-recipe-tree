"""Fon o'chirish mantig'i — HTTP qatlamidan mustaqil (shuning uchun sinash oson).

Bosqichlar (backend ichidagi eski `scripts/remove_bg.py` bilan bir xil):
  1. rembg fonni o'chiradi;
  2. eng katta bog'langan shaffof bo'lmagan soha topiladi — bu ikonka
     (skrinshotdagi matn parchalari shu bosqichda tashlab yuboriladi);
  3. qolgan tasvir bounding box bo'yicha kesiladi (biroz padding bilan).

Model xotirada faqat kerak bo'lganda turadi: birinchi so'rovda yuklanadi va uzoq
vaqt ishlatilmasa bo'shatiladi (server xotirasi tor).
"""

import gc
import io
import os
import threading
import time

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage

MODEL_NAME = os.getenv("REMBG_MODEL", "u2net")

# Shuncha soniya ishlatilmasa model xotiradan bo'shatiladi.
# 0 — hech qachon bo'shatmaslik (javob tezligi xotiradan muhimroq bo'lsa).
IDLE_TIMEOUT_SECONDS = int(os.getenv("REMBG_IDLE_TIMEOUT_SECONDS", "900"))

# Alpha chegaralari — eski skriptdagi qiymatlar o'zgarishsiz saqlangan.
ALPHA_BLOB_THRESHOLD = 30
ALPHA_CROP_THRESHOLD = 10
CROP_PADDING = 6

_session = None
_session_lock = threading.Lock()
_last_used = 0.0


def get_session():
    """Modelni qaytaradi, kerak bo'lsa yuklaydi, oxirgi ishlatilish vaqtini belgilaydi.

    Chaqirilgunicha xotira egallanmaydi. Qulf tufayli bir vaqtda kelgan so'rovlar
    modelni ikki marta yuklamaydi va bo'shatuvchi oqim bilan to'qnashmaydi.
    """
    global _session, _last_used
    with _session_lock:
        if _session is None:
            _session = new_session(MODEL_NAME)
        _last_used = time.monotonic()
        return _session


def is_loaded() -> bool:
    return _session is not None


def idle_seconds() -> float:
    """Model oxirgi marta ishlatilganidan beri o'tgan vaqt (yuklanmagan bo'lsa 0)."""
    if _session is None:
        return 0.0
    return time.monotonic() - _last_used


def release_if_idle() -> bool:
    """Model uzoq ishlatilmagan bo'lsa uni bo'shatadi. Bo'shatilgan bo'lsa True.

    Ayni paytda bajarilayotgan so'rov xavfsiz: u `get_session()` dan olgan
    obyektni o'z lokal o'zgaruvchisida ushlab turadi, shuning uchun bu yerda
    havolani tashlash o'sha so'rovni buzmaydi — obyekt ish tugagach yo'q qilinadi.
    """
    global _session
    if IDLE_TIMEOUT_SECONDS <= 0:
        return False
    with _session_lock:
        if _session is None:
            return False
        if (time.monotonic() - _last_used) < IDLE_TIMEOUT_SECONDS:
            return False
        _session = None
    gc.collect()
    return True


def largest_blob(alpha: np.ndarray, threshold: int = ALPHA_BLOB_THRESHOLD):
    """Eng katta bog'langan shaffof bo'lmagan soha maskasi (ikonka)."""
    binary = (alpha > threshold).astype(np.uint8)
    labeled, count = ndimage.label(binary)
    if count == 0:
        return None
    sizes = ndimage.sum(binary, labeled, range(1, count + 1))
    return labeled == (int(np.argmax(sizes)) + 1)


def crop_to_content(img: Image.Image) -> Image.Image:
    """Shaffof bo'lmagan qism atrofidan kesadi (padding bilan)."""
    alpha = np.array(img)[:, :, 3]
    rows = np.any(alpha > ALPHA_CROP_THRESHOLD, axis=1)
    cols = np.any(alpha > ALPHA_CROP_THRESHOLD, axis=0)
    if not rows.any() or not cols.any():
        return img
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    rmin = max(0, rmin - CROP_PADDING)
    rmax = min(img.height - 1, rmax + CROP_PADDING)
    cmin = max(0, cmin - CROP_PADDING)
    cmax = min(img.width - 1, cmax + CROP_PADDING)
    return img.crop((cmin, rmin, cmax + 1, rmax + 1))


def process_image(data: bytes) -> bytes:
    """Rasm baytlarini qabul qilib, tayyor shaffof PNG baytlarini qaytaradi."""
    session = get_session()
    img = Image.open(io.BytesIO(remove(data, session=session))).convert("RGBA")
    arr = np.array(img)

    mask = largest_blob(arr[:, :, 3])
    if mask is not None:
        arr[~mask, 3] = 0
        img = Image.fromarray(arr)

    img = crop_to_content(img)
    out = io.BytesIO()
    img.save(out, "PNG")
    return out.getvalue()
