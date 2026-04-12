---
name: Build full spec, not MVP
description: User wants complete implementation of specs, not simplified MVP version
type: feedback
date: 2026-04-12
---

Khi user yêu cầu build hệ thống từ prompt/spec dài, user muốn **implement hết features**, không bỏ bớt.

**Why:** User đã frustrated khi tôi build scaffold + basic CRUD mà bỏ qua: i18n Vietnamese (spec default Vietnamese), dark/light mode, Leaflet map, charts, HLS.js live view, FCM notifications, ROI editor, filters, CSV export, source-type specific forms, WebSocket integration, session management, etc. Spec có thì phải có.

**How to apply:**
- Khi spec liệt kê features, treat đó là must-have, không phải nice-to-have
- Không dùng placeholder ("X integration pending") mà phải implement thật
- Nếu quá nhiều features, vẫn phải làm hết, có thể làm trong nhiều lần build/fix
- Khi báo cáo "done", phải tự check lại từng feature trong spec trước khi kết luận
