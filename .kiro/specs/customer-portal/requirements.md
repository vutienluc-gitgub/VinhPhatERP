# Tài Liệu Yêu Cầu: Customer Portal (Cổng Khách Hàng)

## Giới Thiệu

Customer Portal là giao diện self-service dành riêng cho khách hàng của hệ thống ERP vải/may mặc. Khách hàng đăng nhập bằng tài khoản riêng và chỉ xem được dữ liệu thuộc về mình: tiến độ đơn hàng, công nợ, lịch sử thanh toán và phiếu giao hàng. Toàn bộ giao diện là read-only ở giai đoạn đầu.

Tính năng này phù hợp khi số lượng khách hàng đủ lớn và họ cần chủ động theo dõi đơn hàng mà không cần liên hệ trực tiếp với nhân viên.

## Bảng Thuật Ngữ

- **Customer_Portal**: Giao diện web dành cho khách hàng, tách biệt với giao diện nội bộ ERP.
- **Customer_Account**: Tài khoản Supabase Auth được gắn với một bản ghi `customers` trong hệ thống.
- **Customer_Role**: Role `customer` trong bảng `profiles`, phân biệt với các role nội bộ (`admin`, `manager`, `staff`, `viewer`).
- **Auth_System**: Hệ thống xác thực dựa trên Supabase Auth và bảng `profiles`.
- **Order_View**: Màn hình danh sách và chi tiết đơn hàng dành cho khách hàng.
- **Progress_Timeline**: Giao diện hiển thị 7 công đoạn sản xuất của một đơn hàng.
- **Debt_Summary**: Tổng hợp công nợ: tổng tiền đơn, đã thanh toán, còn nợ.
- **Payment_History**: Danh sách các phiếu thu đã ghi nhận cho khách hàng.
- **Shipment_View**: Danh sách phiếu giao hàng liên quan đến đơn của khách hàng.
- **RLS**: Row-Level Security — cơ chế Supabase tự động lọc dữ liệu theo `auth.uid()`.

---

## Yêu Cầu

### Yêu Cầu 1: Xác Thực Khách Hàng

**User Story:** Là khách hàng, tôi muốn đăng nhập bằng email và mật khẩu, để tôi có thể truy cập thông tin đơn hàng của mình một cách an toàn.

#### Tiêu Chí Chấp Nhận

1. THE Auth_System SHALL hỗ trợ role `customer` trong enum `user_role` của bảng `profiles`.
2. WHEN khách hàng gửi email và mật khẩu hợp lệ, THE Auth_System SHALL tạo session và chuyển hướng đến trang tổng quan của Customer_Portal.
3. IF email hoặc mật khẩu không đúng, THEN THE Auth_System SHALL hiển thị thông báo lỗi xác thực mà không tiết lộ thông tin nào về tài khoản.
4. WHEN khách hàng đăng xuất, THE Auth_System SHALL hủy session và chuyển hướng về trang đăng nhập.
5. WHILE session của khách hàng đã hết hạn, THE Auth_System SHALL tự động chuyển hướng về trang đăng nhập khi khách hàng truy cập bất kỳ route nào của Customer_Portal.
6. IF tài khoản khách hàng có `is_active = false`, THEN THE Auth_System SHALL từ chối đăng nhập và hiển thị thông báo tài khoản bị khóa.

---

### Yêu Cầu 2: Phân Quyền và Cách Ly Dữ Liệu

**User Story:** Là quản trị viên hệ thống, tôi muốn đảm bảo khách hàng chỉ thấy dữ liệu của chính họ, để thông tin kinh doanh của các khách hàng khác không bị lộ.

#### Tiêu Chí Chấp Nhận

1. THE Auth_System SHALL liên kết mỗi Customer_Account với đúng một bản ghi trong bảng `customers` thông qua trường `customer_id` trong `profiles`.
2. THE RLS SHALL áp dụng policy lọc dữ liệu theo `customer_id` cho các bảng `orders`, `payments`, `shipments`, `order_progress` khi role là `customer`.
3. WHEN khách hàng gọi bất kỳ API nào, THE RLS SHALL chỉ trả về các bản ghi có `customer_id` khớp với `customer_id` trong `profiles` của người dùng đang đăng nhập.
4. IF khách hàng cố truy cập route nội bộ ERP (không thuộc Customer_Portal), THEN THE Auth_System SHALL chuyển hướng về trang unauthorized.
5. THE Customer_Portal SHALL không hiển thị bất kỳ dữ liệu nào của khách hàng khác dù người dùng thay đổi tham số URL.

---

### Yêu Cầu 3: Xem Danh Sách và Chi Tiết Đơn Hàng

**User Story:** Là khách hàng, tôi muốn xem danh sách đơn hàng của mình và chi tiết từng đơn, để tôi biết trạng thái và nội dung đơn hàng mà không cần gọi điện hỏi.

#### Tiêu Chí Chấp Nhận

1. WHEN khách hàng truy cập trang đơn hàng, THE Order_View SHALL hiển thị danh sách tất cả đơn hàng thuộc về khách hàng đó, sắp xếp theo ngày đặt hàng mới nhất trước.
2. THE Order_View SHALL hiển thị cho mỗi đơn hàng: số đơn hàng, ngày đặt, ngày giao dự kiến, tổng tiền, số tiền đã thanh toán và trạng thái đơn hàng.
3. WHEN khách hàng chọn một đơn hàng, THE Order_View SHALL hiển thị chi tiết bao gồm danh sách sản phẩm (tên vải, màu, số lượng, đơn giá, thành tiền).
4. THE Order_View SHALL là read-only — khách hàng không thể tạo, sửa hoặc xóa đơn hàng.
5. WHEN danh sách đơn hàng có hơn 20 bản ghi, THE Order_View SHALL hỗ trợ phân trang hoặc cuộn vô hạn.

---

### Yêu Cầu 4: Theo Dõi Tiến Độ Sản Xuất

**User Story:** Là khách hàng, tôi muốn xem tiến độ sản xuất đơn hàng của mình theo từng công đoạn, để tôi chủ động lên kế hoạch nhận hàng.

#### Tiêu Chí Chấp Nhận

1. WHEN khách hàng xem chi tiết một đơn hàng, THE Progress_Timeline SHALL hiển thị trạng thái của tất cả công đoạn sản xuất liên quan đến đơn đó.
2. THE Progress_Timeline SHALL hiển thị cho mỗi công đoạn: tên công đoạn, trạng thái (chờ / đang làm / hoàn thành / bỏ qua), ngày dự kiến và ngày thực tế nếu có.
3. THE Progress_Timeline SHALL là read-only — khách hàng không thể cập nhật trạng thái công đoạn.
4. IF một công đoạn có actual date trễ hơn planned date, THEN THE Progress_Timeline SHALL đánh dấu công đoạn đó là trễ hạn.

---

### Yêu Cầu 5: Xem Công Nợ

**User Story:** Là khách hàng, tôi muốn xem tổng hợp công nợ của mình, để tôi biết còn bao nhiêu tiền cần thanh toán.

#### Tiêu Chí Chấp Nhận

1. WHEN khách hàng truy cập trang công nợ, THE Debt_Summary SHALL hiển thị tổng tiền tất cả đơn hàng, tổng tiền đã thanh toán và tổng tiền còn nợ.
2. THE Debt_Summary SHALL tính toán số tiền còn nợ bằng công thức: tổng tiền đơn hàng trừ tổng tiền đã thanh toán.
3. THE Debt_Summary SHALL hiển thị danh sách các đơn hàng còn nợ, sắp xếp theo ngày giao dự kiến gần nhất trước.
4. THE Debt_Summary SHALL là read-only — khách hàng không thể tạo hoặc sửa phiếu thu.

---

### Yêu Cầu 6: Xem Lịch Sử Thanh Toán

**User Story:** Là khách hàng, tôi muốn xem lịch sử các lần thanh toán của mình, để tôi đối chiếu với chứng từ nội bộ.

#### Tiêu Chí Chấp Nhận

1. WHEN khách hàng truy cập trang lịch sử thanh toán, THE Payment_History SHALL hiển thị tất cả phiếu thu thuộc về khách hàng đó, sắp xếp theo ngày thu mới nhất trước.
2. THE Payment_History SHALL hiển thị cho mỗi phiếu thu: số phiếu, ngày thu, số tiền, phương thức thanh toán và số đơn hàng liên quan.
3. THE Payment_History SHALL là read-only — khách hàng không thể tạo hoặc sửa phiếu thu.

---

### Yêu Cầu 7: Xem Phiếu Giao Hàng

**User Story:** Là khách hàng, tôi muốn xem danh sách phiếu giao hàng của mình, để tôi theo dõi hàng đã được giao hay chưa.

#### Tiêu Chí Chấp Nhận

1. WHEN khách hàng truy cập trang giao hàng, THE Shipment_View SHALL hiển thị tất cả phiếu giao hàng thuộc về khách hàng đó, sắp xếp theo ngày giao mới nhất trước.
2. THE Shipment_View SHALL hiển thị cho mỗi phiếu giao: số phiếu, ngày giao, số đơn hàng liên quan, trạng thái giao hàng và địa chỉ giao.
3. WHEN khách hàng chọn một phiếu giao hàng, THE Shipment_View SHALL hiển thị chi tiết danh sách cuộn vải đã giao (mã cuộn, loại vải, số lượng).
4. THE Shipment_View SHALL là read-only — khách hàng không thể tạo hoặc sửa phiếu giao.

---

### Yêu Cầu 8: Quản Lý Tài Khoản Khách Hàng (Nội Bộ)

**User Story:** Là quản trị viên, tôi muốn tạo và quản lý tài khoản Customer_Portal cho khách hàng, để tôi kiểm soát ai có quyền truy cập.

#### Tiêu Chí Chấp Nhận

1. WHEN admin tạo Customer_Account mới, THE Auth_System SHALL tạo một Supabase Auth user với role `customer` và liên kết với bản ghi `customers` tương ứng.
2. THE Auth_System SHALL đảm bảo mỗi bản ghi `customers` chỉ được liên kết với tối đa một Customer_Account.
3. WHEN admin vô hiệu hóa một Customer_Account, THE Auth_System SHALL cập nhật `is_active = false` trong `profiles` và ngăn đăng nhập từ tài khoản đó.
4. IF admin cố liên kết một `customers` đã có Customer_Account với một tài khoản khác, THEN THE Auth_System SHALL từ chối thao tác và trả về thông báo lỗi rõ ràng.
