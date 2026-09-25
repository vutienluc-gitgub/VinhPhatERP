# Domain Specification: Quản lý Nhập Kho Sợi (Yarn Inbound)

- **Domain:** `yarn`
- **Owner:** Bộ phận Kho Nguyên Liệu & Ban Giám đốc Kỹ thuật
- **Trạng thái:** Active (Living Spec)
- **Database Tables:** `yarn_receipts`, `yarn_receipt_items`, `inventory_stocks`, `suppliers`

---

## 1. Tổng quan & Vai trò nghiệp vụ

Module Nhập Sợi là **điểm khởi đầu** của chuỗi cung ứng dệt may tại Vĩnh Phát.

- Mọi nguyên liệu sợi đưa vào dệt mộc (`raw-fabric`) đều phải được truy xuất nguồn gốc từ Phiếu nhập sợi (`yarn_receipts`).
- Đảm bảo tính toán công nợ nhà cung cấp chính xác, kiểm soát thông số kỹ thuật (Lot, Dtex, Twist, Khối lượng gộp/tịnh), và quản lý tồn kho nguyên liệu.

---

## 2. Dữ liệu & Ràng buộc cốt lõi (Data Invariants)

1. **Header (`yarn_receipts`)**:
   - `supplier_id`: UUID hợp lệ, bắt buộc gắn với nhà cung cấp trong bảng `suppliers`.
   - `receipt_date`: Ngày nhập thực tế của lô hàng (không được để trống).
   - `status`: Enum `doc_status` (`draft` | `confirmed` | `cancelled`).
   - `additional_fees`: Mảng các chi phí phát sinh hợp lệ (bốc xếp, vận chuyển...).
2. **Items (`yarn_receipt_items`)**:
   - Mỗi phiếu nhập PHẢI có ít nhất **1 dòng hàng (line item)**.
   - `quantity`: Số lượng sợi (kg) PHẢI > 0.
   - `unit_price`: Đơn giá (VNĐ) PHẢI >= 0.
   - `amount`: Thành tiền tự động sinh (`quantity * unit_price`).
   - `lot_number`: Số lô sản xuất từ nhà máy sợi (dùng để truy vết chất lượng khi dệt mộc).

---

## 3. Đặc tả Yêu cầu & Kịch bản (Requirements & Scenarios)

### REQ-YARN-01: Tạo và cập nhật Phiếu nhập sợi dạng Nháp (Draft)

Hệ thống PHẢI cho phép thủ kho lưu nháp thông tin phiếu nhập khi xe tải đang dỡ hàng hoặc chưa có hóa đơn chính thức.

#### Scenario: Lưu nháp thành công

- **GIVEN** Thủ kho đã chọn nhà cung cấp "Công ty Sợi Đồng Nai"
- **AND** Đã nhập ít nhất 1 dòng hàng: Loại sợi "Cotton 30s", Số lượng "500 kg", Đơn giá "80,000 đ"
- **WHEN** Thủ kho bấm "Lưu nháp"
- **THEN** Phiếu nhập được tạo với trạng thái `draft`
- **AND** Số liệu tồn kho sợi trong hệ thống **CHƯA** được tăng lên
- **AND** Công nợ nhà cung cấp **CHƯA** được ghi nhận.

#### Scenario: Từ chối lưu khi thiếu thông tin bắt buộc

- **GIVEN** Thủ kho để trống nhà cung cấp HOẶC danh sách dòng hàng rỗng
- **WHEN** Thủ kho bấm "Lưu"
- **THEN** Hệ thống chặn gửi dữ liệu (Client-side Zod validation)
- **AND** Hiển thị thông báo lỗi rõ ràng tại từng trường vi phạm.

---

### REQ-YARN-02: Xác nhận nhập kho (Confirm & Inbound Stock)

Hệ thống PHẢI thực hiện atomic transaction khi chuyển trạng thái từ `draft` sang `confirmed`.

#### Scenario: Xác nhận phiếu nhập hợp lệ

- **GIVEN** Phiếu nhập ở trạng thái `draft` với tổng khối lượng 2,000 kg sợi Polyester
- **WHEN** Người có thẩm quyền (Manager/Admin) bấm "Xác nhận nhập kho"
- **THEN** Trạng thái phiếu nhập chuyển thành `confirmed`
- **AND** Hệ thống ghi nhận tăng tồn kho sợi tương ứng trong `inventory_stocks`
- **AND** Tự động phát sinh bút toán/ghi nhận công nợ phải trả nhà cung cấp
- **AND** Phiếu nhập KHÔNG THỂ chỉnh sửa trực tiếp nội dung các dòng hàng nữa.

---

### REQ-YARN-03: Tính toán tài chính & Chi phí phụ trợ

Hệ thống PHẢI tự động tổng hợp tổng tiền hàng và các loại phụ phí đi kèm.

#### Scenario: Tính tổng giá trị phiếu có phụ phí vận chuyển

- **GIVEN** Dòng hàng 1: 1,000 kg x 70,000 đ = 70,000,000 đ
- **AND** Dòng hàng 2: 500 kg x 90,000 đ = 45,000,000 đ
- **AND** Chi phí bổ sung (Phí hạ hàng): 1,500,000 đ
- **WHEN** Hệ thống hiển thị tổng giá trị phiếu nhập
- **THEN** Tổng tiền hàng là 115,000,000 đ
- **AND** Tổng thanh toán cuối cùng là 116,500,000 đ.

---

### REQ-YARN-04: Quản lý thông số kỹ thuật ngành dệt (Textile Parameters)

Hệ thống PHẢI hỗ trợ lưu trữ và hiển thị các trường dữ liệu vật lý phục vụ kỹ thuật dệt:

- `lot_number`: Số lô sợi.
- `grade`: Cấp chất lượng (A, B, C).
- `composition`: Thành phần sợi (ví dụ: 100% Cotton, 65/35 TC, 100% Poly).
- `dtex` / `twist`: Độ mảnh và độ xoắn của sợi.
- `cones_per_box` / `box_count`: Số côn trên mỗi thùng và số lượng thùng.
- `gross_weight` / `net_weight`: Trọng lượng gộp và trọng lượng tịnh để kiểm soát bì (carton).

---

## 4. Truy xuất nguồn gốc (Traceability Chain)

```text
[Nhà cung cấp Sợi]
       │ (Hóa đơn / Phiếu xuất xưởng)
       ▼
[Phiếu Nhập Sợi: yarn_receipts] ── (lot_number, yarn_type)
       │
       ▼
[Kho Nguyên Liệu Sợi]
       │ (Xuất sợi cho xưởng dệt)
       ▼
[Phiếu Sản Xuất Mộc: raw_fabric] ── (Gắn ID phiếu nhập sợi để kiểm soát nguồn mộc)
```

---

## 5. Quy tắc bất biến ERP (ERP Invariants)

1. **Không âm tồn kho**: Không được phép hủy phiếu nhập nếu số sợi của lô này đã được xuất sang máy dệt sản xuất mộc và tồn kho khả dụng < 0.
2. **Tính toàn vẹn giá vốn**: Đơn giá nhập sợi là căn cứ tính giá thành mộc; nghiêm cấm sửa đơn giá hồi tố sau khi đã tính giá thành mộc mà không có xác nhận từ Kế toán trưởng.
