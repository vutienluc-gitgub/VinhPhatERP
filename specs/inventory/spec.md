# Domain Specification: Quản lý Kho Vải Thành Phẩm & Bảng Kê Cây Vải (Fabric Inventory & Packing List)

- **Domain:** `inventory`
- **Owner:** Bộ phận Quản lý Kho Thành Phẩm & Điều độ Sản xuất
- **Trạng thái:** Active (Living Spec)
- **Database Tables:** `finished_fabric_rolls`, `inventory_stocks`, `shipments`, `shipment_items`, `sales_orders`

---

## 1. Tổng quan & Vai trò nghiệp vụ

Trong quy trình sản xuất dệt may khép kín của Vĩnh Phát, vải thành phẩm sau khi hoàn tất nhuộm, định hình và KCS sẽ được quản lý chính xác đến **từng cây vải (Roll-level Tracking)**.

- **Bảng kê danh sách cây vải (Fabric Roll Packing List)** là chứng từ kỹ thuật và giao nhận cốt lõi đi kèm mọi chuyến hàng xuất xưởng, phiếu xuất kho hoặc nghiệm thu nhập kho.
- Khách hàng may mặc và đối tác yêu cầu bảng kê chi tiết từng cây (cân nặng tịnh, khổ, màu, số mét, phẩm cấp) để phục vụ kiểm đếm khi dỡ hàng, trải bàn cắt và đối chiếu thanh toán.
- Đảm bảo tính toán chính xác tổng khối lượng (Gross/Net kg), hao hụt, phân loại Grade A/B và truy xuất nguồn gốc ngược về lô nhuộm (`dyeing_batch_code`) và cuộn mộc (`raw_roll_id`).

---

## 2. Dữ liệu & Ràng buộc cốt lõi (Data Invariants)

1. **Định danh Cây vải (`finished_fabric_rolls`)**:
   - `roll_code` / `roll_number`: Mã định danh duy nhất (Unique per tenant), in dưới dạng Barcode/QR Code trên tem đầu cây.
   - `weight_kg`: Khối lượng tịnh thực tế của cây vải, PHẢI là số dương (`> 0`), làm tròn chuẩn xác đến 1 chữ số thập phân (`0.1 kg`).
   - `width_inch`: Khổ vải thực tế (inch), PHẢI > 0.
   - `length_meters`: Chiều dài quy đổi (mét), nếu có PHẢI >= 0.
   - `grade`: Phẩm cấp KCS, enum (`grade_a` | `grade_b` | `grade_c` | `reject`).
   - `status`: Enum `roll_status` (`in_stock` | `reserved` | `shipped` | `pending_qc`).
   - `tenant_id`: Bắt buộc phân lập multi-tenant theo RLS.

2. **Quy tắc Tính toán & Tổng hợp Bảng kê (Packing Aggregates)**:
   - **Tổng số cây vải (`total_rolls`)**: `COUNT(rolls)` trong bảng kê (PHẢI >= 1).
   - **Tổng khối lượng tịnh (`total_net_weight`)**: `SUM(weight_kg)` của toàn bộ các cây vải trong bảng kê.
   - **Khối lượng bình quân (`average_weight`)**: `total_net_weight / total_rolls`.
   - **Thành tiền thanh toán**: Tiền hàng thực tế PHẢI tính theo `total_net_weight * unit_price` (không tính theo khối lượng lý thuyết).

---

## 3. Đặc tả Yêu cầu & Kịch bản (Requirements & Scenarios)

### REQ-INV-01: Hiển thị Bảng kê Cây vải đa chế độ (Table & Grid Matrix)

Hệ thống PHẢI cung cấp khả năng xem danh sách cây vải theo cả 2 định dạng:

1. Dạng bảng dữ liệu chi tiết (Desktop Data Table) với đầy đủ thông số kỹ thuật.
2. Dạng ma trận ô cây vải (Compact Grid Matrix) hiển thị số thứ tự cây và cân nặng, tối ưu cho màn hình di động, máy bay/máy tính bảng kho và in ấn.

#### Scenario: Xem bảng kê dạng ma trận trên thiết bị di động / kho

- **GIVEN** Đơn hàng hoặc phiếu xuất có 35 cây vải Vảy cá Cào Muối Tiêu
- **WHEN** Thủ kho hoặc Khách hàng mở mục "Bảng kê danh sách cây vải"
- **THEN** Hệ thống hiển thị bảng tóm tắt: Tổng 35 cây, Tổng 808.6 kg, Trung bình 23.1 kg/cây
- **AND** Danh sách 35 cây được bố trí dạng lưới 2 cột đều đặn (Cây #1: 22.8kg, Cây #2: 24.1kg, ...)
- **AND** Có màu sắc trực quan phân biệt cây Grade A (xanh lá) và Grade B (vàng cam).

---

### REQ-INV-02: Kiểm đếm Cây vải bằng quét Barcode/QR Code

Hệ thống PHẢI hỗ trợ thủ kho và tài xế quét mã QR/Barcode dán trên từng cây vải để đối soát với bảng kê xuất kho.

#### Scenario: Quét thành công cây vải hợp lệ

- **GIVEN** Bảng kê xuất kho gồm 35 cây vải đang ở trạng thái chuẩn bị dỡ hàng
- **WHEN** Người dùng quét mã barcode `VP-MT-0012`
- **THEN** Cây vải `VP-MT-0012` được đánh dấu trạng thái "Đã kiểm đếm (Verified)" với dấu tích xanh
- **AND** Thanh tiến độ kiểm đếm tăng từ `11/35 cây` lên `12/35 cây`.

#### Scenario: Cảnh báo khi quét nhầm cây vải không thuộc bảng kê

- **GIVEN** Bảng kê của Đơn hàng A
- **WHEN** Người dùng quét mã cây vải `VP-COT-9999` thuộc Đơn hàng B
- **THEN** Hệ thống rung/phát âm thanh cảnh báo lỗi
- **AND** Hiển thị thông báo: "Cây vải VP-COT-9999 không thuộc bảng kê của đơn hàng này!"
- **AND** Tuyệt đối không thay đổi trạng thái tồn kho của cây vải quét nhầm.

---

### REQ-INV-03: Xuất và In Bảng kê (Print & Export)

Hệ thống PHẢI hỗ trợ xuất bảng kê danh sách cây vải ra file PDF chuẩn A4/A5 và Excel (.xlsx).

#### Scenario: In bảng kê xuất xưởng khổ A4

- **GIVEN** Phiếu xuất kho đã được xác nhận (Confirmed)
- **WHEN** Thủ kho bấm "In Bảng Kê Cây Vải"
- **THEN** Bản in PDF được tạo gồm: Header thông tin công ty Dệt May Vĩnh Phát, Thông tin khách hàng, Bảng ma trận 35 cây vải, Tổng số cây, Tổng kg, và các chữ ký: Người lập bảng, Thủ kho, Tài xế, Đại diện khách hàng.
