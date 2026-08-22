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
ENV U2NET_HOME=/opt/models
RUN mkdir -p /opt/models && \
    python -c "from rembg import new_session; new_session('u2net')"

COPY processing.py app.py ./

# Non-root (xavfsizlik). Model katalogi ham appuser uchun o'qiladigan bo'lsin.
RUN useradd -r -u 1001 appuser && chown -R appuser:appuser /app /opt/models
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
