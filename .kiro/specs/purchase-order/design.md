# Design Document — Module Purchase Order (PO)

Tài liệu này mô tả thiết kế kỹ thuật chi tiết để đáp ứng các yêu cầu của module Purchase Order (PO) và Goods Receipt dựa trên `requirements.md`.

## 1. Database Design (PostgreSQL / Supabase)

### 1.1. Tables

#### `purchase_orders`

Lưu trữ thông tin header của đơn đặt hàng.

- `id` (UUID, PK, Default: `uuid_generate_v4()`)
- `po_code` (VARCHAR, UNIQUE, Not Null) - Định dạng `PO-YYYYMM-NNNN`
- `supplier_id` (UUID, FK -> `suppliers.id`, Not Null)
- `supplier_name_snapshot` (VARCHAR, Not Null) - Tên nhà cung cấp tại thời điểm tạo PO
- `status` (VARCHAR, Not Null) - Check constraint in: `draft`, `approved`, `rejected`, `partial_received`, `completed`, `cancelled`
- `order_date` (DATE, Not Null)
- `expected_date` (DATE)
- `total_amount` (DECIMAL(19,4), Default 0)
- `rejection_reason` (TEXT)
- `created_by` (UUID, FK -> `auth.users.id`, Not Null)
- `approved_by` (UUID, FK -> `auth.users.id`)
- `approved_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ, Default `now()`)
- `updated_at` (TIMESTAMPTZ, Default `now()`)

#### `purchase_order_items`

Lưu trữ các dòng hàng hóa chi tiết trong một đơn hàng.

- `id` (UUID, PK, Default: `uuid_generate_v4()`)
- `po_id` (UUID, FK -> `purchase_orders.id`, Not Null, ON DELETE CASCADE)
- `material_id` (UUID, Not Null) - ID của nguyên liệu (sợi, vải)
- `uom` (VARCHAR, Not Null) - Đơn vị tính: `kg`, `cây`, `mét`, `cuộn`
- `ordered_qty` (DECIMAL(15,4), Not Null) - Ràng buộc: `> 0`
- `received_qty` (DECIMAL(15,4), Default 0) - Ràng buộc: `>= 0` và `<= ordered_qty`
- `unit_price` (DECIMAL(19,4), Not Null) - Ràng buộc: `>= 0`
- `created_at` (TIMESTAMPTZ, Default `now()`)
- `updated_at` (TIMESTAMPTZ, Default `now()`)

#### `goods_receipts`

Lưu trữ header của phiếu nhập kho được tạo từ PO.

- `id` (UUID, PK, Default: `uuid_generate_v4()`)
- `receipt_code` (VARCHAR, UNIQUE, Not Null) - Mã phiếu nhập tự sinh
- `po_id` (UUID, FK -> `purchase_orders.id`, Not Null)
- `received_date` (DATE, Not Null)
- `client_request_id` (UUID, UNIQUE, Not Null) - Dùng cho idempotency, ngăn double-submit
- `created_by` (UUID, FK -> `auth.users.id`, Not Null)
- `created_at` (TIMESTAMPTZ, Default `now()`)

#### `goods_receipt_items`

Lưu trữ các dòng thực nhận trong một phiếu nhập kho.

- `id` (UUID, PK, Default: `uuid_generate_v4()`)
- `receipt_id` (UUID, FK -> `goods_receipts.id`, Not Null, ON DELETE CASCADE)
- `po_item_id` (UUID, FK -> `purchase_order_items.id`, Not Null)
- `received_qty` (DECIMAL(15,4), Not Null) - Ràng buộc: `> 0`
- `unit_price` (DECIMAL(19,4), Not Null) - Giá copy chuẩn từ `purchase_order_items`
- `created_at` (TIMESTAMPTZ, Default `now()`)

#### `po_audit_logs`

Lưu vết mọi hành động tác động lên PO và Goods Receipt.

- `id` (UUID, PK, Default: `uuid_generate_v4()`)
- `entity_type` (VARCHAR, Not Null) - `purchase_order` hoặc `goods_receipt`
- `entity_id` (UUID, Not Null)
- `action` (VARCHAR, Not Null) - `created`, `approved`, `rejected`, `cancelled`, `receipt_created`
- `actor_id` (UUID, FK -> `auth.users.id`)
- `snapshot` (JSONB) - Dữ liệu của thực thể ngay tại thời điểm log
- `timestamp` (TIMESTAMPTZ, Default `now()`)

### 1.2. Database Views

- **`v_po_status`**: Nhóm theo `po_id`, tính tổng `SUM(ordered_qty)` và `SUM(received_qty)` để tính toán tỉ lệ % hoàn thành đơn hàng.
- **`v_po_detail_full`**: View dùng để liệt kê PO (list view), kết hợp thông tin `purchase_orders`, `suppliers`, và `v_po_status`.
- **`v_po_item_status`**: View giúp cho việc tạo Phiếu Nhập Kho. Lấy dữ liệu từ `purchase_order_items` và tính toán luôn cột `remaining_qty = ordered_qty - received_qty`.

### 1.3. RPC Functions (Atomic Transactions)

#### `rpc_create_goods_receipt`

Đây là hàm cốt lõi để đảm bảo Requirement #4. Mọi logic nhập kho đều phải đi qua RPC này để được xử lý trong một Database Transaction duy nhất (`BEGIN ... COMMIT`).
**Tham số:**

- `p_po_id` (UUID)
- `p_client_request_id` (UUID)
- `p_items` (JSONB) - Mảng các đối tượng `{ po_item_id, received_qty }`
- `p_received_date` (DATE)
- `p_created_by` (UUID)

**Logic xử lý (Transaction Sequence):**

1. Xác thực `p_client_request_id` chưa tồn tại trong `goods_receipts` (nếu có, trả về ID cũ, kết thúc sớm).
2. Lock row của các items tương ứng (`SELECT ... FROM purchase_order_items WHERE po_id = p_po_id FOR UPDATE`).
3. Kiểm tra số lượng `received_qty` của `p_items` không được lớn hơn `remaining_qty`.
4. `INSERT INTO goods_receipts` và sinh mã `receipt_code`.
5. `INSERT INTO goods_receipt_items`, lấy giá (`unit_price`) trực tiếp từ `purchase_order_items` (không lấy từ input user).
6. `UPDATE purchase_order_items` cộng dồn `received_qty`.
7. `UPDATE purchase_orders.status` dựa trên tổng `received_qty` của tất cả items (thành `completed` hoặc `partial_received`).
8. `INSERT INTO po_audit_logs`.
9. `COMMIT`.

---

## 2. API / Domain Layer Design (Frontend / Shared)

### 2.1. Zod Schemas (`src/domain/purchase-order/schemas.ts`)

- `poFormSchema`: Dùng cho tạo/sửa PO.
- `poItemSchema`: Validate số lượng (> 0), giá (>= 0).
- `poApproveSchema`: Chứa `po_id` và `action` (approve/reject).
- `goodsReceiptFormSchema`: Có array items với `received_qty` > 0 và `<=` `remaining_qty`.

### 2.2. React Query Services (`src/features/purchase-order/api/`)

- `usePurchaseOrders(filters)`: Lấy danh sách dùng bảng `v_po_detail_full`.
- `usePurchaseOrder(id)`: Fetch thông tin chi tiết PO và danh sách items.
- `useGoodsReceiptsByPo(po_id)`: Fetch lịch sử nhập kho của 1 PO.
- `useCreatePurchaseOrder`: Mutations, dùng `safeUpsert` kèm log audit.
- `useApprovePurchaseOrder`: Mutation chuyển trạng thái (có input cho lý do từ chối nếu reject).
- `useCreateGoodsReceipt`: Gọi hàm `untypedDb.rpc('rpc_create_goods_receipt', {...})` kèm tự sinh ra `client_request_id` bằng `uuidv4()` ở client.

---

## 3. UI / UX Design

### 3.1. Pages Structure

- **Danh sách PO (`/purchase-orders`)**:
  - Dùng `DataTableAdvanced` (như đã quy chuẩn).
  - Cột: Mã PO, Nhà cung cấp, Ngày tạo, Tổng tiền, Trạng thái (dùng Component `Badge`), Tiến độ (Progress bar theo % của `received_qty / ordered_qty`).
  - Lọc theo: Trạng thái, Nhà cung cấp.

- **Tạo Mới / Chỉnh Sửa PO (`/purchase-orders/create` | `/purchase-orders/[id]/edit`)**:
  - Form Header: Chọn Supplier (combobox), ngày đặt, dự kiến giao.
  - Form Chi tiết: Danh sách items (`useFieldArray`). Chức năng Thêm/Xóa dòng. Có validate báo đỏ ngay khi user nhập giá/số lượng không hợp lệ.
  - Tự động tính toán cột "Thành tiền" = Tổng `qty * price`.

- **Chi tiết PO (`/purchase-orders/[id]`)**:
  - Chế độ chỉ đọc (View-only mode).
  - Có các nút Hành động (tùy theo Quyền):
    - **Duyệt / Từ Chối**: Chỉ cho role Approver. Sẽ mở Dialog nhập lý do từ chối nếu chọn Reject.
    - **Hủy PO**: Nếu PO đang draft hoặc approved (chưa nhập kho).
    - **Tạo Phiếu Nhập**: Mở trang hoặc dialog để Warehouse Staff nhập kho.
  - Tab 1: Chi tiết các PO Items (Số lượng đặt, Đã nhận, Còn lại, Giá).
  - Tab 2: Lịch sử nhập kho (Timeline các Goods Receipts liên quan).

- **Nhập Kho từ PO (`/purchase-orders/[id]/receipt`)**:
  - Hiển thị danh sách các item đang có `remaining_qty > 0`.
  - Input field cho cột "Thực nhận". Tự động giới hạn `max = remaining_qty`.
  - Cột Giá sẽ bị disabled (chỉ hiển thị) theo Requirement #7.
  - Nút "Xác nhận nhập kho" (disable khi đang submitting) để gửi kèm `client_request_id`.

### 3.2. Shared UI Components

- **`POStatusBadge`**: Map các status text sang UI Color (VD: `draft` -> Xám, `approved` -> Xanh dương, `partial_received` -> Cam, `completed` -> Xanh lá, `rejected` -> Đỏ).
- **`POProgress`**: Thanh tiến độ (Linear Progress) thể hiện tỉ lệ nhập hàng.

---

## 4. Security & Access Control (RBAC & RLS)

Sử dụng Role-based Access Control phối hợp với Supabase Row-Level Security (RLS) để khóa chặt nghiệp vụ ở tầng Data:

- **Purchasing Staff**:
  - View (SELECT): Được xem PO list, chi tiết PO, Suppliers.
  - Write: INSERT vào `purchase_orders` (lúc tạo, tự gắn `created_by = auth.uid()`). UPDATE được nếu `status` = `draft` hoặc `rejected`.
- **Approver (Accounting / Admin)**:
  - View (SELECT): Xem toàn bộ.
  - Action: Chỉ được UPDATE bảng `purchase_orders` để đổi `status` thành `approved`, `rejected` hoặc `cancelled`.
  - Lock: Không được sửa `ordered_qty` hoặc `unit_price`. (Sẽ enforce bằng trigger hoặc logic RPC ở back-end cho chắc).

- **Warehouse Staff**:
  - View (SELECT): Chỉ xem được các PO có `status` = `approved`, `partial_received`, `completed`.
  - Write: Quyền duy nhất là EXECUTE hàm `rpc_create_goods_receipt`. Không cấp quyền INSERT trực tiếp lên bảng `goods_receipts`.

## 5. Migration Strategy

1. Tạo các bảng theo schema (`purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `po_audit_logs`).
2. Viết các database Views.
3. Cài đặt RPC `rpc_create_goods_receipt` (kèm lock row logic và rollback).
4. Thiết lập RLS policies cho bảng để khóa write access từ API thông thường.
5. Tạo `npm run supabase:gen` để đồng bộ types.
6. Xây dựng Frontend UI tương ứng và các validation theo chuẩn Zod.
