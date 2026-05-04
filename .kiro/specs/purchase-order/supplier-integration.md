# TÀI LIỆU THIẾT KẾ: MODULE SUPPLIERS (VENDOR MANAGEMENT) DÀNH CHO PO

**Trạng thái**: Draft
**Mục tiêu**: Nâng cấp module Nhà cung cấp (Suppliers) từ danh bạ cơ bản (Address Book) thành hệ thống Quản lý Đối tác Thương mại (Vendor Management) tích hợp sâu vào quy trình Purchase Order (PO).

---

## 1. Cơ sở Dữ liệu (Database Schema)

Để đáp ứng các yêu cầu Procurement nâng cao, chúng ta cần bổ sung các bảng và trường sau:

### 1.1. Bảng `supplier_material_prices` (Bảng giá cấu hình)

Lưu trữ báo giá, MOQ và thời gian giao hàng dự kiến (Lead Time) của từng nhà cung cấp đối với từng loại nguyên liệu.

```sql
CREATE TABLE supplier_material_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  material_id VARCHAR NOT NULL, -- Tham chiếu mã nguyên liệu
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  uom VARCHAR NOT NULL DEFAULT 'kg',
  moq NUMERIC(10,2) DEFAULT 0, -- Số lượng đặt hàng tối thiểu
  lead_time_days INT DEFAULT 7, -- Thời gian giao hàng trung bình (ngày)
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE, -- null nghĩa là đang áp dụng vô thời hạn
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(supplier_id, material_id, valid_from)
);
```

### 1.2. Bổ sung trường vào bảng `suppliers`

Để phục vụ kiểm soát công nợ và cảnh báo:

```sql
ALTER TABLE suppliers
ADD COLUMN credit_limit NUMERIC(15,2) DEFAULT 0, -- Hạn mức công nợ tối đa
ADD COLUMN payment_terms VARCHAR DEFAULT 'Net 30', -- Điều khoản thanh toán
ADD COLUMN rating NUMERIC(3,2) DEFAULT 0; -- Điểm đánh giá (0-5 sao)
```

### 1.3. Bảng / View `v_supplier_performance` (Chỉ số đánh giá NCC)

Tính toán tự động từ lịch sử PO và Goods Receipts.

```sql
CREATE OR REPLACE VIEW v_supplier_performance AS
SELECT
    s.id AS supplier_id,
    COUNT(po.id) AS total_pos,
    SUM(po.total_amount) AS total_spend,
    -- Tỷ lệ giao hàng đúng hạn (On-Time Delivery - OTD)
    (COUNT(gr.id) FILTER (WHERE gr.received_date <= po.expected_date) * 100.0 / NULLIF(COUNT(gr.id), 0)) AS on_time_rate,
    -- Thời gian giao hàng thực tế trung bình
    AVG(gr.received_date - po.order_date) AS avg_lead_time_days
FROM suppliers s
LEFT JOIN purchase_orders po ON po.supplier_id = s.id
LEFT JOIN goods_receipts gr ON gr.po_id = po.id
GROUP BY s.id;
```

---

## 2. API & Application Layer (Tầng Logic)

1. **`rpc_get_supplier_price`**:
   - Hàm RPC nhận vào `p_supplier_id` và `p_material_id`.
   - Trả về `unit_price`, `moq`, `lead_time_days` đang active của NCC đó.
2. **Hook `useSupplierPrice`**:
   - Dùng trong `POCreatePage`. Khi người dùng chọn Nguyên liệu, tự động fetch giá và điền vào ô Đơn giá. Cảnh báo nếu Số lượng đặt nhỏ hơn MOQ.
3. **Cảnh báo Công nợ (Credit Limit Check)**:
   - Trong `rpc_create_purchase_order`, kiểm tra tổng công nợ hiện tại của NCC + giá trị PO mới. Nếu vượt quá `credit_limit`, PO chỉ có thể lưu nháp, yêu cầu quyền Manager duyệt.

---

## 3. Cập nhật UI Components (Tầng Giao diện)

### 3.1. Nâng cấp `POCreatePage`

- Thêm cơ chế **Auto-fill Price**: Khi chọn NCC A và Nguyên liệu "Sợi Cotton 100%", hệ thống gọi hook tự động điền đơn giá = `50,000đ`.
- Hiển thị **Cảnh báo (Smart Alerts)**:
  - _"NCC này yêu cầu MOQ là 500kg. Bạn đang đặt 300kg."_
  - _"Thời gian giao hàng tiêu chuẩn là 7 ngày. Ngày dự kiến giao của bạn là 3 ngày, có thể bị trễ."_

### 3.2. Cập nhật `SuppliersPage` (Quản lý danh sách NCC)

- Thêm các cột vào DataTableAdvanced: `Đánh giá (Rating)`, `Tỷ lệ đúng hạn (OTD)`, `Hạn mức công nợ`.
- Thêm tab "Báo giá (Price List)" trong `SupplierForm` để người dùng Procurement khai báo giá cho từng nguyên liệu.

### 3.3. Bảng theo dõi Performance (Vendor Dashboard)

- Dành cho Trưởng phòng Mua hàng xem top NCC uy tín nhất, hoặc NCC thường xuyên trễ hẹn để có chiến lược đàm phán.

---

## 4. Kế hoạch Triển khai (Milestones)

- **Giai đoạn 1**: Tạo Migration cho `supplier_material_prices`, `v_supplier_performance` và update table `suppliers`.
- **Giai đoạn 2**: Viết API endpoint và React Query Hooks để CRUD Price List.
- **Giai đoạn 3**: Tích hợp Auto-fill Price vào `POCreatePage`.
- **Giai đoạn 4**: Nâng cấp `SuppliersPage` và `SupplierForm` UI.
