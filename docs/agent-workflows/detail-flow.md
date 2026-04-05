---
description: Workflow phân tách tư duy AI Agent để phát triển các trang xem chi tiết (Detail UI / View Only)
---

# DETAIL CREATION WORKFLOW (MULTI-AGENT PIPELINE)

Quy trình thiết kế trang xem chi tiết của một đối tượng (Entity Detail). Nơi tập trung hiển thị dữ liệu Read-only, kèm theo các danh sách liên quan (related items) và các nút thao tác chuyển đổi trạng thái (quick actions).

**QUY TẮC DỪNG KHẨN CẤP (CHECKPOINTS):**
Agent KHÔNG ĐƯỢC PHÉP tự ý chạy một mạch từ đầu đến cuối. Kết thúc Bước 1 và Bước 2, Agent **bắt buộc phải dừng lại**, in kết quả ra và hỏi ý kiến USER: *"Bạn có phê duyệt bản kế hoạch/thiết kế này để tôi đi tiếp sang Bước tiếp theo không?"*

---

## STEP 1 — PLANNER (Phân tích Logic & Liên kết Dữ liệu)

**Mô tả:** 
Dùng tools kiểm tra Schema Database, tập trung vào các bảng `Relations` (Foreign Keys). Trang Detail thường chứa lượng thông tin đa dạng từ nhiều nguồn.

**Output yêu cầu (Dùng Markdown Checkboxes `[ ]`):**
- [ ] **Thông tin chính (Core Entity):** Các cục fields nào tạo nên thông tin cốt lõi (VD: Header, Thông tin liên hệ, Địa chỉ)?
- [ ] **Danh sách liên kết (Related Items):** Cần fetch những bảng nào khác? (Ví dụ: Chi tiết Đơn hàng thì phải kèm theo Dòng Hàng/Items, Lịch sử Thanh toán...).
- [ ] **Trạng thái & Thao tác (Status & Actions):** Khách hàng có thể làm gì trên trang này (Hủy, Duyệt, Tạo Shipment, In PDF)? Trạng thái quy trình (Draft -> Confirmed -> Done)?

🛑 **CHỜ USER DUYỆT BƯỚC 1 (PAUSE HERE)** 🛑

---

## STEP 2 — UI AGENT (Thiết kế Bố cục Section-based)

**Mô tả:**
Trang xem chi tiết phải được thiết kế theo dạng **Section-based Layout** (Chia khối theo khu vực) nhằm tối ưu trải nghiệm đọc (Read-only). Tôn trọng tuyệt đối Mobile-First theo `docs/coding-rules.md`.

**Nguyên tắc "Detail Pattern" bắt buộc:**
- **Header:** Chứa Tên/Mã của đối tượng + Badge Status.
- **Action Bar (Thanh công cụ):** Luôn đưa các nút thao tác chính (Print, Edit, Delete, Approve) lên góc phải Header hoặc ghim dưới cùng Mobile.
- **Section Grouping (Chia khối):** Nhóm các thông tin tương đồng vào từng `Card` (Thẻ) với Tiêu đề rõ ràng. (VD Card Thông tin người dùng, Card Lịch sử mua hàng). Không được để tràn lan trên nền trắng.
- Cấu trúc các Key - Value pair (Nhãn - Dữ liệu) nên là dạng lưới chia đôi (`grid-cols-2`) hoặc List đơn giản trên Mobile.

**Output yêu cầu:**
- Liệt kê Component/DOM tree gồm các <Section>. (Vd: OrderDetailHeader, OrderInfoSection, OrderItemsSection...).

🛑 **CHỜ USER DUYỆT BƯỚC 2 (PAUSE HERE)** 🛑

---

## STEP 3 — FRONTEND AGENT (Lập trình Giao diện)

**Mô tả:**
Dựa vào layout đã chốt để code các Component.

**Bộ tiêu chuẩn:**
- Tách riêng biệt từng phần (Section) thành các Component con nếu trang Detail nặng qua 300 dòng code. (Ví dụ tách ra `CustomerInfoCard.tsx` thay vì nhồi hết vào `Page.tsx`).
- Sử dụng các hooks như `{ data, isLoading, error } = useQuery` để hiển thị mượt mà Skeleton Loading trong lúc chờ lấy dữ liệu Relations.
- Format định dạng dễ nhìn: Tiền tệ (`formatCurrency`), Ngày tháng (`formatDate`), Mã (`uppercase`).

**Output:** 
- Triển khai code và dùng `write_to_file`.

---

## STEP 4 — BACKEND AGENT (Tùy chọn)

**Mô tả:** 
- Đảo bảo các file data fetching `usa[Entity].ts` đã lấy đủ `select("*, relations(*)")` để đáp ứng trang chi tiết.
- Cân nhắc chia nhỏ queries nếu Data quá nặng.

---

## STEP 5 — QA / REVIEWER (Kiểm định)

**Mô tả:**
Agent đóng vai QC review lại kết quả.

**Checklist kiểm tra ép buộc:**
- [ ] Khi dữ liệu bị Empty/Null hoặc Trống ở một trường, UI có hiện `-` hay Đang lỗi?
- [ ] Các thẻ (Cards) trên Mobile có bị chạm sát lề không? Đã đủ padding tiêu chuẩn chưa?
- [ ] Responsive với những Field chuỗi nội dung rất dài (như Ghi chú, Note) chưa? Đã có `word-break` chống bể giao diện chưa?
- [ ] Có bị quá tải API / Call nhiều query dư thừa không?

**Output:**
- Fix bug nếu có. Báo cáo hoàn tất trang Detail.
