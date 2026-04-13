---
name: Project Standards (consolidated)
description: Actionable rules từ 6 file standards ở root. Dùng khi ra quyết định implement / review / done.
type: reference
date: 2026-04-13
---

# Source files (đọc lại khi cần chi tiết)
- `AUTONOMOUS_DEV_PROMPT.md` — feedback loop, UX checklist, test 24 cases/endpoint
- `MASTER_CLAUDE.md` — system architect + product + QA identity, 5 security layers
- `PROFESSIONAL_REVIEW_MINDSET.md` — 3-role review (Architect/Designer/QA) trước khi done
- `PROFESSIONAL_STANDARDS_CONSISTENCY.md` — ripple effect, API format, naming
- `SENIOR_ENGINEER_MINDSET.md` — config↔usage, shared data-multiple views, upgrade autonomy
- `UXUI_UPGRADE_MINDSET.md` — UX chuẩn Linear/Vercel/Stripe

---

# 1) "Done" = 3-role review đã pass
Trước khi nói xong tính năng, bắt buộc đi qua:
- **Architect**: conflict với flow cũ? state machine đủ? race condition? transaction boundary? 
- **Designer**: first-time user có hiểu không? power user có friction? error rõ không? empty state có CTA?
- **QA**: input validation FE+BE? auth ownership check (layer 4)? concurrent ops? SQL/XSS?

Bất kỳ layer nào fail → sửa → review lại, không skip.

# 2) Ripple effect checklist (MUST cascade khi sửa 1 thứ)

### Sửa DB schema
- [ ] Flyway migration → Entity → Repository → Service → DTO → API docs → FE TypeScript type → FE components → seed

### Sửa API
- [ ] Controller → Service → Request+Response DTO → OpenAPI → FE API client → FE types → all calling components

### Sửa enum value
- [ ] DB migration → Kotlin enum → all `when()` → Repository filter → API DTO validation → FE union type → FE label+color+badge → filter dropdown → chart legend → notification template

# 3) API response format (CHỈ format này, không exception)
```json
// Success
{"success": true, "code": "X", "data": {...}, "timestamp": "..."}
// Paginated: data = {items, pagination:{page,size,totalItems,totalPages,hasNext,hasPrev}}
// Error
{"success": false, "code": "X", "message": "tiếng Việt", "errors": [{"field","message"}], "timestamp": "..."}
```

# 4) Naming convention (không drift)
- DB: `snake_case` (camera_id, created_at)
- BE Entity/DTO + API JSON + FE TS: `camelCase` (cameraId, createdAt)
- FE display label: human Vietnamese ("Camera", "Ngày tạo")

# 5) Config ↔ Usage là 2 đầu 1 sợi dây
Khi implement config, BẮT BUỘC implement luôn usage:
- SystemAdmin tắt Zalo OAuth → login page ẩn button ngay
- SystemAdmin tắt RTSP → form thêm camera ẩn option RTSP, camera RTSP đang chạy → xử lý rõ
- Config load động từ DB mỗi request, không cache cứng

# 6) Shared data, multiple views (sync hoàn toàn)
Detection events xuất hiện ở: live overlay, history page, dashboard chart, notification, camera detail
→ Tất cả dùng chung API + WebSocket event structure, timezone, label, color

# 7) Security 5 layers (không skip layer 4!)
- L1 FE: hide/disable UI (UX, không phải security)
- L2 API gateway: authenticate JWT
- L3 Controller: authorize role (`@PreAuthorize`)
- L4 Service: authorize OWNERSHIP (user này có sở hữu resource?) ← hay bị quên
- L5 DB: `WHERE user_id = ?` row-level isolation

# 8) Test bar cho mỗi API endpoint (24+ cases)
Happy path (2) + Validation errors (8: missing required, wrong type, empty, null, too long, negative, bad email, bad URL) + Auth (5: no token/expired/invalid/wrong role/no ownership) + Not found/conflict (3: 404, 409 duplicate, cascade) + Edge (6: page=0/-1/huge, bad sort, XSS, SQL injection).

Ghi kết quả: `✅ POST /x — 24/24 PASS`.

# 9) UX non-negotiables
- **Không jargon**: "Error 422" → "Email này đã được đăng ký. Thử đăng nhập?"
- **Không placeholder làm label**: label luôn visible
- **Inline validation**: không đợi submit
- **Loading tầng đúng**: skeleton cho page/list, inline spinner cho button, progress cho upload
- **Empty state**: icon + title + description + CTA (không phải "Không có dữ liệu")
- **Toast**: success 3s auto-dismiss, error KHÔNG auto-dismiss
- **Destructive action**: red button + confirmation dialog nêu rõ hậu quả
- **Dark mode + mobile 375px**: test mọi component

# 10) Self-upgrade permission
Khi gặp requirement dở (ví dụ "nhập lat/lng") → ĐỪNG implement nguyên văn:
- Upgrade lên cách tốt hơn (interactive map + geocoding + GPS)
- Ghi vào report/memory: "Đã upgrade X → Y vì lý do Z"
- Không cần xin phép, nhưng phải document

# 11) Anti-patterns (phát hiện là sửa, không cho qua)
- Comment out code thay vì xóa
- `any` trong TypeScript để bypass error
- `console.log` debug còn sót
- Hardcode API key / secret / password
- Skip test case với lý do "chắc ổn"
- Push code chưa test
- Fix 1 chỗ bỏ 9 chỗ còn lại inconsistency
- Bare `try-catch` nuốt lỗi silent

# 12) Khi gặp bug: fix root cause
1. Đọc kỹ error message (không đoán)
2. Xác định root cause (không patch bề mặt)
3. Fix root cause
4. Test case gốc + case liên quan
5. Kiểm tra bug tương tự ở chỗ khác → fix luôn
6. Note vào memory (nếu non-obvious)

# 13) Boy Scout rule
Khi làm task X mà thấy vấn đề nhỏ ở chỗ khác:
- Bug < 30 phút → fix luôn, note trong commit
- Design issue lớn → ghi "Technical Debt" vào CLAUDE.md
- Security issue → fix NGAY, ưu tiên cao nhất
- Inconsistency (naming/format) → fix TẤT CẢ, không fix nửa vời
