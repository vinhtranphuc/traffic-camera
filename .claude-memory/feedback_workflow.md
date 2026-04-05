---
name: feedback_workflow
description: Quy tắc bắt buộc - mỗi thay đổi phải ghi memory + git commit
type: feedback
date: 2026-04-05
---

Sau mỗi lần hoàn thành yêu cầu chỉnh sửa từ user, PHẢI:
1. Ghi lại vào `.claude-memory/`
2. Git commit kèm message mô tả yêu cầu của user

**Why:** User muốn mọi thay đổi đều có trace - cả trong memory (để hiểu context) lẫn trong git (để track history). Không được bỏ sót bước nào.

**How to apply:** Coi đây là bước cuối cùng bắt buộc của MỌI task. Chưa commit + ghi memory = chưa xong task.
