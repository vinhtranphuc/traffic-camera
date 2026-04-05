---
name: project_architecture
description: Kiến trúc dự án đã thiết lập - folder structure, config system, camera adapters, pipeline stubs
type: project
date: 2026-04-05
---

## Kiến trúc dự án đã thiết lập

### Config System (traffic_cam/config/)
- `BaseConfig` dataclass với tất cả config keys
- 3 environments: DevConfig (MJPEG), TestConfig (file), ProdConfig (RTSP)
- Factory: `get_config(env)` đọc từ ENV variable

### Camera Adapter Pattern (traffic_cam/sources/)
- ABC `CameraSource` với context manager support
- 3 adapters: MJPEGSource, FileSource (có loop), RTSPSource
- Factory: `create_source(config)`

### Pipeline Stubs (traffic_cam/pipeline/)
- VehicleDetector (YOLOv8 placeholder)
- VehicleTracker (ByteTrack placeholder)
- PlateOCR (PaddleOCR placeholder)
- Tất cả trả kết quả rỗng, chạy được ngay

### Output (traffic_cam/output/)
- FrameDisplay: cv2.imshow với bounding box overlay
- EventLogger: ghi CSV
- PlateAlert: watchlist placeholder

### Entry Point
- `main.py`: đọc ENV → load config → create source → loop hiển thị
- Chạy: `ENV=dev python main.py`

**Why:** Thiết lập foundation để implement detection/tracking/OCR sau
**How to apply:** Khi thêm tính năng mới, follow adapter pattern và factory functions đã có
