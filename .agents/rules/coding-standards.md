---
trigger: always_on
---

# Agent Workflow & Coding Standards

## 1. Quy trình thực hiện (Mini-tasks)

- **Chia nhỏ Task**: Luôn chia nhỏ yêu cầu thành các "mini-tasks" cực nhỏ. Mỗi bước chỉ giải quyết một vấn đề duy nhất để đảm bảo an toàn.
- **Quy trình Verify**: Sau MỖI lần thay đổi code (Modified), Agent BẮT BUỘC phải chạy:
  1. `npm run typecheck` (Kiểm tra lỗi TypeScript).
  2. `npm run lint` (Kiểm tra lỗi Format/Style, bao gồm cả lỗi `array-bracket-newline`).
     _Chỉ khi cả hai lệnh trên PASS mới được chuyển sang task tiếp theo._

## 2. Quy tắc TypeScript & Code Quality

- **Tuyệt đối không dùng `as any`**: Không ép kiểu bừa bãi. Phải định nghĩa Interface/Type rõ ràng.
- **Không gây lỗi `any`**: Đảm bảo mọi biến đều có kiểu dữ liệu tường minh.
- **Chống trùng lặp (No Duplicate)**: Không copy-paste code. Nếu logic lặp lại, phải tách thành utility hoặc hook dùng chung.
- **Emoji**: Tuyệt đối không sử dụng emoji trong code, comment, hoặc commit message.

## 3. Kiến trúc & Import

- **Module Isolation**: Tuyệt đối không dùng "Relative Import" (ví dụ: `../../`) để gọi giữa các Feature khác nhau.
- **Aliased Imports**: Sử dụng Path Aliases (ví dụ: `@/features/...`) để đảm bảo tính đóng gói của module.

## 4. UI/UX & Output (Premium Standard)

- **Premium Display**: Giao diện phải chỉn chu, căn lề chuẩn, typography rõ ràng, hiệu ứng mượt mà.
- **Responsive**: Phải kiểm tra hiển thị trên Mobile, Tablet, Desktop.
- **Layout Integrity**: Tuyệt đối không phá vỡ Layout chung của hệ thống (Header, Sidebar, Footer phải giữ nguyên).

## 5. Báo cáo (Reporting)

- Sau khi hoàn thành chuỗi mini-tasks, Agent phải báo cáo:
  - Danh sách các file đã sửa.
  - Kết quả chạy `typecheck` và `lint`.
  - Xác nhận đã kiểm tra Responsive.
