# Memory Index

Danh sách tất cả memory files trong dự án. Đọc file này đầu tiên khi bắt đầu session mới.

## User
- [user_profile.md](user_profile.md) - Thông tin về user và cách làm việc

## Project
- [project_init.md](project_init.md) - Khởi tạo dự án và quyết định ban đầu
- [project_architecture.md](project_architecture.md) - Kiến trúc dự án: config, camera adapters, pipeline stubs, entry point
- [project_web_ui.md](project_web_ui.md) - Web UI: Flask server + HTML frontend tại localhost:5555

## Feedback
- [feedback_workflow.md](feedback_workflow.md) - Mỗi thay đổi phải ghi memory + git commit, không được bỏ sót
- [feedback_full_spec_implementation.md](feedback_full_spec_implementation.md) - Implement full spec, không bỏ bớt features
- [feedback_rebuild_after_fix.md](feedback_rebuild_after_fix.md) - Luôn rebuild Docker sau khi fix, không dùng workaround runtime
- [feedback_rest_status_codes.md](feedback_rest_status_codes.md) - Trả đúng HTTP status: 400 cho malformed/type-mismatch, 401 cho unauth, không 500

## Decisions

## References
- [project_public_cameras.md](project_public_cameras.md) - Danh sách API camera giao thông công cộng: Caltrans, TfL, VDOT, 511NY, MnDOT
- [reference_dvt_camera.md](reference_dvt_camera.md) - Hệ thống DVT Camera (123.19.195.7:3001): 3 camera RTSP live ở Đà Nẵng
- [reference_role_rules.md](reference_role_rules.md) - Role creation / notification routing / data scoping (prompts/3.md)
- [reference_project_standards.md](reference_project_standards.md) - Standards consolidated: 3-role review, ripple effect, API format, naming, security 5 layers, test bar
- [reference_detection_toggle.md](reference_detection_toggle.md) - Live-view detection badge: detection_enabled vs detection_settings độc lập, save-while-off không bật
