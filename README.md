# Traffic Camera Detection System

AI-powered traffic camera system for vehicle detection, tracking, and license plate recognition.

## Quick Start (Docker)

```bash
# Build and run
docker compose up -d

# Open web UI
# http://localhost:5556

# View logs
docker compose logs -f

# Stop
docker compose down
```

**First run:** Place `yolov8n.pt` in `data/models/` before starting:
```bash
# Download YOLOv8n model (~6MB)
curl -L -o data/models/yolov8n.pt \
  https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt
```

## Quick Start (Local)

```bash
pip install -r requirements.txt
python run_web.py          # Web UI at http://localhost:5556

# Or CLI mode:
ENV=dev python main.py     # Public camera stream
ENV=test python main.py    # Local video file
```

## Web UI Features

- Select from preset cameras (Caltrans LA, TfL London, Da Nang YouTube)
- Connect custom sources: HTTP snapshot, MJPEG, RTSP, YouTube, webcam, video file
- Stream modes: View Only / Detect Vehicles / Plate OCR Only / Full
- Real-time detection log with vehicle counts and plate readings

## Project Structure

```
traffic_cam/
├── config/          # Environment-based configuration (dev/test/prod)
├── sources/         # Camera adapters (MJPEG, RTSP, YouTube, webcam, file, snapshot)
├── pipeline/        # YOLOv8 detector, EasyOCR plate reader, tracker
├── output/          # Display, CSV logger, plate alerts
└── utils/           # Frame processing helpers
web/
├── server.py        # Flask + waitress server, StreamManager
├── camera_presets.py
└── templates/       # Single-page HTML UI
data/
├── models/          # YOLO weights (volume mount)
├── samples/         # Test videos (volume mount)
└── logs/            # Detection CSV logs (volume mount)
```

## Docker Volumes

| Path | Purpose |
|---|---|
| `data/models/` | YOLO model weights, persists across rebuilds |
| `data/samples/` | Test video files |
| `data/logs/` | Detection event CSV logs |
