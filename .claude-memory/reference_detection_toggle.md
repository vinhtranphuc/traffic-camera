---
name: Detection Toggle (live-view badge)
description: detection_enabled vs detection_settings — 2 concepts tách bạch, save config while off không tự bật
type: reference
date: 2026-04-13
---

## Spec key rule (prompts/4)
Live-view page: mỗi camera tile có badge ở góc phải-trên:
- **Click**: toggle `detectionEnabled` on/off (flip ngay)
- **Hover**: mở tooltip với checkboxes (vehicles/persons/plates) + save + revert icons
- **Save settings trong lúc OFF** → CHỈ lưu config, KHÔNG bật detection. Pipeline chỉ chạy khi `detection_enabled=true`.

## Data model
- `cameras.detection_enabled BOOLEAN NOT NULL DEFAULT FALSE` (V13 migration)
- `cameras.detection_settings JSON NULL` — đã có từ V3
- Hai field độc lập hoàn toàn. Toggle update 1 field, save settings update field khác.

## API
- `PUT /api/v1/cameras/{id}` (existing generic update)
  - `{detectionEnabled: true|false}` — toggle
  - `{detectionSettings: {detectVehicles, detectPersons, detectPlates, vehicleTypes}}` — save config
  - Gửi cả 2 cùng lúc cũng được
- `CameraResponse.detectionEnabled: Boolean` — luôn có, không null
- `UpdateCameraRequest.detectionEnabled: Boolean?` — null = no-op
- Toggle không trigger re-approval (chỉ sourceType/connectionConfig trigger)

## FE component
- `components/camera/DetectionToggleBadge.tsx` — standalone hover-popover badge
  - Click badge → cameraService.update(id, {detectionEnabled})
  - Save icon trong tooltip → cameraService.update(id, {detectionSettings}) — KHÔNG đụng detectionEnabled
  - Revert icon → reset draft về saved state
  - ESC + click-outside đóng popover
- Dùng ở: `app/(main)/live-view/page.tsx` (top-right each tile)
- Detail page `app/(main)/cameras/[id]/page.tsx`: có toggle detection riêng ở header Detection Settings card (consistency)

## Why 2 fields separate
User có thể:
1. Cấu hình trước (check boxes, save) — stored but pipeline idle
2. Bật detection sau khi ready → pipeline picks up saved config
3. Tắt tạm → config preserved
4. Bật lại → continue với same config

Giống công tắc đèn (on/off) tách biệt với dimmer (brightness config).
