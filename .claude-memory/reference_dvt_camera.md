---
name: DVT Camera Management System
description: Hệ thống quản lý camera DVT tại 123.19.195.7:3001 với 3 camera RTSP live ở Đà Nẵng
type: reference
date: 2026-04-11
---

## DVT Camera Management System

- **URL**: http://123.19.195.7:3001
- **Login**: admin/admin
- **API Login**: POST /api/auth/login → returns JWT token
- **API Cameras**: GET /api/cameras (Bearer token)
- **Tech**: Next.js, leaflet maps, HLS.js

### Camera list (as of 2026-04-11)

| Camera | RTSP URL | FPS |
|--------|----------|-----|
| Camera 1 | rtsp://admin:dvt%4012345@123.19.195.7:554/1/1?transmode=unicast&profile=v | 15.0 |
| Camera 2 | rtsp://admin:dvt%4012345@123.19.195.7:555/1/1?transmode=unicast&profile=vam | 14.9 |
| Camera 3 | rtsp://admin:tamky2025@123.19.51.240:558/1/1?transmode=unicast&profile=va | 15.3 |

All cameras are in Da Nang area. Camera 1 tested: 1920x1080 resolution, clear traffic view.

**How to apply:** Use these RTSP URLs as live camera sources for testing the traffic detection pipeline.
