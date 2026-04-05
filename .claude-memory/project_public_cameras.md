---
name: project_public_cameras
description: Danh sách API camera giao thông công cộng đã test hoạt động - Caltrans, TfL, VDOT
type: reference
date: 2026-04-05
---

## Public Traffic Camera APIs (đã test hoạt động 2026-04-05)

### 1. Caltrans CCTV (California) - ĐANG DÙNG CHO DEV
- **API:** `https://cwwp2.dot.ca.gov/data/d{district}/cctv/cctvStatusD{district:02d}.json`
- **Districts:** D3 (Sacramento), D4 (Bay Area), D7 (LA - 498 cams), D8, D11 (San Diego), D12 (OC)
- **Format:** JPEG snapshot (refresh 2s) + HLS stream
- **Auth:** Không cần
- **Dev URL hiện tại:** I-110 LA `https://cwwp2.dot.ca.gov/data/d7/cctv/image/i110196avenue26offramp/i110196avenue26offramp.jpg`

### 2. TfL JamCam (London) - 883 cameras
- **API:** `https://api.tfl.gov.uk/Place/Type/JamCam/`
- **Format:** JPEG + MP4 video clip
- **Auth:** Không cần

### 3. VDOT Virginia - 1,696 cameras
- **API:** `https://511.vdot.virginia.gov/services/map/layers/map/cams`
- **Format:** PNG + HLS + RTSP stream
- **Auth:** Không cần

### 4. 511NY New York - 2,921 cameras
- **API:** `https://511ny.org/api/getcameras?format=json`
- **Format:** HLS stream
- **Auth:** Không cần

### 5. MnDOT Minnesota
- **URL pattern:** `https://video.dot.state.mn.us/video/image/metro/{camera_id}`
- **Format:** JPEG snapshot
- **Auth:** Không cần
