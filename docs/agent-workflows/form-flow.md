---
description: Workflow phân tách tư duy AI Agent để phát triển các tính năng Form nhập liệu và AdaptiveSheet
---

# FORM CREATION WORKFLOW (MULTI-AGENT PIPELINE)

Quy trình này phân nhánh tư duy của AI Agent thành các vai trò chuyên biệt để phát triển các tính năng có chứa Form/Modal nhập liệu.

**QUY TẮC DỪNG KHẨN CẤP (CHECKPOINTS):**
Agent KHÔNG ĐƯỢC PHÉP tự ý chạy một mạch từ đầu đến cuối. Kết thúc Bước 1 và Bước 2, Agent **bắt buộc phải dừng lại**, in kết quả ra và hỏi ý kiến USER: _"Bạn có phê duyệt bản kế hoạch/thiết kế này để tôi đi tiếp sang Bước tiếp theo không?"_

---

## STEP 1 — PLANNER (Phân tích & Lên kế hoạch)

**Mô tả:**
Phân tích yêu cầu (Input). Agent có thể dùng tool (view_file, grep_search) nếu cần lục lọi Database Schema hoặc Type definitions trước khi lập kế hoạch.

**Output yêu cầu (Dùng Markdown Checkboxes `[ ]`):**

- [ ] **Goal:** Mục tiêu nghiệp vụ ngắn gọn của form này.
- [ ] **UI Tasks:** Liệt kê các element cần hiển thị trên form.
- [ ] **Frontend Tasks:** Các hooks cần call (useForm, zod, useMutation, v.v).
- [ ] **Backend Tasks (Optional):** Supabase table schema hoặc API chuẩn bị.

🛑 **CHỜ USER DUYỆT BƯỚC 1 (PAUSE HERE)** 🛑

---

## STEP 2 — UI AGENT (Thiết kế Cấu trúc / Wireframe)

**Mô tả:**
Dựa vào kế hoạch đã chốt ở Step 1.
Agent bắt buộc phải đọc trước quy định tại `docs/coding-rules.md` để lấy rules về UI/UX.

**Lưu ý bắt buộc đối với Form:**

- 100% Form bọc bên ngoài bằng `AdaptiveSheet`.
- Nếu Form quá dài hoặc nhiều thông tin chuyên môn -> Bắt buộc thiết kế theo kiểu "Step-based" bằng `useStepper`.
- Layout tuân thủ chặt ngặt Mobile-First (Ví dụ: `grid-template-columns: repeat(auto-fit, minmax(...))`).

**Output yêu cầu:**

- Liệt kê Component/DOM tree dự kiến. (VD: AdaptiveSheet > FormGrid > Step 1 > Fields...).
- Đề xuất chia nhỏ File/Component nêú cần.

🛑 **CHỜ USER DUYỆT BƯỚC 2 (PAUSE HERE)** 🛑

---

## STEP 3 — FRONTEND AGENT (Lập trình logic)

**Mô tả:**
Nhận lệnh từ User sau khi duyệt Step 2, đi thẳng vào triển khai Code.

**Bộ tiêu chuẩn:** Tuân thủ triệt để `docs/coding-rules.md`. Phải dùng `react-hook-form` + `zod` cho tất cả form validation.

**Output:**

- Tiến hành thực thi tool tạo/chỉnh sửa file. (write_to_file / multi_replace_file_content).

---

## STEP 4 — BACKEND AGENT (Tùy chọn)

**Mô tả:**
Nếu có tác vụ ảnh hưởng Database schema, migrations, hoặc custom query hook (`useQuery`/`useMutation`), Agent bắt tay vào chỉnh sửa file liên quan trong `.module.ts` hoặc các queries.

---

## STEP 5 — QA / REVIEWER (Kiểm định)

**Mô tả:**
Đóng vai trò QC dọn dẹp sau khi Dev xong. Agent tự đọc lại code/diff mình vừa viết và chấm điểm.

**Checklist kiểm tra ép buộc:**

- [ ] Giao diện có nguy cơ tràn ngang (Overflow-x) trên Mobile không?
- [ ] Form đã xử lý các states `isPending`, `isSubmitting` chưa? Nút lưu có disable khi loading không?
- [ ] Có bẫy lỗi catch Exception khi Submit mutation không?
- [ ] Tap target (các nút) có cảnh báo lỗi touch-friendly không?

**Output:**

- Phân tích lỗi (nếu có) và tự gọi tool để Clean code.
- In ra báo cáo tóm tắt "Hoàn tất luồng phát triển".
