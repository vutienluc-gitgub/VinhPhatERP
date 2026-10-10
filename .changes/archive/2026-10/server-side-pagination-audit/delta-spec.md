# Delta Specification: Rà soát & Chuyển đổi Server-Side Pagination

Tài liệu này ghi nhận sự khác biệt (Delta) trong hành vi truy xuất dữ liệu đối với 3 phân hệ: `customers`, `purchase-orders`, `inventory-adjustments`.

---

## 1. Yêu cầu Bổ sung (Added Requirements)

### REQ-PERF-01: API Phân trang Phía Máy chủ

- **GIVEN**: Người dùng mở màn hình Danh sách Khách hàng, Danh sách PO, hoặc Lịch sử Điều chỉnh Kho.
- **WHEN**: Hệ thống gửi yêu cầu lấy dữ liệu theo số trang `page` và kích thước `pageSize`.
- **THEN**: API chỉ gửi truy vấn lấy đúng `pageSize` bản ghi tương ứng từ PostgreSQL qua `.range((page - 1) * pageSize, page * pageSize - 1)`. Đồng thời trả về `total` (tổng số bản ghi) và `totalPages`.

---

## 2. Yêu cầu Chỉnh sửa (Modified Requirements)

### MOD-PERF-01: Thay thế Client Slicing trong `useCustomerList`

- **Quy chuẩn CŨ**: `useCustomerList` tải toàn bộ danh sách khách hàng trong hệ thống bằng `fetchCustomers()`, sau đó dùng `data.slice(...)` để chia trang ở client.
- **Quy chuẩn MỚI**: Gọi `fetchCustomersPaginated(...)` trực tiếp xuống Supabase với tham số `page` và `pageSize`.
- **Lý do kinh doanh**: Giảm tiêu thụ băng thông từ hàng chục MB xuống vài chục KB; tránh hiện tượng ứng dụng bị đóng băng (unresponsive) khi dữ liệu khách hàng tăng lên hàng chục nghìn bản ghi.

### MOD-PERF-02: Phân trang cho Danh sách Đơn mua hàng (PO)

- **Quy chuẩn CŨ**: `fetchPurchaseOrders()` kéo toàn bộ bảng view `v_po_detail_full` không có giới hạn `range`.
- **Quy chuẩn MỚI**: Hỗ trợ `fetchPurchaseOrdersPaginated()` nhận `page` và `pageSize`, tích hợp vào `POList.tsx`.

### MOD-PERF-03: Phân trang cho Lịch sử Điều chỉnh Kho

- **Quy chuẩn CŨ**: `fetchInventoryAdjustments()` lấy toàn bộ lịch sử điều chỉnh.
- **Quy chuẩn MỚI**: Cung cấp `fetchInventoryAdjustmentsPaginated()` với mặc định `pageSize = 20`.

---

## 3. Nghiệp vụ Bất biến (ERP Safety Statement)

`NO BUSINESS BEHAVIOR CHANGE`

- Dữ liệu hiển thị, quyền truy cập của từng nhân viên, logic lọc theo trạng thái/chi nhánh được bảo toàn 100%.
- Không có bất kỳ thay đổi nào về công nợ, giá tiền, hay số lượng hàng hóa.
