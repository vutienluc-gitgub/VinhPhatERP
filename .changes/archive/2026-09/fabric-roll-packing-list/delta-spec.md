# Delta Specification: Bảng kê danh sách cây vải (Fabric Roll Packing List)

Tài liệu này ghi nhận các đặc tả bổ sung cho hệ thống Quản lý Kho Vải Thành Phẩm & Xuất Hàng liên quan đến tính năng **Bảng kê danh sách cây vải**.

- **Domain:** `inventory`
- **Tài liệu tham chiếu gốc:** `specs/inventory/spec.md`
- **Mức độ ảnh hưởng:** Mở rộng tính năng (Extension), bảo toàn 100% logic kinh doanh hiện có (`NO BUSINESS BEHAVIOR CHANGE`).

---

## 1. Yêu cầu Bổ sung (Added Requirements)

### REQ-PL-01: Gom nhóm & Thống kê Cây vải theo Màu và Lô (Color & Batch Aggregation)

Hệ thống PHẢI tự động gom nhóm danh sách cây vải theo Tên màu và Số lô nhuộm, đồng thời tính toán số liệu thống kê độc lập cho từng nhóm.

#### Scenario: Gom nhóm đơn hàng nhiều màu

- **GIVEN** Phiếu xuất gồm 20 cây vải màu "Muối Tiêu" và 15 cây vải màu "Xanh Đen"
- **WHEN** Người dùng xem Bảng kê danh sách cây vải
- **THEN** Hệ thống phân tách thành 2 section rõ ràng:
  - Section 1: Muối Tiêu — 20 cây, 462.5 kg, TB: 23.1 kg/cây.
  - Section 2: Xanh Đen — 15 cây, 346.1 kg, TB: 23.0 kg/cây.
- **AND** Có thanh tổng kết toàn bộ phiếu xuất: 35 cây, 808.6 kg.

---

### REQ-PL-02: Chế độ hiển thị Lưới Ma Trận Cây Vải (Compact Roll Matrix Grid)

Hệ thống PHẢI cung cấp chế độ xem dạng lưới ma trận (Grid) bên cạnh dạng bảng dữ liệu truyền thống (Table), tối ưu hóa diện tích hiển thị khi số lượng cây vải lớn (> 30 cây).

#### Scenario: Chuyển đổi giữa Table và Matrix Grid

- **GIVEN** Danh sách 35 cây vải
- **WHEN** Người dùng bấm nút chuyển chế độ "Xem dạng lưới ma trận"
- **THEN** Giao diện chuyển sang các ô cây vải nhỏ gọn xếp 2-4 cột
- **AND** Mỗi ô thể hiện: Số thứ tự cây (#01, #02...), Cân nặng tịnh (ví dụ `24.2 kg`), Phẩm cấp (Badge `Loại A`), Mã cây vải
- **AND** Khi click vào từng ô, hiển thị popover thông tin chi tiết: Lô mộc, Khổ vải, Thời gian KCS.

---

### REQ-PL-03: Kiểm đếm đối soát thực tế bằng Quét Barcode/QR (Real-time Roll Check-off)

Hệ thống PHẢI hỗ trợ tính năng kiểm đếm tại hiện trường kho/xe tải: quét đến đâu, highlight cây vải trên bảng kê đến đó.

#### Scenario: Quét kiểm đếm cây vải

- **GIVEN** Bảng kê gồm 35 cây vải chuẩn bị xuất lên xe tải
- **WHEN** Thủ kho dùng máy quét / camera quét mã `VP-MT-0005`
- **THEN** Cây vải `VP-MT-0005` trên bảng kê đổi màu nền sang xanh lục (Success) kèm biểu tượng tích xanh
- **AND** Bộ đếm kiểm đếm cập nhật: `1/35 cây (23.5 / 808.6 kg - 2.9%)`
- **AND** Nếu quét lại cây vải đã quét, hiển thị cảnh báo "Cây vải này đã được kiểm đếm trước đó!".

---

### REQ-PL-04: Mẫu in Bảng kê A4 / A5 Chuẩn Hóa & Xuất Excel

Hệ thống PHẢI có khả năng tạo mẫu in PDF đạt chuẩn chứng từ dệt may Vĩnh Phát v3 và xuất file Excel (.xlsx) phục vụ kế toán và đối tác.

#### Scenario: In Bảng kê A4 xuất xưởng

- **GIVEN** Người dùng mở Bảng kê của phiếu xuất hàng
- **WHEN** Bấm nút "In Bảng Kê"
- **THEN** Mẫu in hiển thị đầy đủ:
  - Header: Logo Công ty TNHH SX TM Dệt May Vĩnh Phát, MST, Địa chỉ nhà xưởng.
  - Thông tin khách hàng, số hợp đồng/đơn hàng, biển số xe giao hàng.
  - Bảng kê chi tiết ma trận cây vải theo từng màu.
  - Dòng tổng hợp số cây, tổng kg, đọc số tiền bằng chữ (nếu kèm đơn giá).
  - 4 ô ký tên xác nhận: Người lập biểu, Thủ kho xuất, Tài xế nhận hàng, Đại diện khách hàng.

---

## 2. Yêu cầu Chỉnh sửa (Modified Requirements)

- Không có (Không sửa đổi logic nghiệp vụ cũ).

---

## 3. Yêu cầu Loại bỏ (Deprecated Requirements)

- Không có.
