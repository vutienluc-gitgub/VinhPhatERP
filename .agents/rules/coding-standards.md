---
trigger: always_on
---

# Agent Workflow & Premium Coding Standards

## 1. Quy trình thực hiện (Mini-tasks)

- Chia nhỏ task cực nhỏ, cẩn thận và an toàn.
- **BẮT BUỘC**: Sau mỗi lần chỉnh sửa (modified), phải chạy:
  1. `npm run typecheck`
  2. `npm run lint`
- Chỉ tiếp tục nếu không có lỗi. Nếu có lỗi chạy 2. `npm run lint -- --fix`

## 2. Quy tắc TypeScript & Code Quality

- **Tuyệt đối không dùng `as any`**: Không ép kiểu bừa bãi, không gây lỗi `any`.
- **Không Duplicate**: Không trùng lặp code, không gây lỗi duplicate logic.
- **Không Emoji**: Tuyệt đối không dùng emoji trong code và nội dung trả lời.
- **Import**: Không dùng relative import giữa các feature khác nhau.

## 3. Giao diện & Layout (Premium Standard)

- Hiển thị đúng chuẩn "Premium", tinh tế.
- **Responsive**: Phải linh hoạt trên mọi thiết bị.
- **Layout**: Tuyệt đối không phá vỡ Layout chung của hệ thống.

## 4. Ngôn ngữ & Báo cáo

- **Báo cáo**: Sau mỗi nhiệm vụ phải có báo cáo chi tiết các file đã sửa và kết quả verify (typecheck/lint).

## 5. Xử lý lỗi CSS & Render (Visual Verification)

- **Self-Review**: Trước khi báo cáo hoàn thành, Agent phải tự rà soát các thay đổi về Style (CSS/Tailwind).
- **Phòng ngừa lỗi Render**:
  - Kiểm tra các biến `null/undefined` trước khi render để tránh lỗi "White Screen".
  - Đảm bảo các `key` trong list render là duy nhất (Unique Key).
- **Xử lý khi có lỗi**:
  - Nếu giao diện bị vỡ hoặc không đúng thiết kế "Premium", Agent phải tự động **Rollback** (quay lại bản cũ) hoặc sửa ngay lập tức.
  - Phải kiểm tra tính tương thích của CSS (không làm ảnh hưởng đến các component khác - No Global Scope Pollution).
- **Thử nghiệm biên (Edge Cases)**: Thử nghiệm với dữ liệu trống (Empty State) và dữ liệu quá dài để đảm bảo layout không bị tràn (Overflow).
