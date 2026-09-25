# Delta Specification: Bảng kê Cây vải Ma trận 10 cây/dòng chuẩn Giấy A5 Ngang (A5 Packing Matrix)

Tài liệu này ghi nhận sự khác biệt (Delta) giữa đặc tả nghiệp vụ hiện tại trong `specs/inventory/spec.md` và giao diện thực tế đối với luồng xuất kho bảng kê cây vải.

---

## 1. Yêu cầu Bổ sung (Added Requirements)

### REQ-A5-01: Thuật toán Ma trận 10 cây/dòng (Decade Matrix Chunking)

- **GIVEN**: Danh sách $N$ cây vải thuộc cùng một nhóm màu/lô (với $N \ge 1$).
- **WHEN**: Hệ thống tạo bảng kê hiển thị hoặc chuẩn bị in.
- **THEN**:
  - Tự động chia thành các hàng, mỗi hàng tối đa 10 cây.
  - Cột đầu tiên ghi khoảng số thứ tự: `01 - 10`, `11 - 20`,...
  - 10 cột tiếp theo hiển thị cân nặng từng cây (làm tròn 1 chữ số thập phân).
  - Cột cuối cùng tính tổng cộng dồn của hàng đó (`subtotal_weight_kg = \sum_{i=1}^{10} weight_i`).
  - Hàng cuối cùng nếu không đủ 10 cây thì vẫn hiển thị đúng số cây hiện có và tính tổng dòng chính xác.
  - Hàng tổng kết toàn bộ (Footer): Tổng số cây vải và tổng trọng lượng kg của toàn bảng.

### REQ-A5-02: Khổ in chuẩn Giấy A5 4 liên nằm ngang (A5 Landscape)

- **GIVEN**: Người dùng chọn in bảng kê phiếu giao hàng / xuất kho.
- **WHEN**: Trình duyệt mở hộp thoại Print.
- **THEN**:
  - Kích thước in ấn áp dụng: `size: A5 landscape` (210mm x 148mm).
  - Chừa lề lề in an toàn `6mm 8mm` cho giấy liên đục lỗ / kim / laser.
  - Chứa trọn vẹn tới 100 cây vải (10 dòng) + Header (thông tin xuất hàng) + Footer (4 chữ ký: Lập phiếu, Thủ kho, Lái xe, Khách nhận) trong duy nhất 1 mặt giấy A5.

### REQ-A5-03: Component Tái sử dụng Đa năng (Universal Reusable Component)

- **GIVEN**: Cần hiển thị bảng kê ở Customer Portal, ERP Kho thành phẩm, hoặc Phiếu in.
- **WHEN**: Gọi `<FabricRollMatrixTable rolls={rolls} ... />`.
- **THEN**:
  - Hỗ trợ chế độ tương tác (Hover xem mã cây vải, click quét barcode kiểm đếm) trên Web.
  - Hỗ trợ chế độ in tĩnh (in đen trắng hoặc high-contrast) trên giấy in kim/liên carbonless.
  - Responsive: Trên màn hình nhỏ (Mobile) hỗ trợ cuộn ngang nhẹ nhàng không vỡ khung.

---

## 2. Yêu cầu Chỉnh sửa (Modified Requirements)

- **Quy chuẩn CŨ**:
  - `PortalOrderPackingList.tsx` hiển thị danh sách cây thành 2 cột dọc (nếu 100 cây thì dài 50 dòng).
  - `FabricPackingPrintTemplate.tsx` in dạng bảng dọc 1 cây/dòng (tràn ra 3-5 trang).
- **Quy chuẩn MỚI**:
  - Cả Portal, Mẫu in và ERP đều sử dụng thống nhất dạng Ma trận 10 cây/dòng hoặc chuyển đổi linh hoạt.
- **Lý do kinh doanh (Business Justification)**:
  - Phù hợp với đặc thù thực tế tại Xưởng Dệt May Vĩnh Phát (sử dụng giấy in kim A5 4 liên nằm ngang). Tiết kiệm chi phí in ấn, đối soát nhanh chóng theo từng dòng 10 cây khi giao nhận xe tải.

---

## 3. Yêu cầu Loại bỏ (Deprecated / Removed Requirements)

- Không loại bỏ chức năng cũ nào; các định dạng xem dạng Lưới thẻ (Matrix Grid) và Bảng danh sách (Table View) ở ERP kho vẫn được giữ làm tùy chọn bổ trợ.
