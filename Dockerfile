# === Stage 1: Install Python dependencies ===
FROM python:3.10-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# 1) Install PyTorch CPU-only
RUN pip install --no-cache-dir --prefix=/install \
    torch==2.2.0+cpu torchvision==0.17.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# 2) Install all deps (constraints prevent torch re-download)
COPY requirements.docker.txt constraints.txt ./
RUN PIP_PREFIX=/install \
    PYTHONPATH=/install/lib/python3.10/site-packages \
    pip install --no-cache-dir --prefix=/install \
    --default-timeout=300 --retries=3 \
    -c constraints.txt -r requirements.docker.txt

# 3) Swap opencv-python -> headless (ultralytics pulls non-headless)
RUN pip install --no-cache-dir --prefix=/install \
    --default-timeout=300 \
    opencv-python-headless \
    && rm -rf /install/lib/python3.10/site-packages/cv2/qt 2>/dev/null || true


# === Stage 2: Runtime image ===
FROM python:3.10-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libgl1 libsm6 libxext6 libxrender1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -s /bin/bash appuser

COPY --from=builder /install /usr/local

WORKDIR /app

COPY traffic_cam/ traffic_cam/
COPY web/ web/
COPY main.py run_web.py ./

RUN mkdir -p data/models data/samples data/logs \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 5556

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5556/api/presets', timeout=3)" || exit 1

CMD ["python", "run_web.py"]
