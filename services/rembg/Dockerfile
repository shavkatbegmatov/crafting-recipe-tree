FROM python:3.11-slim

# onnxruntime/opencv uchun minimal tizim kutubxonalari
RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1 libglib2.0-0 curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Modelni image ichiga OLDINDAN yuklaymiz: birinchi so'rov sekin bo'lmasin va
# konteyner ishga tushishi tashqi tarmoqqa bog'liq bo'lmasin.
# Yoziladigan kataloglarni ANIQ belgilaymiz. Sababi: rembg -> pymatting -> numba
# JIT keshini sukut bo'yicha site-packages yoniga yozmoqchi bo'ladi, non-root
# foydalanuvchi esa u yerga yoza olmaydi va konteyner ishga tushishda yiqiladi:
#   RuntimeError: cannot cache function '_make_tree': no locator available
ENV U2NET_HOME=/opt/models \
    NUMBA_CACHE_DIR=/opt/numba-cache \
    HOME=/home/appuser \
    XDG_CACHE_HOME=/home/appuser/.cache

RUN mkdir -p /opt/models && \
    python -c "from rembg import new_session; new_session('u2net')"

COPY processing.py app.py ./

# Non-root (xavfsizlik). Model va kesh kataloglari appuser uchun ochiq bo'lsin.
RUN useradd -r -u 1001 -m -d /home/appuser appuser && \
    mkdir -p /opt/numba-cache /home/appuser/.cache && \
    chown -R appuser:appuser /app /opt/models /opt/numba-cache /home/appuser
USER appuser

# Build vaqtidagi tutun-sinov: AYNAN ishlaydigan foydalanuvchi nomidan butun import
# zanjirini va model yuklashni bajaramiz, hamda numba keshini oldindan isitamiz.
# Shu tufayli yuqoridagi kabi ruxsat/ABI muammolari production'da emas, CI'da yiqiladi.
RUN python -c "import processing; processing.get_session(); print('rembg image smoke test OK')"

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
