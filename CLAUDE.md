# Traffic Camera - AI Assistant Configuration

## Project Overview
Dự án camera phát hiện giao thông (Traffic Camera Detection System).

## Language
- Giao tiếp với user bằng **tiếng Việt** (user nói tiếng Việt).
- Code, comments trong code, commit messages viết bằng **tiếng Anh**.

## Memory System - Project-Local

**TẤT CẢ memory/context PHẢI được lưu trong thư mục dự án.**

- Memory directory: `.claude-memory/` (trong root của project)
- Memory index: `.claude-memory/MEMORY.md`
- KHÔNG lưu memory ở `C:\Users\`, `~/.claude/`, hay bất kỳ đâu ngoài project directory
- Mỗi khi bắt đầu session mới, ĐỌC `.claude-memory/MEMORY.md` để nắm ngữ cảnh

### Quy tắc lưu memory
1. Mọi thay đổi quan trọng trong dự án → ghi vào `.claude-memory/`
2. Mọi quyết định thiết kế, kiến trúc → ghi lại
3. Mọi feedback/yêu cầu từ user về cách làm việc → ghi lại
4. Bugs đã fix, lessons learned → ghi lại
5. Trạng thái tiến độ dự án → cập nhật

### Cấu trúc file memory
```markdown
---
name: tên ngắn gọn
description: mô tả 1 dòng
type: user | feedback | project | reference | decision
date: YYYY-MM-DD
---

Nội dung chi tiết
```

### Khi bắt đầu mỗi session
1. Đọc file `CLAUDE.md` (file này)
2. Đọc `.claude-memory/MEMORY.md` để xem index các memory
3. Đọc các memory file liên quan đến task hiện tại
4. Tiếp tục công việc với đầy đủ ngữ cảnh

## Workflow - Sau mỗi thay đổi

**BẮT BUỘC sau mỗi lần hoàn thành yêu cầu của user:**
1. Ghi lại yêu cầu và thay đổi vào `.claude-memory/`
2. Cập nhật `.claude-memory/MEMORY.md` nếu có memory mới
3. Git commit với message mô tả yêu cầu của user và những gì đã làm

Không bao giờ để thay đổi mà không commit. Không bao giờ commit mà không ghi memory.

## Coding Standards
- Python 3.10+
- Type hints cho tất cả functions
- Docstrings cho public functions
- Follow PEP 8
- Tests với pytest

