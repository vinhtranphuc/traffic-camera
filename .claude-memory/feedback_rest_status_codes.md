---
name: REST status codes correctness
description: Fix 500 → 400 cho malformed/type-mismatch, 403 → 401 cho unauth
type: feedback
date: 2026-04-13
---

**Rule**: Backend exception handler + security config phải trả đúng HTTP status code theo REST convention. Không được để 500 cho client-side errors.

**Why**: Adversarial test iter 4 (2026-04-13) phát hiện:
1. Malformed JSON body → 500 (leak server error cho client-side problem)
2. Type mismatch trong @RequestBody → 500 (cùng issue)
3. Unauth → 403 thay vì 401 (Spring Security default không phân biệt "anonymous" vs "known-but-forbidden")
Clients dùng 401 để trigger login flow; 403 để show "access denied". Fuzzed stacktraces lộ info. Đây là standard REST hygiene (AUTONOMOUS_DEV_PROMPT checklist case 4, 12).

**How to apply**: 
- `GlobalExceptionHandler.kt`: bắt thêm `HttpMessageNotReadableException` (400 MALFORMED_REQUEST) + `MethodArgumentTypeMismatchException` (400 INVALID_PARAMETER) TRƯỚC generic `Exception` handler.
- `SecurityConfig.kt`: config `exceptionHandling { authenticationEntryPoint(...) }` trả 401 cho request không có auth, viết JSON theo format `{success, code, message}`.
- Jackson lenient boolean (accept `1` as `true`) là default, không coi là bug — chỉ ensure không 500.
