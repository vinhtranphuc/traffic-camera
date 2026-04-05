# Traffic Camera Detection System

AI-powered traffic camera system for vehicle detection, tracking, and license plate recognition.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run with dev config (public MJPEG stream)
ENV=dev python main.py

# Run with local video file
ENV=test python main.py

# Run with RTSP stream (IP camera)
ENV=prod python main.py
```

## Project Structure

```
traffic_cam/
├── config/          # Environment-based configuration
├── sources/         # Camera source adapters (MJPEG, File, RTSP)
├── pipeline/        # Detection, tracking, OCR modules
├── output/          # Display, logging, alerts
└── utils/           # Helper functions
data/
├── models/          # YOLO weights and other models
├── samples/         # Test video files
└── logs/            # Detection event logs
```

## Configuration

Copy `.env.example` to `.env` and set your environment:

- **dev** - Public MJPEG camera stream (no setup needed)
- **test** - Local video file from `data/samples/`
- **prod** - RTSP stream from IP camera or smartphone

## Controls

- Press `q` to quit the stream viewer
- Press `Ctrl+C` for graceful shutdown
