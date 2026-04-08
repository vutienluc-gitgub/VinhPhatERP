---
description: Workflow phân tách tư duy AI Agent để phát triển các luồng xử lý hành động nhanh (Quick Actions / Modals)
---

# QUICK ACTION FLOW (MULTI-AGENT PIPELINE)

Quy trình sử dụng khi phát triển các thao tác hành động nhanh lẻ tẻ nhưng quan trọng, tránh việc tạo một form quá lớn khi không cần thiết.
**Ví dụ:** Xóa một đối tượng, Chuyển trạng thái (Duyệt/Từ chối), Thanh toán nhanh, Hủy hoá đơn...

**QUY TẮC DỪNG KHẨN CẤP (CHECKPOINTS):**
Agent KHÔNG ĐƯỢC PHÉP tự ý chạy một mạch từ đầu đến cuối. Kết thúc Bước 1 và Bước 2, Agent **bắt buộc phải dừng lại**, in kết quả ra và hỏi ý kiến USER: _"Bạn có phê duyệt bản kế hoạch/thiết kế này để tôi đi tiếp sang Bước tiếp theo không?"_

---

## STEP 1 — PLANNER (Phân tích rủi ro & Side-effects)

**Mô tả:**
Các Quick Actions bề ngoài thì nhỏ, nhưng thường lại thao tác trực tiếp lên Database. Agent cần đánh giá rủi ro (Data Integrity / Relation dependencies) khi thực thi hành động này.

**Output yêu cầu (Dùng Markdown Checkboxes `[ ]`):**

- [ ] **Mục tiêu thao tác:** Nút này sẽ bắn API nào? Làm thay đổi bảng/cột nào?
- [ ] **Điều kiện (Permissions):** Vai trò nào được bấm nút này? Trạng thái nào thì nút này bị Disable? (Ví dụ: Order đã Done thì không hiển thị nút Xóa).
- [ ] **Ràng buộc phụ (Cascading / Side effects):** Nếu thao tác này thành công, nó có cần invalidate Query nào không? (VD: Thay đổi Status xong thì Cần `queryClient.invalidateQueries` bảng danh sách và bảng chi tiết liên quan).

🛑 **CHỜ USER DUYỆT BƯỚC 1 (PAUSE HERE)** 🛑

---

## STEP 2 — UI AGENT (Thiết kế Dialog & UX Feedback)

**Mô tả:**
Vì đây là các hành động nhanh, chúng ta không cấp một trang riêng (Page) mà chỉ sử dụng UI Trigger (Nút bấm) kết hợp với Confirmation Dialog Modal.

**Nguyên tắc "Action Pattern" bắt buộc:**

- Tuân thủ quy định tại `docs/coding-rules.md`, tránh sử dụng Center Modal đối với mobile nếu form có input, nhưng với Confirmation Dialog đơn thuần (Chỉ có Yes/No) thì dùng Dialog Modal thông thường.
- Cấu trúc: Nút Bấm (Button Trigger) ➡️ Component Hành động nội bộ ➡️ Dialog/BottomSheet xác nhận.
- Button Colors (Màu nút quy ước): Hành động Xóa/Hủy (Danger) phải có class màu đỏ. Thêm/Xác nhận (Primary).

**Output yêu cầu:**

- Cấu trúc DOM Tree (Ví dụ: `DeleteButton` -> Kích hoạt state `isOpen` -> Mở `ConfirmDialog`).
- Kịch bản thông báo: Toast/Alert hiển thị gì khi Success? Khi Error?

🛑 **CHỜ USER DUYỆT BƯỚC 2 (PAUSE HERE)** 🛑

---

## STEP 3 — FRONTEND AGENT (Lập trình State & Mutation)

**Mô tả:**
Thực thi viết mã vào các files đã duyệt.

**Bộ tiêu chuẩn:**

- Tái sử dụng component `<ConfirmDialog />` trong `src/shared/components` nếu chỉ đơn giản là hỏi Có/Không (Are you sure?).
- Đảm bảo có `isPending` state để làm vô hiệu hóa (disabled) nút bấm trong khi API đang chạy (Tránh user spam bấm nút nhiều lần).
- Đảm bảo hiển thị Toast (Success/Error Message) bằng UI/UX feedback.

**Output:**

- Triển khai code và dùng `write_to_file` hoặc `multi_replace_file_content`.

---

## STEP 4 — BACKEND AGENT (Tùy chọn)

**Mô tả:**

- Khởi tạo `useMutation` (e.g. `useDeleteOrder`, `useApprovePayment`). Đảm bảo trả về error code cụ thể.

---

## STEP 5 — QA / REVIEWER (Kiểm định Side Effects)

**Mô tả:**
Agent đóng vai QC review lại kết quả.

**Checklist kiểm tra ép buộc:**

- [ ] Bấm nút khi đang Load có bị dính 2 lần không? (Disabled checked?)
- [ ] Query Cache có được tự Invalidate sau khi Update thành công chưa? Thấy Data đổi ngay khi đóng Modal chưa?
- [ ] Nút bấm này (Màu sắc, padding touch target `min-height: 44px`) có bị nhỏ quá so với ngón tay trên điện thoại không?

**Output:**

- Phân tích lỗi (nếu có). Hoàn thành Quick Action Flow.
