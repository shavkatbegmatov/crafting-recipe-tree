"""Fon o'chirish mantig'i — HTTP qatlamidan mustaqil (shuning uchun sinash oson).

Bosqichlar (backend ichidagi eski `scripts/remove_bg.py` bilan bir xil):
  1. rembg fonni o'chiradi;
  2. eng katta bog'langan shaffof bo'lmagan soha topiladi — bu ikonka
     (skrinshotdagi matn parchalari shu bosqichda tashlab yuboriladi);
  3. qolgan tasvir bounding box bo'yicha kesiladi (biroz padding bilan).
"""

import io
import os

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage

MODEL_NAME = os.getenv("REMBG_MODEL", "u2net")

# Alpha chegaralari — eski skriptdagi qiymatlar o'zgarishsiz saqlangan.
ALPHA_BLOB_THRESHOLD = 30
ALPHA_CROP_THRESHOLD = 10
CROP_PADDING = 6

_session = None


def get_session():
    """Model bir marta yuklanadi, har so'rovda emas."""
    global _session
    if _session is None:
        _session = new_session(MODEL_NAME)
    return _session


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
    img = Image.open(io.BytesIO(remove(data, session=get_session()))).convert("RGBA")
    arr = np.array(img)

    mask = largest_blob(arr[:, :, 3])
    if mask is not None:
        arr[~mask, 3] = 0
        img = Image.fromarray(arr)

    img = crop_to_content(img)
    out = io.BytesIO()
    img.save(out, "PNG")
    return out.getvalue()
