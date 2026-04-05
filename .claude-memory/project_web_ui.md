---
name: project_web_ui
description: Web UI cho Traffic Camera - Flask server + HTML frontend tại localhost:5555
type: project
date: 2026-04-05
---

## Web UI Architecture

### Server (web/server.py)
- Flask app, port 5555
- `/stream.mjpeg` - MJPEG streaming endpoint (img tag src)
- `/api/presets` - Danh sách camera presets
- `/api/test-connect` - Test kết nối camera
- `/api/start` / `/api/stop` - Bắt đầu/dừng stream
- `/api/events` - SSE cho detection events realtime
- `/api/snapshot` - Chụp 1 frame

### Frontend (web/templates/index.html)
- Single-page, dark theme
- Sidebar: preset cameras (grouped) + custom source form
- Main: MJPEG stream viewer + detection log panel
- Status bar: frame count, detections, source info

### Camera Presets (web/camera_presets.py)
- Caltrans LA: 5 cameras (I-110, I-5, I-10, US-101)
- Caltrans Bay Area: 1 camera (I-80 Bay Bridge)
- TfL London: 3 cameras

### Chạy
```bash
python run_web.py  # http://localhost:5555
```

**Why:** User cần UI để quản lý cameras, xem livestream, và theo dõi detection data
**How to apply:** Mở rộng presets khi thêm camera mới, thêm detection visualization khi model loaded
