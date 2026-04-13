# 🏆 PROFESSIONAL STANDARDS & SYSTEM CONSISTENCY
# Chuẩn Mực Chuyên Nghiệp — Tương Lai — Nhất Quán Tuyệt Đối

---

## TRIẾT LÝ CỐT LÕI

```
Mày không build "một app camera management".
Mày build "nền tảng giám sát thông minh cấp doanh nghiệp"
mà người dùng sẽ dùng hàng ngày, tin tưởng với dữ liệu thật,
và trả tiền vì nó TỐT HƠN bất kỳ thứ gì họ từng dùng.

Tiêu chuẩn so sánh không phải là "yêu cầu đặt ra".
Tiêu chuẩn so sánh là những sản phẩm tốt nhất trên thị trường:
Vercel Dashboard, Linear, Notion, Grafana, Milestone XProtect.

Nếu nhìn vào thứ mày vừa làm mà thấy
"trông như app demo sinh viên" → làm lại.
```

---

## PHẦN 1 — NGUYÊN TẮC KHI SỬA BẤT CỨ THỨ GÌ

### 1.1 — Quy tắc "Ripple Effect" — Bắt buộc khi sửa bất cứ thứ gì

```
Khi mày sửa hoặc thêm bất cứ thứ gì, dù nhỏ:
  → Trace ngược: Thứ này depend vào cái gì?
  → Trace xuôi: Thứ gì depend vào cái này?
  → Update TẤT CẢ những chỗ liên quan

KHÔNG ĐƯỢC:
  Sửa API response thêm field mới
  mà không update FE để dùng field đó.

KHÔNG ĐƯỢC:
  Sửa DB schema thêm column
  mà không update Repository, Service, DTO, API, FE cùng lúc.

KHÔNG ĐƯỢC:
  Thêm trạng thái mới vào enum
  mà không update tất cả switch/when statement,
  tất cả UI badge/label/color,
  tất cả filter/query liên quan.
```

### 1.2 — Change Impact Checklist — Chạy trước khi commit bất cứ thứ gì

```
KHI THAY ĐỔI DATABASE (thêm/sửa/xóa table, column, index):
  [ ] Flyway migration script được tạo và đặt tên đúng
  [ ] Entity/Model class được update
  [ ] Repository được update (query, projection)
  [ ] Service layer được update (business logic)
  [ ] DTO/Response class được update
  [ ] API documentation được update
  [ ] Seed data được update nếu cần
  [ ] Tất cả query liên quan đã được kiểm tra performance
  [ ] Index mới được thêm nếu cần

KHI THAY ĐỔI API (endpoint, request/response format):
  [ ] Controller được update
  [ ] Service được update
  [ ] DTO được update (cả Request và Response)
  [ ] API docs (OpenAPI spec) được update
  [ ] Frontend API client được update
  [ ] Frontend TypeScript types được update
  [ ] Tất cả component dùng API này được update
  [ ] Error handling được update nếu cần
  [ ] Tests được update

KHI THAY ĐỔI BUSINESS RULE:
  [ ] Tất cả places enforce rule này được update
  [ ] FE validation được update
  [ ] BE validation được update
  [ ] Error messages được update
  [ ] Documentation/comments được update
  [ ] Edge cases của rule mới được test

KHI THÊM TRẠNG THÁI MỚI (enum value, status):
  [ ] Tất cả switch/when/if-else xử lý enum này
  [ ] UI badge/chip color và label
  [ ] Filter dropdown options
  [ ] Dashboard stats/charts
  [ ] Notification triggers
  [ ] API filter parameters
  [ ] DB query conditions
```

---

## PHẦN 2 — CHUẨN GIAO DIỆN CHUYÊN NGHIỆP

### 2.1 — Tiêu chuẩn Visual Design tối thiểu

```
LAYOUT & SPACING
  → Dùng 8px grid system nhất quán tuyệt đối
  → Không có magic numbers trong CSS/Tailwind
  → Mọi trang có max-width phù hợp (không bị quá rộng ở 2560px)
  → Sidebar/header height nhất quán xuyên suốt app
  → Content area padding nhất quán

TYPOGRAPHY HIERARCHY
  → H1: Page title — 1 cái duy nhất mỗi trang
  → H2: Section title
  → H3: Card/widget title
  → Body: 14–16px, line-height 1.5–1.6
  → Caption/Label: 12px, không nhỏ hơn
  → Monospace: cho ID, code, tọa độ, timestamps

COLOR SYSTEM
  → Primary brand color nhất quán tuyệt đối
  → Semantic colors (success/warning/error/info) nhất quán tuyệt đối
  → Không dùng quá 5 màu trên 1 màn hình (trừ charts)
  → Dark mode: test từng component, không để bị invisible
  → Opacity và transparency nhất quán

COMPONENT CONSISTENCY
  → Button sizes: sm/md/lg — dùng đúng size theo context
  → Input/Select/Textarea: cùng height, border-radius, padding
  → Card: cùng shadow, border-radius, padding
  → Badge/Chip: cùng font-size, padding, border-radius
  → Table: cùng row height, header style, hover state
  → Modal: cùng max-width, padding, close button position
```

### 2.2 — UX Patterns bắt buộc cho từng loại màn hình

**Dashboard / Overview Page:**
```
✅ Phải có:
  → Summary cards với trend indicator (↑↓ so với hôm qua/tuần trước)
  → Real-time update (số liệu không stale)
  → Time range selector (hôm nay / 7 ngày / 30 ngày / custom)
  → Quick action shortcuts đến tính năng hay dùng nhất
  → Alert/warning nổi bật nếu có vấn đề (camera offline, pending approval)
  → Chart có tooltip chi tiết khi hover
  → Responsive: cards stack đẹp trên mobile
```

**List / Table Page:**
```
✅ Phải có:
  → Search với debounce (300ms)
  → Filter panel (collapse được trên mobile)
  → Sort trên mỗi column có nghĩa
  → Pagination với size selector (10/25/50/100)
  → Hiển thị "Đang hiển thị X–Y trong tổng Z kết quả"
  → Bulk action khi select nhiều row
  → Export (CSV/Excel) nếu là danh sách data quan trọng
  → Empty state đẹp với CTA
  → Loading skeleton (không phải spinner toàn trang)
  → Row click → navigate đến detail (không phải chỉ button)

✅ Với camera list cụ thể:
  → Status badge realtime (WebSocket update)
  → Thumbnail preview nhỏ hoặc status indicator
  → Quick action inline (start/stop không cần vào detail)
  → Group filter sidebar/tabs
  → View toggle: Grid view và List view
```

**Detail / Form Page:**
```
✅ Phải có:
  → Breadcrumb navigation
  → Section grouping rõ ràng (không phải 1 form dài vô tận)
  → Auto-save draft nếu form dài
  → Unsaved changes warning khi navigate away
  → Sticky save/action bar khi form dài
  → Related information widgets bên cạnh (không phải trang riêng)
  → Activity/audit log widget (ai làm gì, khi nào)
  → Keyboard shortcut: Ctrl+S để save
```

**Live View / Real-time Page:**
```
✅ Phải có:
  → Connection status indicator (rõ ràng: đang kết nối / live / mất kết nối)
  → FPS indicator (thực tế)
  → Toggle từng detection layer (xe / người / biển số / vi phạm)
  → Detection confidence threshold slider realtime
  → Fullscreen mode
  → Snapshot button (lưu frame hiện tại)
  → Detection event sidebar (realtime log các events vừa xảy ra)
  → PTZ control nếu camera hỗ trợ
  → Timestamp overlay trên video
  → Khi mất kết nối: auto-reconnect với countdown + nút reconnect thủ công
```

**Settings / Config Page:**
```
✅ Phải có:
  → Preview/effect ngay lập tức khi thay đổi (nếu có thể)
  → Save confirmation với summary những gì sẽ thay đổi
  → Reset to default button với confirmation
  → Lịch sử thay đổi config (ai đổi gì, khi nào)
  → Validation realtime (không đợi submit)
  → Test connection / Verify button cho external config
  → Phân section rõ ràng, không scroll dài vô tận
```

---

## PHẦN 3 — TÍNH NĂNG NÂNG CAO CHỦ ĐỘNG THÊM VÀO

Đây là những tính năng KHÔNG có trong requirement gốc nhưng
mày có QUYỀN và TRÁCH NHIỆM tự thêm vào vì chúng:
- Hoàn thiện hệ thống
- Cần thiết cho production
- Phòng ngừa vấn đề sau này
- Tạo giá trị thực sự cho người dùng

### 3.1 — Audit & Traceability (Bắt buộc thêm)
```
Tại sao: Khi có tranh chấp, lỗi, hoặc security incident
         phải biết "ai làm gì lúc nào"

Thêm vào:
  → Audit log table: user_id, action, entity_type, entity_id,
                     old_value (JSON), new_value (JSON), ip, timestamp
  → Log tất cả: create/update/delete camera, approve/reject,
                login/logout, config changes, permission changes
  → UI: Trang audit log cho Admin/SuperAdmin với filter mạnh
  → Retention policy: config được bao lâu thì purge
```

### 3.2 — Health Monitoring (Bắt buộc thêm)
```
Tại sao: Production system phải tự biết mình đang ở trạng thái nào

Thêm vào:
  → Camera health check: ping RTSP mỗi 30s, update status tự động
  → Worker node health: CPU/RAM/GPU usage tracking
  → API health endpoint: /actuator/health với chi tiết từng component
  → Alert rules: camera offline > 5 phút → notify owner
  → Dashboard: heatmap camera uptime theo giờ trong ngày
  → Metrics: detection count/rate theo camera, theo giờ
```

### 3.3 — Smart Notifications (Bắt buộc thêm)
```
Tại sao: Notification quá nhiều = người dùng tắt hết
         Notification đúng lúc = người dùng yêu thích app

Thêm vào:
  → Notification grouping: không spam 100 cái riêng lẻ
    (gom lại: "Camera X detect 47 xe trong 1 giờ qua")
  → Quiet hours: user set giờ không nhận push (vẫn lưu DB)
  → Digest mode: gửi summary mỗi sáng thay vì realtime
  → Priority levels: critical (camera offline) luôn gửi
    vs info (detection summary) theo preference
  → Notification preferences per-event-type per-channel
    (FCM / in-app / email)
```

### 3.4 — Data Export & Reporting (Bắt buộc thêm)
```
Tại sao: Người dùng enterprise luôn cần báo cáo

Thêm vào:
  → Export detection history: CSV, Excel với filter
  → Scheduled reports: tự động gửi email báo cáo hàng ngày/tuần
  → Report templates: xe nhiều nhất theo giờ, camera hoạt động kém nhất
  → Chart export: save chart thành PNG/PDF
  → API access: endpoint để hệ thống khác pull data
    (với API key authentication)
```

### 3.5 — Search & Filter Nâng Cao (Bắt buộc thêm)
```
Tại sao: Khi có nhiều camera/data, search kém = app unusable

Thêm vào:
  → Global search: gõ ở thanh search trên → tìm camera/event/user
  → Detection search by license plate: nhập biển số → xem lịch sử
  → Saved filters: user save bộ filter hay dùng
  → Search history: gợi ý dựa trên lịch sử search
  → Advanced filter: combine nhiều điều kiện (AND/OR)
```

### 3.6 — Camera Intelligence (Bắt buộc thêm)
```
Tại sao: Đây là sản phẩm AI — phải thể hiện giá trị AI

Thêm vào:
  → Detection statistics per camera:
    - Giờ cao điểm (peak hours chart)
    - Loại phương tiện phổ biến nhất
    - Trend so sánh tuần này vs tuần trước
  → Anomaly detection:
    - Camera thường detect 100 xe/giờ, đột nhiên 0 → alert
    - Camera detect nhiều bất thường → flag để review
  → Heatmap timeline:
    - Xem lại "lúc X giờ hôm qua có gì xảy ra" nhanh
    - Timeline bar theo giờ, màu đậm = nhiều event
```

### 3.7 — System Resilience (Bắt buộc thêm)
```
Tại sao: Production phải chạy ổn dù có sự cố

Thêm vào:
  → Detection event queue với retry logic
    (nếu lưu DB fail → retry 3 lần → dead letter queue)
  → Camera reconnect policy:
    (offline → retry mỗi 30s → sau 5 phút notify owner)
  → Graceful degradation flags:
    (nếu AI service down → camera vẫn stream, chỉ tắt detect)
  → Rate limiting per user/IP trên tất cả API
  → Request idempotency cho các operation quan trọng
    (approve camera 2 lần không tạo 2 record)
```

### 3.8 — Onboarding & Empty States (Bắt buộc thêm)
```
Tại sao: First impression quyết định retention

Thêm vào:
  → First login wizard: 3 bước setup camera đầu tiên
  → Contextual tips: tooltip/guide xuất hiện đúng lúc
  → Empty states có ý nghĩa: không phải "Không có dữ liệu"
    mà là "Chưa có camera nào → [Thêm camera đầu tiên]"
  → Progress indicator: setup hoàn thành bao nhiêu % (gamification nhẹ)
  → Sample data option: "Thêm camera demo để xem thử"
```

---

## PHẦN 4 — DB / API / FE PHẢI LUÔN ĐỒNG BỘ

### 4.1 — Quy tắc Single Source of Truth

```
Type/Interface chỉ được định nghĩa 1 LẦN DUY NHẤT:

  DB Schema     → Flyway migration (source of truth cho structure)
  Backend DTO   → Kotlin data class (source of truth cho API contract)
  Frontend Type → TypeScript interface (generated từ hoặc mirror BE DTO)

Khi thay đổi DB → phải update BE DTO → phải update FE Type
KHÔNG được để 3 cái này drift xa nhau
```

### 4.2 — Naming Convention nhất quán tuyệt đối

```
DB (snake_case):          camera_id, created_at, detection_type
BE Entity (camelCase):    cameraId, createdAt, detectionType
BE DTO (camelCase):       cameraId, createdAt, detectionType
API JSON (camelCase):     { "cameraId": 1, "createdAt": "..." }
FE TypeScript (camelCase):cameraId: number, createdAt: string
FE Display:               "Camera ID", "Ngày tạo", "Loại nhận diện"

KHÔNG ĐƯỢC:
  DB: camera_id
  API: cameraId ở chỗ này, camera_id ở chỗ kia
  FE: cameraID (viết hoa ID)
```

### 4.3 — API Response nhất quán tuyệt đối

```kotlin
// Success - single object
{
  "success": true,
  "code": "CAMERA_FETCHED",
  "data": { ... },
  "timestamp": "2025-01-01T00:00:00Z"
}

// Success - paginated list
{
  "success": true,
  "code": "CAMERAS_FETCHED",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "size": 20,
      "totalItems": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "..."
}

// Error
{
  "success": false,
  "code": "CAMERA_NOT_FOUND",         // machine-readable
  "message": "Camera không tồn tại",  // human-readable (tiếng Việt)
  "errors": [                          // field-level errors (optional)
    { "field": "name", "message": "Tên camera không được để trống" }
  ],
  "timestamp": "..."
}
```

**KHÔNG ĐƯỢC có bất kỳ endpoint nào response format khác với trên.**

### 4.4 — Enum phải nhất quán từ DB đến UI

```
Khi thêm/sửa enum value, bắt buộc update TẤT CẢ:

  1. DB: ENUM definition trong migration
  2. BE: Kotlin enum class
  3. BE: Tất cả when() expression liên quan
  4. BE: Repository query filter
  5. API: Response/Request DTO validation
  6. FE: TypeScript union type
  7. FE: Display label mapping (PENDING → "Chờ duyệt")
  8. FE: Color/badge mapping (PENDING → yellow)
  9. FE: Filter dropdown options
  10. FE: Dashboard chart legend
  11. FE: Notification message template
```

---

## PHẦN 5 — CHECKLIST TRƯỚC KHI NÓI "DONE"

```
MỨC ĐỘ 1 — FUNCTIONAL (bắt buộc)
  [ ] Happy path hoạt động end-to-end
  [ ] Error cases được xử lý đúng
  [ ] Permission/auth đúng ở cả FE và BE
  [ ] Data được validate ở cả FE và BE

MỨC ĐỘ 2 — CONSISTENCY (bắt buộc)
  [ ] DB schema đồng bộ với BE entity
  [ ] BE DTO đồng bộ với FE type
  [ ] Naming convention nhất quán
  [ ] API response format nhất quán
  [ ] Enum/status label/color nhất quán với phần còn lại
  [ ] Ripple effect: tất cả chỗ liên quan đã được update

MỨC ĐỘ 3 — QUALITY (bắt buộc)
  [ ] UI nhìn chuyên nghiệp, không có pixel lệch, spacing lạ
  [ ] Dark mode không bị vỡ
  [ ] Mobile responsive không bị vỡ
  [ ] Loading/empty/error state đầy đủ
  [ ] Không có console.error, không có TypeScript error
  [ ] Không có N+1 query
  [ ] Không có memory leak obvious

MỨC ĐỘ 4 — EXCELLENCE (cố gắng đạt)
  [ ] Advanced features liên quan đã được thêm
  [ ] Audit log đã được thêm cho actions quan trọng
  [ ] Performance: trang load < 1s, API < 200ms
  [ ] UX micro-interactions: animation, transition mượt mà
  [ ] Keyboard navigation hoạt động
  [ ] Tooltip/helper text đúng chỗ, đúng lúc
```

---

## PHẦN 6 — KHI NHẬN RA CÓ VẤN ĐỀ TRONG HỆ THỐNG

```
Dù vấn đề đó không thuộc task hiện tại:

NGUYÊN TẮC: "Boy Scout Rule" — Luôn để code sạch hơn khi mày rời đi

NẾU là bug nhỏ (< 30 phút fix):
  → Fix ngay, note vào commit message

NẾU là vấn đề design lớn hơn:
  → Tạo entry trong CLAUDE.md section "Technical Debt"
  → Mô tả vấn đề, impact, và proposed fix
  → Estimate effort
  → Flag để address trong task tiếp theo

NẾU là security issue:
  → Fix NGAY, không trì hoãn
  → Ưu tiên cao nhất

NẾU là inconsistency (naming, format, pattern):
  → Fix toàn bộ cùng lúc, không fix nửa vời
  → "Một số chỗ dùng camelCase, một số dùng snake_case"
     → phải fix TẤT CẢ chứ không phải chỗ mày đang làm
```

---

## PHẦN 7 — CHUẨN MỰC SẢN PHẨM CUỐI CÙNG

```
Khi hoàn thành toàn bộ dự án, người dùng phải cảm nhận:

"App này NHANH" 
  → Page load < 1s, API response < 200ms, animation 60fps

"App này THÔNG MINH"
  → Tự động, gợi ý đúng, không bắt nhập tay những gì máy làm được

"App này TIN CẬY"
  → Không bao giờ mất data, luôn biết chuyện gì đang xảy ra

"App này DỄ DÙNG"
  → Lần đầu dùng không cần hướng dẫn

"App này CHUYÊN NGHIỆP"
  → Nhìn vào biết ngay là sản phẩm serious, không phải demo

Nếu sản phẩm chưa đạt được 5 điều này → chưa xong.
```
