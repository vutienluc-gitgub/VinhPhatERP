# Requirements Document

## Introduction

Tối ưu trải nghiệm người dùng (UX) cho màn hình "Quản lý cuộn vải mộc" (Kho Vải Mộc) trong hệ thống ERP Sản xuất. Màn hình hiện tại có đủ dữ liệu nhưng thiếu rõ ràng về ngữ nghĩa hiển thị, khó đọc trên mobile, và thiếu các tín hiệu thị giác giúp người dùng hiểu nhanh trạng thái kho. Cải tiến tập trung vào 6 vấn đề đã phân tích: summary cards thiếu context, grid cuộn vải thiếu legend, bộ lọc chưa đủ mạnh, phân trang LOT khó thấy, hierarchy nút hành động chưa rõ, và layout chưa tối ưu mobile.

## Glossary

- **KPI_Card**: Thẻ tóm tắt số liệu tổng hợp ở đầu màn hình (Tổng số cuộn, Tổng chiều dài, Tổng khối lượng)
- **LOT**: Nhóm cuộn vải được nhập cùng một đợt, có chung mã lô (lot_number)
- **LotMatrixCard**: Component hiển thị một LOT dưới dạng lưới các ô cuộn vải
- **RollGridItem**: Ô đại diện cho một cuộn vải trong lưới, có màu sắc theo trạng thái bất thường (anomaly)
- **AnomalyStatus**: Trạng thái bất thường về cân nặng của cuộn: `normal` (bình thường), `light` (nhẹ hơn chuẩn — màu đỏ), `heavy` (nặng hơn chuẩn — màu cam), `empty` (ô trống chờ nhập)
- **RollStatus**: Trạng thái vận hành của cuộn: `in_stock` (trong kho), `reserved` (đã đặt), `in_process` (đang xử lý), `shipped` (đã xuất), `damaged` (hỏng), `written_off` (xóa sổ)
- **Filter_Bar**: Khu vực bộ lọc gồm 4 trường: Loại vải, Mã cuộn, Trạng thái, Chất lượng
- **RawFabricList**: Component danh sách chính của màn hình Kho Vải Mộc
- **ViewToggle**: Nút chuyển đổi giữa chế độ xem lưới (grid) và bảng (table)

---

## Requirements

### Requirement 1: KPI Cards có ngữ nghĩa rõ ràng

**User Story:** Là một quản lý kho, tôi muốn nhìn vào 3 thẻ KPI và hiểu ngay ý nghĩa của từng con số, để tôi không cần đoán tại sao một thẻ lại hiển thị màu cảnh báo.

#### Acceptance Criteria

1. THE KPI_Card SHALL hiển thị nhãn phụ (footer) mô tả rõ phạm vi tính toán của số liệu, ví dụ "Chỉ tính cuộn đang trong kho (in_stock)" thay vì "Sẵn sàng để đưa vào nhuộm".
2. WHEN giá trị `totalLengthM` bằng 0, THE KPI_Card SHALL hiển thị màu neutral (không phải màu warning) và hiển thị tooltip giải thích "Chưa có dữ liệu chiều dài" thay vì để trống.
3. WHEN giá trị `totalLengthM` lớn hơn 0, THE KPI_Card SHALL hiển thị màu success để phân biệt với trạng thái không có dữ liệu.
4. THE KPI_Card SHALL sử dụng màu sắc nhất quán với ngữ nghĩa: primary cho số lượng cuộn, success cho chiều dài, info cho khối lượng — không dùng warning cho dữ liệu bình thường.
5. WHEN người dùng nhấn vào một KPI_Card, THE RawFabricList SHALL tự động áp dụng bộ lọc tương ứng (ví dụ: nhấn "Tổng số cuộn" → lọc tất cả trạng thái).

---

### Requirement 2: Legend màu cho lưới cuộn vải

**User Story:** Là một nhân viên kho, tôi muốn biết ô màu đỏ và ô màu cam trong lưới cuộn vải có nghĩa là gì, để tôi không cần hỏi đồng nghiệp mỗi lần nhìn vào màn hình.

#### Acceptance Criteria

1. THE LotMatrixCard SHALL hiển thị một legend nhỏ ngay phía trên hoặc phía dưới lưới cuộn vải, liệt kê ý nghĩa của từng màu AnomalyStatus.
2. THE Legend SHALL hiển thị tối thiểu 3 mục: ô bình thường (normal), ô nhẹ hơn chuẩn (light — màu đỏ), ô nặng hơn chuẩn (heavy — màu cam).
3. WHERE màn hình có chiều rộng nhỏ hơn 640px, THE Legend SHALL hiển thị dạng thu gọn (chỉ hiện icon màu + nhãn ngắn) để không chiếm quá nhiều không gian.
4. THE Legend SHALL chỉ hiển thị khi `standardWeightKg` được cung cấp, vì khi không có chuẩn cân nặng thì không có anomaly detection.
5. WHEN một RollGridItem có `anomalyStatus` là `light` hoặc `heavy`, THE RollGridItem SHALL hiển thị tooltip khi hover/long-press giải thích cụ thể mức lệch so với chuẩn (ví dụ: "Nhẹ hơn chuẩn 15%").

---

### Requirement 3: Bộ lọc tìm kiếm mạnh hơn

**User Story:** Là một nhân viên kho, tôi muốn tìm kiếm loại vải bằng autocomplete và có thể xóa toàn bộ bộ lọc bằng một nút, để tôi tìm được cuộn vải cần thiết nhanh hơn.

#### Acceptance Criteria

1. THE Filter_Bar SHALL thay thế input text "Loại vải" bằng Combobox có autocomplete, gợi ý danh sách các `fabric_type` đang tồn tại trong kho.
2. WHEN người dùng gõ vào ô "Loại vải", THE Combobox SHALL lọc và hiển thị các gợi ý khớp với chuỗi đã nhập trong vòng 300ms.
3. THE Filter_Bar SHALL thay thế input text "Mã cuộn" bằng input có debounce 400ms, tự động áp dụng filter khi người dùng ngừng gõ — không cần blur để trigger.
4. WHEN có ít nhất một filter đang được áp dụng, THE Filter_Bar SHALL hiển thị nút "Xóa lọc" rõ ràng ở cuối khu vực filter.
5. WHEN người dùng nhấn nút "Xóa lọc", THE RawFabricList SHALL reset toàn bộ filter về mặc định và tải lại dữ liệu từ trang 1.
6. THE Filter_Bar SHALL hiển thị số lượng kết quả hiện tại (ví dụ: "Đang hiển thị 13 cuộn") ngay dưới khu vực filter khi có filter đang hoạt động.

---

### Requirement 4: Phân trang và thông tin LOT dễ đọc

**User Story:** Là một quản lý kho, tôi muốn thấy rõ mình đang xem trang nào và tổng số LOT là bao nhiêu, để tôi biết còn bao nhiêu dữ liệu chưa xem.

#### Acceptance Criteria

1. THE Pagination SHALL hiển thị thông tin dạng "Trang X / Y — Z cuộn" với font-size tối thiểu 14px và màu text đủ tương phản (contrast ratio ≥ 4.5:1).
2. THE Pagination SHALL hiển thị nút "Trang trước" và "Trang sau" với kích thước tối thiểu 44x44px để đáp ứng tiêu chuẩn touch-friendly.
3. WHEN chỉ có 1 trang dữ liệu, THE Pagination SHALL ẩn hoàn toàn để không chiếm không gian.
4. THE LotMatrixCard SHALL hiển thị số thứ tự LOT trong danh sách hiện tại (ví dụ: "LOT 1/13") ở header để người dùng biết vị trí tương đối.
5. WHEN danh sách LOT rỗng do filter không khớp, THE RawFabricList SHALL hiển thị empty state với thông báo rõ ràng và nút "Xóa bộ lọc" để người dùng thoát khỏi trạng thái rỗng.

---

### Requirement 5: Hierarchy nút hành động rõ ràng

**User Story:** Là một nhân viên kho, tôi muốn nhìn vào header và biết ngay đâu là hành động chính, đâu là hành động phụ, để tôi không nhấn nhầm nút.

#### Acceptance Criteria

1. THE RawFabricList SHALL phân cấp nút hành động: "Nhập mới" là nút primary (nổi bật nhất), "Nhập mẻ" là nút secondary, nút xuất Excel là nút icon-only.
2. THE RawFabricList SHALL đặt "Nhập mới" ở vị trí ngoài cùng bên phải trong nhóm nút, vì đây là hành động chính được thực hiện thường xuyên nhất.
3. WHERE màn hình có chiều rộng nhỏ hơn 640px, THE RawFabricList SHALL hiển thị chỉ nút "Nhập mới" (full-width) và gộp các hành động phụ vào một nút menu "..." để tránh overflow.
4. THE RawFabricList SHALL thêm tooltip cho nút xuất Excel hiển thị "Xuất Excel (tất cả kết quả hiện tại)" để người dùng biết phạm vi xuất.
5. WHEN thao tác xuất Excel đang chạy, THE RawFabricList SHALL disable toàn bộ nút hành động và hiển thị spinner trên nút xuất để tránh double-click.

---

### Requirement 6: Layout không bị overflow trên mobile

**User Story:** Là một nhân viên kho dùng điện thoại, tôi muốn xem lưới cuộn vải mà không bị scroll ngang, để tôi có thể thao tác thoải mái trên màn hình nhỏ.

#### Acceptance Criteria

1. THE LotMatrixCard SHALL sử dụng `grid-cols-5 md:grid-cols-10` cho lưới cuộn vải, không dùng inline style `gridTemplateColumns` với giá trị cố định.
2. WHILE màn hình có chiều rộng nhỏ hơn 640px, THE LotMatrixCard SHALL đảm bảo mỗi RollGridItem có chiều rộng tối thiểu 56px và không gây scroll ngang trên container cha.
3. THE RawFabricList SHALL bọc toàn bộ khu vực lưới LOT trong container có `overflow-x-hidden` để ngăn scroll ngang không mong muốn.
4. THE LotMatrixCard header SHALL sử dụng layout `flex-col` trên mobile và `flex-row` trên desktop (sm:flex-row), không để text bị cắt hoặc overflow.
5. THE Filter_Bar SHALL sử dụng layout 1 cột trên mobile và 2 cột trên tablet (grid-cols-1 sm:grid-cols-2 md:grid-cols-4), không để các field bị chồng lên nhau.
6. IF một RollGridItem có `roll_number` dài hơn 8 ký tự, THEN THE RollGridItem SHALL hiển thị text dạng truncate với tooltip hiển thị mã đầy đủ khi hover/long-press.
