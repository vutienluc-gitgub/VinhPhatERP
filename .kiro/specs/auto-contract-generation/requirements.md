# Tài Liệu Yêu Cầu

## Giới Thiệu

Module Tự Động Tạo Hợp Đồng (Auto Contract Generation) cho phép hệ thống ERP dệt may Vĩnh Phát tự động sinh ra hợp đồng mua bán vải dựa trên dữ liệu đơn hàng, thông tin khách hàng hoặc nhà cung cấp đã có sẵn trong hệ thống. Module này giảm thiểu thao tác thủ công, đảm bảo tính nhất quán về nội dung pháp lý và cho phép xuất hợp đồng dưới dạng PDF hoặc gửi qua Zalo/email.

Hợp đồng được tạo ra tuân theo mẫu chuẩn của công ty (Hợp Đồng Nguyên Tắc Mua Bán Vải), tự động điền thông tin hai bên, điều khoản thanh toán, quy cách giao hàng và các điều khoản pháp lý tiêu chuẩn.

## Bảng Thuật Ngữ

- **Contract_Generator**: Thành phần hệ thống chịu trách nhiệm tạo nội dung hợp đồng từ dữ liệu nguồn.
- **Contract**: Tài liệu hợp đồng mua bán vải được tạo ra, lưu trữ và quản lý trong hệ thống.
- **Contract_Template**: Mẫu hợp đồng chuẩn của công ty, chứa các điều khoản pháp lý cố định và các trường dữ liệu động.
- **Contract_Number**: Số hợp đồng được tạo tự động theo định dạng chuẩn (VD: `001/2026/HĐNT–ĐKKH/TKS`).
- **Party_A**: Bên mua — khách hàng hoặc nhà cung cấp tùy loại hợp đồng.
- **Party_B**: Bên bán — công ty Vĩnh Phát (thông tin cố định từ cấu hình hệ thống).
- **PDF_Exporter**: Thành phần xuất hợp đồng ra file PDF.
- **Order**: Đơn hàng trong hệ thống ERP, là nguồn dữ liệu chính để tạo hợp đồng bán hàng.
- **Customer**: Khách hàng trong hệ thống, cung cấp thông tin Party_A cho hợp đồng bán hàng.
- **Supplier**: Nhà cung cấp trong hệ thống, cung cấp thông tin Party_A cho hợp đồng mua hàng.
- **Contract_Status**: Trạng thái vòng đời của hợp đồng: `draft` → `sent` → `signed` → `expired` / `cancelled`.
- **Payment_Term**: Điều khoản thanh toán được lấy từ thông tin khách hàng hoặc nhà cung cấp.

---

## Yêu Cầu

### Yêu Cầu 1: Tạo Hợp Đồng Từ Đơn Hàng

**User Story:** Là nhân viên kinh doanh, tôi muốn tạo hợp đồng mua bán vải trực tiếp từ một đơn hàng đã có, để không phải nhập lại thông tin và đảm bảo hợp đồng khớp với đơn hàng.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng chọn tạo hợp đồng từ một Order, THE Contract_Generator SHALL tự động điền thông tin khách hàng (tên, địa chỉ, MST, người đại diện) vào Party_A của Contract.
2. WHEN người dùng chọn tạo hợp đồng từ một Order, THE Contract_Generator SHALL tự động điền thông tin công ty Vĩnh Phát từ cấu hình hệ thống vào Party_B của Contract.
3. WHEN người dùng chọn tạo hợp đồng từ một Order, THE Contract_Generator SHALL tự động điền điều khoản thanh toán (Payment_Term) từ thông tin Customer vào Contract.
4. WHEN người dùng chọn tạo hợp đồng từ một Order, THE Contract_Generator SHALL tạo Contract_Number theo định dạng `{seq}/{năm}/HĐNT–ĐKKH/TKS` với `seq` là số thứ tự tăng dần trong năm.
5. WHEN một Order đã có Contract liên kết, THE Contract_Generator SHALL hiển thị cảnh báo và yêu cầu người dùng xác nhận trước khi tạo Contract mới cho Order đó.
6. IF Order có trạng thái `cancelled`, THEN THE Contract_Generator SHALL từ chối tạo Contract và trả về thông báo lỗi rõ ràng.
7. IF Customer của Order có trạng thái `inactive`, THEN THE Contract_Generator SHALL từ chối tạo Contract và trả về thông báo lỗi rõ ràng.

---

### Yêu Cầu 2: Tạo Hợp Đồng Từ Thông Tin Khách Hàng / Nhà Cung Cấp

**User Story:** Là nhân viên kinh doanh, tôi muốn tạo hợp đồng nguyên tắc trực tiếp từ hồ sơ khách hàng hoặc nhà cung cấp (không cần đơn hàng cụ thể), để ký kết điều khoản khung trước khi giao dịch.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng chọn tạo hợp đồng từ một Customer, THE Contract_Generator SHALL tự động điền thông tin Customer vào Party_A của Contract.
2. WHEN người dùng chọn tạo hợp đồng từ một Supplier, THE Contract_Generator SHALL tự động điền thông tin Supplier vào Party_A của Contract.
3. THE Contract_Generator SHALL cho phép người dùng chọn loại hợp đồng: `Hợp Đồng Bán Hàng` (với Customer) hoặc `Hợp Đồng Mua Hàng` (với Supplier).
4. WHEN tạo hợp đồng nguyên tắc không có Order, THE Contract_Generator SHALL để trống phần quy cách/số lượng/đơn giá và ghi chú "Theo từng đơn đặt hàng".
5. IF Customer hoặc Supplier có trạng thái `inactive`, THEN THE Contract_Generator SHALL từ chối tạo Contract và trả về thông báo lỗi rõ ràng.

---

### Yêu Cầu 3: Quản Lý Mẫu Hợp Đồng (Contract Template)

**User Story:** Là quản trị viên, tôi muốn quản lý các mẫu hợp đồng chuẩn của công ty, để đảm bảo mọi hợp đồng được tạo ra đều tuân theo định dạng pháp lý đã được phê duyệt.

#### Tiêu Chí Chấp Nhận

1. THE Contract_Generator SHALL hỗ trợ ít nhất 2 loại Contract_Template: `Hợp Đồng Bán Hàng` và `Hợp Đồng Mua Hàng`.
2. THE Contract_Generator SHALL cho phép Admin xem và chỉnh sửa nội dung các điều khoản cố định trong Contract_Template.
3. WHEN Admin lưu thay đổi Contract_Template, THE Contract_Generator SHALL chỉ áp dụng template mới cho các Contract được tạo sau thời điểm lưu, không thay đổi các Contract đã tạo trước đó.
4. THE Contract_Generator SHALL hỗ trợ các trường động (placeholder) trong template theo cú pháp `{{field_name}}` để tự động điền dữ liệu khi tạo Contract.
5. WHERE Admin cấu hình thông tin công ty (tên, địa chỉ, MST, tài khoản ngân hàng, người đại diện), THE Contract_Generator SHALL sử dụng thông tin đó làm dữ liệu mặc định cho Party_B trong mọi Contract.

---

### Yêu Cầu 4: Chỉnh Sửa Và Xem Trước Hợp Đồng

**User Story:** Là nhân viên kinh doanh, tôi muốn xem trước và chỉnh sửa nội dung hợp đồng trước khi gửi cho khách hàng, để đảm bảo thông tin chính xác và phù hợp với từng trường hợp cụ thể.

#### Tiêu Chí Chấp Nhận

1. WHEN Contract_Generator tạo xong Contract, THE Contract_Generator SHALL lưu Contract với trạng thái `draft` và hiển thị màn hình xem trước nội dung.
2. WHILE Contract có trạng thái `draft`, THE Contract_Generator SHALL cho phép người dùng chỉnh sửa các trường nội dung của Contract.
3. WHILE Contract có trạng thái `signed`, THE Contract_Generator SHALL không cho phép chỉnh sửa nội dung Contract.
4. THE Contract_Generator SHALL hiển thị bản xem trước (preview) của Contract theo đúng định dạng hợp đồng trước khi xuất PDF.
5. WHEN người dùng chỉnh sửa Contract, THE Contract_Generator SHALL lưu lịch sử thay đổi (audit log) ghi nhận người dùng, thời gian và nội dung thay đổi.

---

### Yêu Cầu 5: Xuất PDF Hợp Đồng

**User Story:** Là nhân viên kinh doanh, tôi muốn xuất hợp đồng ra file PDF theo đúng định dạng chuẩn của công ty, để in ấn hoặc gửi cho đối tác.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng yêu cầu xuất PDF, THE PDF_Exporter SHALL tạo file PDF từ nội dung Contract hiện tại trong vòng 10 giây.
2. THE PDF_Exporter SHALL xuất PDF với đầy đủ: tiêu đề hợp đồng, thông tin hai bên, các điều khoản, ngày ký và phần chữ ký.
3. THE PDF_Exporter SHALL định dạng PDF theo khổ giấy A4, font chữ Times New Roman, cỡ chữ 12pt, lề trên/dưới 2cm, lề trái/phải 2.5cm.
4. WHEN PDF được xuất thành công, THE PDF_Exporter SHALL lưu bản sao PDF vào hệ thống và liên kết với Contract tương ứng.
5. IF quá trình tạo PDF thất bại, THEN THE PDF_Exporter SHALL trả về thông báo lỗi cụ thể và không thay đổi trạng thái Contract.

---

### Yêu Cầu 6: Quản Lý Vòng Đời Hợp Đồng

**User Story:** Là nhân viên kinh doanh, tôi muốn theo dõi trạng thái của từng hợp đồng (đã gửi, đã ký, hết hạn), để quản lý tiến độ ký kết và nhắc nhở kịp thời.

#### Tiêu Chí Chấp Nhận

1. THE Contract_Generator SHALL quản lý Contract theo vòng đời trạng thái: `draft` → `sent` → `signed` → `expired` hoặc `cancelled`.
2. WHEN người dùng cập nhật trạng thái Contract sang `sent`, THE Contract_Generator SHALL ghi nhận ngày gửi và người thực hiện.
3. WHEN người dùng cập nhật trạng thái Contract sang `signed`, THE Contract_Generator SHALL ghi nhận ngày ký và cho phép đính kèm file hợp đồng đã ký.
4. WHILE Contract có ngày hiệu lực kết thúc đã qua và trạng thái không phải `signed` hoặc `cancelled`, THE Contract_Generator SHALL tự động cập nhật trạng thái sang `expired`.
5. WHEN Contract bị huỷ (`cancelled`), THE Contract_Generator SHALL yêu cầu người dùng nhập lý do huỷ và lưu vào audit log.
6. THE Contract_Generator SHALL hiển thị danh sách Contract với bộ lọc theo trạng thái, khách hàng/nhà cung cấp, khoảng thời gian tạo và loại hợp đồng.

---

### Yêu Cầu 7: Đánh Số Hợp Đồng Tự Động

**User Story:** Là nhân viên kinh doanh, tôi muốn hệ thống tự động tạo số hợp đồng theo đúng quy tắc đánh số của công ty, để tránh trùng lặp và dễ tra cứu.

#### Tiêu Chí Chấp Nhận

1. THE Contract_Generator SHALL tạo Contract_Number duy nhất cho mỗi Contract, không cho phép hai Contract có cùng Contract_Number.
2. THE Contract_Generator SHALL đánh số theo định dạng `{seq:03d}/{năm}/HĐNT–{loại}/TKS` trong đó `seq` reset về `001` vào đầu mỗi năm.
3. WHEN hai người dùng đồng thời tạo Contract, THE Contract_Generator SHALL đảm bảo mỗi Contract nhận được Contract_Number khác nhau (không xảy ra race condition).
4. WHERE Admin cấu hình tiền tố số hợp đồng khác nhau cho từng loại hợp đồng, THE Contract_Generator SHALL sử dụng tiền tố tương ứng khi tạo Contract_Number.

---

### Yêu Cầu 8: Liên Kết Hợp Đồng Với Đơn Hàng

**User Story:** Là nhân viên kinh doanh, tôi muốn xem hợp đồng liên quan trực tiếp từ màn hình đơn hàng và ngược lại, để dễ dàng tra cứu và đối chiếu.

#### Tiêu Chí Chấp Nhận

1. THE Contract_Generator SHALL cho phép liên kết một Contract với một hoặc nhiều Order.
2. WHEN người dùng xem chi tiết một Order, THE Contract_Generator SHALL hiển thị danh sách các Contract đã liên kết với Order đó.
3. WHEN người dùng xem chi tiết một Contract, THE Contract_Generator SHALL hiển thị danh sách các Order đã liên kết với Contract đó.
4. THE Contract_Generator SHALL cho phép liên kết hoặc huỷ liên kết Contract–Order sau khi Contract đã được tạo, miễn là Contract chưa ở trạng thái `signed`.
