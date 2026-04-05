# === Stage 1: Install Python dependencies ===
FROM python:3.10-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Install PyTorch CPU first (avoids pulling CUDA)
RUN pip install --no-cache-dir --prefix=/install \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install remaining deps
COPY requirements.docker.txt requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# === Stage 2: Runtime image ===
FROM python:3.10-slim

# System libraries for OpenCV + ffmpeg for YouTube/HLS streams
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libgl1 libsm6 libxext6 libxrender1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -s /bin/bash appuser

# Copy Python packages from builder
COPY --from=builder /install /usr/local

WORKDIR /app

# Copy source code (order: least → most frequently changed)
COPY web/camera_presets.py web/camera_presets.py
COPY web/__init__.py web/__init__.py
COPY web/templates/ web/templates/
COPY web/static/ web/static/
COPY traffic_cam/ traffic_cam/
COPY web/server.py web/server.py
COPY main.py run_web.py ./

# Create data dirs (mounted as volumes at runtime)
RUN mkdir -p data/models data/samples data/logs \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 5556

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5556/api/presets', timeout=3)" || exit 1

CMD ["python", "run_web.py"]
