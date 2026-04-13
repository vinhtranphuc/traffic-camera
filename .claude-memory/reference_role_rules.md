---
name: Role Hierarchy & Data Scoping Rules
description: Rules về tạo user, notification routing, audit/data visibility theo role
type: reference
date: 2026-04-13
---

## Role Creation Rules (prompts/3.md)

- **SystemAdmin** → tạo được `SUPER_ADMIN`
- **SuperAdmin** → tạo được `ADMIN` hoặc `CUSTOMER`
- **Admin** → tạo được `CUSTOMER` (và auto-assign về mình)

### Khi tạo Admin (SuperAdmin):
- Optional: chọn nhiều customers để gán (`customerIds: string[]`)
- 1 customer đã có admin khác → assignment cũ được xóa, gán admin mới
- Sau tạo, có thể gán thêm qua trang admin-assignments

### Khi tạo Customer:
- SuperAdmin: optional `adminId` để gán. Nếu bỏ trống → SuperAdmin tự đảm nhận
- Admin: tự động gán về admin đang tạo (creator)
- 1 customer = 1 admin max (enforce ở service level, throw `CUSTOMER_ALREADY_ASSIGNED`)

## Notification Routing (approval camera)

- Customer có Admin quản lý → notify **chỉ Admin đó**
- Customer không có Admin → notify **tất cả SuperAdmin**
- **KHÔNG** fallback notify all admins (cũ) — SuperAdmin thay thế role Admin

## Data Scoping

### Audit log:
- SystemAdmin + SuperAdmin: see all
- Admin: only own + managed customers
- Customer: forbidden

### Camera/Dashboard/Detection:
- SystemAdmin: all
- SuperAdmin: all (is at top of cameras, sees everything)
- Admin: own + managed customers (via `findCustomerIdsByAdminId` + self)
- Customer: only own

### Filter by user for SA/SysAdmin:
- `/api/v1/audit-logs?userId=...` - filter by specific user
- Admin filter bị ép về scope của mình (không bypass được)
- **Quan trọng**: Nếu Admin filter userId ngoài scope → return empty (không leak). Không fallback về scoped list khi userId out-of-scope.

## Known edge cases (chưa cover trong prompts/3.md)
- **Admin bị lock**: customers của admin đó vẫn được assign → notification vẫn route đến admin bị lock. Prompts/3.md chỉ nói "không có admin → SuperAdmin", không xét case admin locked. Nếu business cần, có thể thêm: treat locked admin as "no admin" → fall back SuperAdmin.
- **Không có deleteUser endpoint**: chỉ lock/unlock. Nếu implement delete sau, phải cascade assignments.

## Implementation files
- `UserService.createUser`: allowed roles + assignment creation
- `UserService.validateCreateAccess`: SuperAdmin can create both ADMIN + CUSTOMER
- `CameraService.notifyAdminsOfApprovalRequest`: routing logic
- `AuditLogService.list`: role-based scoping via `scopedUserIds()`
- `AdminCustomerAssignmentRepository.findByCustomerId`: 1:1 check
