---
name: Always rebuild after fix
description: User yêu cầu luôn rebuild Docker image ngay sau khi fix code, không dùng config workaround ở runtime
type: feedback
date: 2026-04-12
---

Mỗi khi fix code xong phải **rebuild Docker image** ngay, không chỉ restart container.

**Why:** Code trong JAR/bundle được đóng gói lúc build. Nếu chỉ sửa file rồi restart, container vẫn chạy code cũ → lệch giữa git commit và runtime. User không muốn có sự lệch này.

**How to apply:**
- Backend (Spring Boot): sửa code/application.yml xong → `docker compose build backend` → `docker compose up backend -d --force-recreate`
- Frontend (Next.js): sửa TSX/JSON xong → `docker compose build frontend` → `docker compose up frontend -d --force-recreate`
- Không dùng workaround như update DB trực tiếp rồi restart - rebuild để config mới take effect.
- Trước khi báo "done", verify `docker images` timestamp phải match git commit time.
