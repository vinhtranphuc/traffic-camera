# 🤖 Autonomous Development, UX/UI & Testing Prompt

## ⚠️ ĐỌC TOÀN BỘ TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ

Đây là chỉ thị hành vi xuyên suốt toàn bộ quá trình phát triển.
Không phải làm 1 lần — áp dụng liên tục ở MỌI bước, MỌI file, MỌI tính năng.

---

## PHẦN 1 — TƯ DUY & TRIẾT LÝ PHÁT TRIỂN

### 1.1 Không làm vừa đủ — luôn làm tốt nhất có thể

Với MỖI component, MỖI trang, MỖI API mày viết, hãy tự hỏi:
```
❓ Đây đã là cách tốt nhất chưa?
❓ Nếu tao là người dùng lần đầu, tao có bị confused không?
❓ Nếu tao là senior engineer review code này, tao có gật đầu không?
❓ Có edge case nào tao chưa xử lý không?
❓ UX flow này có tự nhiên không hay người dùng phải đoán?
```
Nếu câu trả lời là KHÔNG → sửa ngay, đừng để lại.

### 1.2 Feedback loop bắt buộc sau mỗi feature

```
Viết code
  → Tự review lại toàn bộ
    → Phát hiện vấn đề
      → Sửa trước khi chuyển sang feature tiếp theo
        → Ghi lại những gì đã cải thiện vào CLAUDE.md
```

Không được phép chuyển sang feature mới khi feature hiện tại chưa đạt chuẩn.

---

## PHẦN 2 — TỰ ĐỘNG CẢI THIỆN UX/UI

### 2.1 Checklist UX bắt buộc cho MỖI màn hình

Sau khi viết xong bất kỳ trang/component nào, chạy qua checklist này:

```
LOADING STATES
  [ ] Có skeleton screen khi đang fetch data không?
  [ ] Button có disabled + spinner khi đang submit không?
  [ ] Có loading indicator cho lazy-load images không?

EMPTY STATES
  [ ] Danh sách trống có hiển thị empty state đẹp không?
      (icon + tiêu đề + mô tả + call-to-action)
  [ ] Search không có kết quả có thông báo rõ không?

ERROR STATES
  [ ] API lỗi có hiển thị message thân thiện không? (không phải "Error 500")
  [ ] Network offline có được xử lý không?
  [ ] Form validation lỗi có highlight đúng field không?
  [ ] Có retry button khi fetch thất bại không?

FEEDBACK & CONFIRMATION
  [ ] Mọi action thành công có toast/notification không?
  [ ] Action nguy hiểm (xóa, khóa tài khoản) có confirmation dialog không?
  [ ] Form submit xong có clear form hoặc redirect hợp lý không?

ACCESSIBILITY
  [ ] Tất cả interactive element có thể dùng bằng keyboard không?
  [ ] Contrast color đủ chuẩn WCAG AA không?
  [ ] Có aria-label cho icon-only buttons không?
  [ ] Focus trap trong modal/dialog chưa?

RESPONSIVE
  [ ] Test ở 375px (mobile nhỏ) có bị vỡ layout không?
  [ ] Test ở 768px (tablet) ổn không?
  [ ] Test ở 1920px (màn hình lớn) không bị quá rộng không?
  [ ] Table/grid có horizontal scroll trên mobile không?

PERFORMANCE
  [ ] Image có lazy loading không?
  [ ] List dài có virtualization không? (>100 items)
  [ ] Có debounce cho search input không?
  [ ] API call có được cancel khi component unmount không?
```

### 2.2 Nguyên tắc UX cụ thể phải tuân theo

```
NAVIGATION
  - Breadcrumb cho trang sâu hơn 2 cấp
  - Active state rõ ràng trên sidebar/menu
  - Back button hoạt động đúng (không mất data)
  - URL phản ánh đúng trạng thái (shareable links)

FORMS
  - Label luôn visible (không dùng placeholder thay label)
  - Inline validation (không đợi submit mới báo lỗi)
  - Required fields được đánh dấu rõ
  - Auto-focus vào field đầu tiên khi mở form
  - Enter key submit form (khi hợp lý)
  - Disable submit khi đang loading

DATA TABLES / LISTS
  - Sortable columns có indicator hướng sort
  - Pagination rõ ràng (tổng số, đang ở trang mấy)
  - Row hover state
  - Bulk action khi select nhiều items
  - Column width không nhảy khi data thay đổi

MODALS / DIALOGS
  - Click outside để close (trừ form quan trọng)
  - ESC key để close
  - Scroll lock body khi modal mở
  - Animation mở/đóng mượt mà
  - Focus management đúng chuẩn

NOTIFICATIONS
  - Toast tự động dismiss sau 3–5 giây
  - Error toast không tự dismiss (cần user đọc)
  - Không stack quá 3 toast cùng lúc
  - Position nhất quán (top-right hoặc bottom-right)
```

### 2.3 Tiêu chuẩn thiết kế tối thiểu

```
SPACING
  - Dùng spacing scale nhất quán (4px base: 4, 8, 12, 16, 24, 32, 48, 64)
  - Không dùng giá trị random (13px, 17px, 22px)

TYPOGRAPHY
  - Tối đa 3 font size trên 1 màn hình
  - Line-height đủ để đọc (1.5 cho body text)
  - Không dùng text quá nhỏ < 12px

COLOR
  - Primary action: 1 màu nhất quán xuyên suốt app
  - Destructive action: luôn dùng màu đỏ
  - Success: luôn dùng màu xanh lá
  - Warning: luôn dùng màu vàng/cam
  - Dark mode: test tất cả component

INTERACTION
  - Hover state cho tất cả clickable elements
  - Cursor: pointer cho buttons/links
  - Transition 150–200ms cho hover/focus
  - Không dùng animation > 300ms cho UI thông thường
```

### 2.4 Sau khi làm xong 1 tính năng — tự phản biện

Đặt mình vào vai người dùng và đi qua flow này:
```
Kịch bản 1 — Happy path: Làm đúng mọi thứ → phải hoạt động trơn tru
Kịch bản 2 — Lần đầu dùng: Không biết gì → có bị confused không?
Kịch bản 3 — Người dùng vội: Click nhanh, submit nhiều lần → có bị lỗi không?
Kịch bản 4 — Người dùng cẩu thả: Bỏ trống field, nhập sai format → có báo lỗi rõ không?
Kịch bản 5 — Mạng chậm: 3G, latency 3 giây → UI có phản hồi không?
Kịch bản 6 — Mobile: Ngón tay to, màn hình nhỏ → có dùng được không?
```
Nếu bất kỳ kịch bản nào có vấn đề → sửa trước khi tiếp tục.

---

## PHẦN 3 — TỰ ĐỘNG TEST

### 3.1 Sau khi viết xong MỖI API endpoint (Backend)

Chạy toàn bộ các case sau bằng curl, KHÔNG bỏ qua bất kỳ case nào:

```bash
# Template test cho mỗi endpoint:

### ✅ HAPPY PATH
# 1. Request hợp lệ với đủ dữ liệu
# 2. Request hợp lệ với dữ liệu tối thiểu (optional fields bỏ trống)
# 3. Request với các giá trị biên (boundary values)

### ❌ VALIDATION ERRORS
# 4. Thiếu required field
# 5. Sai kiểu dữ liệu (string thay vì number)
# 6. Giá trị rỗng ("")
# 7. Giá trị null
# 8. String quá dài (vượt maxLength)
# 9. Số âm khi chỉ chấp nhận dương
# 10. Email sai format
# 11. URL sai format

### 🔐 AUTHENTICATION & AUTHORIZATION
# 12. Không có token → phải trả 401
# 13. Token hết hạn → phải trả 401
# 14. Token sai → phải trả 401
# 15. Token đúng nhưng sai role → phải trả 403
# 16. Token đúng, role đúng nhưng không sở hữu resource → phải trả 403/404

### 🔍 NOT FOUND / CONFLICT
# 17. ID không tồn tại → phải trả 404
# 18. Tạo duplicate (unique constraint) → phải trả 409
# 19. Xóa resource đang được reference → phải xử lý đúng

### 🌐 EDGE CASES
# 20. Pagination: page=0, page=-1, page=99999
# 21. Sort: field không hợp lệ
# 22. Filter: giá trị không hợp lệ
# 23. Search: ký tự đặc biệt, SQL injection attempt, XSS attempt
# 24. Concurrent request: gửi 2 request giống nhau cùng lúc
```

Ghi kết quả vào CLAUDE.md:
```
✅ POST /api/cameras — tested 24/24 cases — PASS
❌ GET /api/cameras/:id — case 16 fail → đã sửa → retest PASS
```

### 3.2 Sau khi viết xong MỖI tính năng Frontend

```
FUNCTIONAL TESTS (tự làm thủ công trong browser)
  [ ] Happy path hoạt động đúng
  [ ] Tất cả button/link có response
  [ ] Form submit đúng data lên API
  [ ] Data từ API hiển thị đúng
  [ ] Pagination hoạt động
  [ ] Sort/filter hoạt động
  [ ] Search debounce hoạt động

INTEGRATION TESTS
  [ ] Flow end-to-end: từ UI → API → DB → hiển thị lại
  [ ] Realtime: WebSocket event cập nhật UI đúng không
  [ ] Notification: trigger → nhận → hiển thị → đánh dấu đọc

EDGE CASES
  [ ] Thử với data rỗng
  [ ] Thử với data rất dài (tên 200 ký tự)
  [ ] Thử double-click submit
  [ ] Thử navigate away khi đang submit
  [ ] Thử refresh giữa chừng
  [ ] Thử với dark mode
  [ ] Thử với zoom 150%

RESPONSIVE
  [ ] Chrome DevTools: 375px, 768px, 1280px, 1920px
  [ ] Landscape mobile orientation
```

### 3.3 Sau khi viết xong 1 USER FLOW hoàn chỉnh

Chạy end-to-end test theo từng role:

```
CUSTOMER FLOW
  [ ] Đăng ký → nhận OTP email → xác thực → login thành công
  [ ] Login Google OAuth → redirect đúng → profile hiển thị
  [ ] Thêm camera → status PENDING → Admin nhận notification
  [ ] Xem danh sách camera → filter/sort/search hoạt động
  [ ] Xem live view → stream load được
  [ ] Xem lịch sử detect → pagination đúng
  [ ] Bật/tắt notification → vẫn nhận ở danh sách
  [ ] Đổi mật khẩu → logout → login lại với pass mới

ADMIN FLOW
  [ ] Login → thấy đúng danh sách KH được phân công
  [ ] Nhận notification khi KH thêm camera
  [ ] Click notification → đến trang approve đúng
  [ ] Approve camera → KH nhận notification → camera ACTIVE
  [ ] Reject camera (có lý do) → KH nhận notification
  [ ] Thêm camera cho KH → ACTIVE ngay không cần approve
  [ ] Khóa tài khoản KH → KH không login được

SUPERADMIN FLOW
  [ ] Tạo Admin mới → phân công KH cho Admin
  [ ] Admin mới login → thấy đúng KH được phân công
  [ ] Xem resource monitor → camera nào tốn nhất

SYSTEMADMIN FLOW
  [ ] Tắt nguồn RTSP → tất cả tài khoản không thấy option RTSP
  [ ] Cập nhật Firebase config → push notification vẫn hoạt động
  [ ] Khóa SuperAdmin → SuperAdmin không login được
```

---

## PHẦN 4 — TỰ ĐỘNG NÂNG CẤP CODE

### 4.1 Sau khi viết xong 1 module — tự review và refactor

```
BACKEND REVIEW CHECKLIST
  [ ] Service layer không chứa business logic của layer khác
  [ ] Repository không chứa business logic
  [ ] Không có magic numbers (dùng constants/enum)
  [ ] Không có duplicated code (extract thành shared function)
  [ ] Error handling đầy đủ, không có bare try-catch bỏ trống
  [ ] Log đủ thông tin để debug (không log password/token)
  [ ] Transaction đúng chỗ (các operation liên quan cùng transaction)
  [ ] N+1 query đã được xử lý chưa (dùng JOIN thay vì loop query)
  [ ] Index DB cho các field hay query

FRONTEND REVIEW CHECKLIST
  [ ] Component có quá nhiều responsibility không? (tách nhỏ nếu > 200 lines)
  [ ] Custom hook cho logic phức tạp
  [ ] Không có useEffect dependency array sai
  [ ] Không có memory leak (cleanup subscriptions/timers)
  [ ] Prop drilling quá sâu? (dùng Context hoặc Zustand)
  [ ] Memoization đúng chỗ (useMemo/useCallback khi cần)
  [ ] Không import cả thư viện khi chỉ dùng 1 function
```

### 4.2 Pattern tự cải thiện liên tục

```
Mỗi khi mày nhận ra mình đang lặp lại code → DỪNG LẠI → extract
Mỗi khi mày thấy component/function quá dài → DỪNG LẠI → tách
Mỗi khi mày copy-paste code → DỪNG LẠI → tạo shared utility
Mỗi khi mày hardcode string → DỪNG LẠI → dùng constant/i18n key
Mỗi khi mày viết query phức tạp → DỪNG LẠI → thêm index + explain
```

---

## PHẦN 5 — QUẢN LÝ TIẾN ĐỘ & GHI CHÉP

### 5.1 Cấu trúc CLAUDE.md bắt buộc

```markdown
# CLAUDE.md

## Kiến trúc & Quyết định thiết kế
- [Ghi lại mọi quyết định quan trọng và lý do]

## Entity Relationship Map
- [Sơ đồ quan hệ các bảng DB]

## API Endpoints (cập nhật liên tục)
| Method | Path | Auth | Role | Status | Tested |
|--------|------|------|------|--------|--------|
| POST | /api/auth/login | No | All | ✅ Done | ✅ 24/24 |

## Tiến độ Feature
| Feature | BE | FE | Tested | Notes |
|---------|----|----|--------|-------|
| Auth | ✅ | ✅ | ✅ | |

## Bugs đã phát hiện & đã sửa
- [Date] Bug: ... → Fix: ...

## Cải thiện UX đã thực hiện
- [Date] Trang X: thêm skeleton screen, empty state, error handling

## TODO / Known Issues
- [ ] ...
```

### 5.2 Quy tắc commit (khi dùng git)

```
feat: thêm tính năng mới
fix: sửa bug
refactor: cải thiện code không thay đổi behavior
ux: cải thiện UX/UI
test: thêm test hoặc sửa test
perf: cải thiện performance
docs: cập nhật tài liệu
```

---

## PHẦN 6 — NGUYÊN TẮC KHÔNG ĐƯỢC VI PHẠM

```
❌ TUYỆT ĐỐI KHÔNG
  - Viết TODO rồi bỏ đó không làm
  - Bỏ qua bất kỳ test case nào với lý do "chắc ổn"
  - Copy code mà không hiểu nó làm gì
  - Hardcode giá trị nhạy cảm (API key, password, secret)
  - Để console.log/print debug trong code production
  - Bỏ qua lỗi TypeScript bằng cách dùng 'any'
  - Comment out code thay vì xóa
  - Push code chưa test

✅ LUÔN LUÔN PHẢI
  - Test trước khi chuyển sang task tiếp theo
  - Xử lý tất cả error cases
  - Cập nhật CLAUDE.md khi có thay đổi quan trọng
  - Tự hỏi "có cách nào tốt hơn không?" trước khi done
  - Đảm bảo dark mode và mobile đều hoạt động
  - Validate input ở cả FE lẫn BE
```

---

## PHẦN 7 — KHI GẶP VẤN ĐỀ

### Quy trình debug bắt buộc

```
Bước 1: Đọc kỹ error message — đừng đoán mò
Bước 2: Xác định chính xác nguyên nhân gốc rễ
Bước 3: Sửa nguyên nhân gốc rễ (không patch bề mặt)
Bước 4: Test lại case gây ra bug + các case liên quan
Bước 5: Ghi vào CLAUDE.md: bug gì, nguyên nhân, cách fix
Bước 6: Kiểm tra xem bug tương tự có ở chỗ khác không → sửa luôn
```

### Khi không chắc về cách implement

```
Bước 1: Phân tích ít nhất 2–3 cách tiếp cận
Bước 2: So sánh pros/cons của từng cách
Bước 3: Chọn cách phù hợp nhất với context của dự án
Bước 4: Ghi lại quyết định vào CLAUDE.md
Không được implement kiểu "đại khái đúng" rồi tiếp tục
```

---

## TÓM TẮT: VÒNG LẶP BẮT BUỘC CHO MỖI TASK

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. PHÂN TÍCH  → Hiểu rõ yêu cầu, edge cases      │
│       ↓                                             │
│  2. THIẾT KẾ   → Nghĩ trước khi code               │
│       ↓                                             │
│  3. IMPLEMENT  → Code theo best practice            │
│       ↓                                             │
│  4. SELF-REVIEW → Đọc lại toàn bộ code vừa viết   │
│       ↓                                             │
│  5. TEST       → Chạy tất cả cases (BE: curl,      │
│                  FE: manual + edge cases)           │
│       ↓                                             │
│  6. UX REVIEW  → Chạy qua UX checklist             │
│       ↓                                             │
│  7. REFACTOR   → Cải thiện nếu cần                 │
│       ↓                                             │
│  8. DOCUMENT   → Cập nhật CLAUDE.md                │
│       ↓                                             │
│  ✅ DONE → Chuyển sang task tiếp theo              │
│                                                     │
└─────────────────────────────────────────────────────┘

Bỏ qua bất kỳ bước nào = KHÔNG ĐƯỢC PHÉP
```
