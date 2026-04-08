---
description: Workflow phân tách tư duy AI Agent để phát triển các trang hiển thị danh sách (List / Table / Search / Filter)
---

# LIST CREATION WORKFLOW (MULTI-AGENT PIPELINE)

Quy trình thiết kế luồng hiển thị danh sách, tra cứu và lọc dữ liệu (Data List, Table, Filter).

**QUY TẮC DỪNG KHẨN CẤP (CHECKPOINTS):**
Agent KHÔNG ĐƯỢC PHÉP tự ý chạy một mạch từ đầu đến cuối. Kết thúc Bước 1 và Bước 2, Agent **bắt buộc phải dừng lại**, in kết quả ra và hỏi ý kiến USER: _"Bạn có phê duyệt bản kế hoạch/thiết kế này để tôi đi tiếp sang Bước tiếp theo không?"_

---

## STEP 1 — PLANNER (Phân tích Data & Bộ lọc)

**Mô tả:**
Sử dụng các công cụ đọc schema database/types. Phân tích đối tượng nghiệp vụ cần hiển thị thành danh sách.

**Output yêu cầu (Dùng Markdown Checkboxes `[ ]`):**

- [ ] **Mục tiêu dữ liệu:** Hiển thị entity nào? Bảng nào trong Database?
- [ ] **Data Fields:** Những column/trường nào cần lấy ra để render (Ví dụ: Tên, Mã, Trạng thái, Ngày tháng...).
- [ ] **Search & Filter:** Cần thanh tìm kiếm (Tìm theo mã/tên)? Cần những bộ lọc Dropdown nào (Ví dụ: Lọc theo Trạng thái, Bộ phận...). Cần phân trang (Pagination) hay Infinite Scroll?
- [ ] **Quyền hạn (Permissions):** Vai trò nào được quyền xem, sửa, xóa các item trong list?

🛑 **CHỜ USER DUYỆT BƯỚC 1 (PAUSE HERE)** 🛑

---

## STEP 2 — UI AGENT (Thiết kế Layout - Responsive Pattern)

**Mô tả:**
UI Agent có trách nhiệm thiết kế giao diện theo đúng mô hình "Mobile-First". Đọc kỹ `docs/coding-rules.md`.

**Nguyên tắc "List Pattern" bắt buộc:**

- **Mobile (Mặc định):** Hiển thị dạng Card list (Các thẻ xếp dọc). Không dùng Table trên điện thoại để tránh cuộn ngang (overflow-x).
- **Desktop (Lớn hơn 768px):** Tự động chuyển đổi thành dạng Data Table truyền thống.
- **Header Actions:** Bắt buộc có Search input (Tìm kiếm), Filter dropdowns (Lọc rẽ nhánh).

**Output yêu cầu:**

- Phác thảo Component Tree (Ví dụ: Page > ListHeader (Filters) > DataList / DataTable > Pagination).
- Liệt kê các file dự định tạo (Ví dụ: `components/CustomerList.tsx`.

🛑 **CHỜ USER DUYỆT BƯỚC 2 (PAUSE HERE)** 🛑

---

## STEP 3 — FRONTEND AGENT (Lập trình logic React)

**Mô tả:**
Nhận lệnh từ User, áp dụng các hook xử lý dữ liệu và render UI.

**Bộ tiêu chuẩn:**

- Dùng `Supabase` queries bọc trong `React Query` (`useQuery`/`useInfiniteQuery`) để lấy dữ liệu.
- URL Synchronization: Trạng thái của Filters, Search Page nên đồng bộ xuống thanh Address của Trình duyệt (URL Params) để user dễ Share hoặc Refresh.
- Tên component: Tách biệt logic fetching data (ở Page wrapper) và logic render (ở List component ngốc nghếch).

**Output:**

- Triển khai code và dùng `write_to_file`.

---

## STEP 4 — BACKEND AGENT (Tùy chọn)

**Mô tả:**

- Xây dựng file `use[Entity].ts` (Ví dụ: `useCustomers.ts`) chứa các hooks gọi dữ liệu thực.
- Thiết lập RLS (Row Level Security) bên Supabase nếu được yêu cầu.

---

## STEP 5 — QA / REVIEWER (Kiểm định UX / Mobile)

**Mô tả:**
Agent QC rà soát lại kết quả code vừa tạo.

**Checklist kiểm tra ép buộc:**

- [ ] Chế độ Mobile có dùng Card Layout không hay đang cố nhồi nhét Table? (Lỗi tràn ngang Horizontal Scroll).
- [ ] Thao tác tìm kiếm (Typeahead / Debounce search) có gây giật lag không?
- [ ] Các Badge/Tag trạng thái (Status) có màu sắc trực quan (Warning: Vàng, Success: Xanh...) không?
- [ ] Trạng thái Empty (Chưa có dữ liệu) và Loading / Error State đã được handle chưa?

**Output:**

- Phân tích lỗi (nếu có) và tự gọi tool để Clean code.
- In ra thông báo nghiệm thu.
