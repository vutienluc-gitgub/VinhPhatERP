# Tài Liệu Yêu Cầu: Thông Báo Realtime trong Customer Portal

## Giới Thiệu

Tính năng này bổ sung khả năng nhận thông báo realtime cho khách hàng đang sử dụng Customer Portal. Khi nhân viên nội bộ cập nhật trạng thái đơn hàng, tiến độ sản xuất hoặc tạo phiếu giao hàng mới, khách hàng sẽ thấy thông báo ngay lập tức mà không cần tải lại trang.

Hệ thống sử dụng Supabase Realtime (PostgreSQL logical replication) để lắng nghe thay đổi trên các bảng `orders`, `order_progress` và `shipments`. RLS đã được thiết lập sẵn, đảm bảo mỗi khách hàng chỉ nhận thông báo liên quan đến dữ liệu của chính họ.

## Bảng Thuật Ngữ

- **Realtime_Service**: Module quản lý kết nối Supabase Realtime, đăng ký channel và phân phối sự kiện đến các subscriber trong ứng dụng.
- **Notification_Center**: Component UI hiển thị danh sách thông báo chưa đọc và đã đọc trong Customer Portal.
- **Notification_Badge**: Chỉ số số lượng thông báo chưa đọc hiển thị trên icon chuông trong header.
- **Realtime_Channel**: Kết nối Supabase Realtime được đăng ký theo `customer_id` của khách hàng đang đăng nhập.
- **Portal_Event**: Sự kiện thay đổi dữ liệu được chuẩn hóa từ Supabase Realtime payload, bao gồm loại sự kiện, bảng nguồn và dữ liệu mới.
- **Notification_Item**: Một thông báo đơn lẻ được tạo ra từ một Portal_Event, bao gồm tiêu đề, nội dung, thời gian và trạng thái đọc.
- **Customer_Portal**: Giao diện web dành cho khách hàng (đã định nghĩa trong spec customer-portal).
- **RLS**: Row-Level Security — cơ chế Supabase tự động lọc dữ liệu theo `auth.uid()` (đã định nghĩa trong spec customer-portal).

---

## Yêu Cầu

### Yêu Cầu 1: Kết Nối Realtime

**User Story:** Là khách hàng, tôi muốn hệ thống tự động kết nối realtime khi tôi đăng nhập vào portal, để tôi nhận được thông báo ngay lập tức mà không cần thao tác thêm.

#### Tiêu Chí Chấp Nhận

1. WHEN khách hàng đăng nhập thành công vào Customer_Portal, THE Realtime_Service SHALL thiết lập kết nối Supabase Realtime và đăng ký Realtime_Channel cho `customer_id` của khách hàng đó.
2. WHEN khách hàng đăng xuất khỏi Customer_Portal, THE Realtime_Service SHALL hủy đăng ký tất cả Realtime_Channel và đóng kết nối.
3. IF kết nối Realtime_Channel bị gián đoạn, THEN THE Realtime_Service SHALL tự động thử kết nối lại tối đa 3 lần với khoảng cách 5 giây giữa mỗi lần thử.
4. IF sau 3 lần thử kết nối lại đều thất bại, THEN THE Realtime_Service SHALL hiển thị thông báo cảnh báo cho khách hàng rằng thông báo realtime tạm thời không khả dụng.
5. THE Realtime_Service SHALL đăng ký lắng nghe sự kiện `UPDATE` trên bảng `orders`, sự kiện `INSERT` và `UPDATE` trên bảng `order_progress`, và sự kiện `INSERT` trên bảng `shipments`.

---

### Yêu Cầu 2: Thông Báo Thay Đổi Trạng Thái Đơn Hàng

**User Story:** Là khách hàng, tôi muốn nhận thông báo ngay khi trạng thái đơn hàng của tôi thay đổi, để tôi biết đơn hàng đang ở giai đoạn nào mà không cần tự vào kiểm tra.

#### Tiêu Chí Chấp Nhận

1. WHEN trường `status` của một bản ghi trong bảng `orders` thay đổi và bản ghi đó thuộc về khách hàng đang đăng nhập, THE Realtime_Service SHALL tạo một Notification_Item với tiêu đề "Đơn hàng [order_number] đã cập nhật" và nội dung mô tả trạng thái mới.
2. THE Notification_Item SHALL hiển thị nhãn trạng thái bằng tiếng Việt theo bảng ánh xạ: `draft` → "Nháp", `confirmed` → "Đã xác nhận", `in_progress` → "Đang sản xuất", `completed` → "Hoàn thành", `cancelled` → "Đã hủy".
3. IF trường `status` trong payload Realtime không thay đổi so với giá trị trước đó, THEN THE Realtime_Service SHALL bỏ qua sự kiện đó và không tạo Notification_Item.
4. WHEN Notification_Item được tạo, THE Notification_Center SHALL hiển thị thông báo toast trong 5 giây và tăng Notification_Badge lên 1.

---

### Yêu Cầu 3: Thông Báo Cập Nhật Tiến Độ Sản Xuất

**User Story:** Là khách hàng, tôi muốn nhận thông báo khi tiến độ sản xuất đơn hàng của tôi được cập nhật, để tôi theo dõi được tiến trình mà không cần liên hệ nhân viên.

#### Tiêu Chí Chấp Nhận

1. WHEN một bản ghi trong bảng `order_progress` được tạo mới hoặc trường `status` thay đổi, và bản ghi đó liên kết với đơn hàng thuộc về khách hàng đang đăng nhập, THE Realtime_Service SHALL tạo một Notification_Item với tiêu đề "Tiến độ đơn [order_number] đã cập nhật".
2. THE Notification_Item SHALL hiển thị tên công đoạn bằng tiếng Việt theo bảng ánh xạ: `warping` → "Mắc sợi", `weaving` → "Dệt", `greige_check` → "Kiểm vải mộc", `dyeing` → "Nhuộm", `finishing` → "Hoàn tất", `final_check` → "Kiểm tra cuối", `packing` → "Đóng gói".
3. THE Notification_Item SHALL hiển thị trạng thái công đoạn bằng tiếng Việt: `pending` → "Chờ", `in_progress` → "Đang thực hiện", `done` → "Hoàn thành", `skipped` → "Bỏ qua".
4. IF trường `status` trong payload Realtime không thay đổi so với giá trị trước đó (đối với sự kiện UPDATE), THEN THE Realtime_Service SHALL bỏ qua sự kiện đó và không tạo Notification_Item.

---

### Yêu Cầu 4: Thông Báo Phiếu Giao Hàng Mới

**User Story:** Là khách hàng, tôi muốn nhận thông báo ngay khi có phiếu giao hàng mới được tạo cho đơn hàng của tôi, để tôi chuẩn bị nhận hàng kịp thời.

#### Tiêu Chí Chấp Nhận

1. WHEN một bản ghi mới được chèn vào bảng `shipments` và bản ghi đó có `customer_id` khớp với khách hàng đang đăng nhập, THE Realtime_Service SHALL tạo một Notification_Item với tiêu đề "Phiếu giao hàng mới [shipment_number]" và nội dung bao gồm số đơn hàng liên quan và địa chỉ giao hàng.
2. WHEN Notification_Item về phiếu giao hàng được tạo, THE Notification_Center SHALL hiển thị thông báo toast trong 5 giây và tăng Notification_Badge lên 1.

---

### Yêu Cầu 5: Trung Tâm Thông Báo (Notification Center)

**User Story:** Là khách hàng, tôi muốn xem lại danh sách tất cả thông báo đã nhận, để tôi không bỏ lỡ thông tin quan trọng khi không nhìn vào màn hình đúng lúc.

#### Tiêu Chí Chấp Nhận

1. THE Notification_Center SHALL hiển thị danh sách Notification_Item sắp xếp theo thời gian nhận mới nhất trước.
2. THE Notification_Badge SHALL hiển thị số lượng Notification_Item chưa đọc; WHEN số lượng bằng 0, THE Notification_Badge SHALL ẩn chỉ số.
3. WHEN khách hàng mở Notification_Center, THE Notification_Center SHALL đánh dấu tất cả Notification_Item hiển thị là đã đọc và cập nhật Notification_Badge về 0.
4. WHEN khách hàng nhấn vào một Notification_Item liên quan đến đơn hàng, THE Customer_Portal SHALL điều hướng đến trang chi tiết đơn hàng tương ứng.
5. THE Notification_Center SHALL lưu trữ tối đa 50 Notification_Item gần nhất trong bộ nhớ phiên làm việc (session); WHEN số lượng vượt quá 50, THE Notification_Center SHALL xóa Notification_Item cũ nhất.
6. WHEN khách hàng tải lại trang hoặc đóng trình duyệt, THE Notification_Center SHALL xóa toàn bộ Notification_Item (không lưu persistent).

---

### Yêu Cầu 6: Cập Nhật Dữ Liệu Tự Động

**User Story:** Là khách hàng, tôi muốn dữ liệu trên màn hình tự động cập nhật khi có thay đổi, để tôi không cần tải lại trang để thấy thông tin mới nhất.

#### Tiêu Chí Chấp Nhận

1. WHEN Realtime_Service nhận được sự kiện thay đổi trạng thái đơn hàng, THE Order_View SHALL tự động cập nhật trạng thái của đơn hàng tương ứng trong danh sách và trang chi tiết nếu đang hiển thị.
2. WHEN Realtime_Service nhận được sự kiện cập nhật tiến độ sản xuất, THE Progress_Timeline SHALL tự động cập nhật trạng thái công đoạn tương ứng nếu đang hiển thị.
3. WHEN Realtime_Service nhận được sự kiện tạo phiếu giao hàng mới, THE Shipment_View SHALL tự động thêm phiếu giao hàng mới vào đầu danh sách nếu đang hiển thị.
4. IF khách hàng đang ở trang khác (không phải trang liên quan đến sự kiện), THE Realtime_Service SHALL chỉ tạo Notification_Item mà không cập nhật UI của trang đó.

---

### Yêu Cầu 7: Bảo Mật và Cách Ly Dữ Liệu Realtime

**User Story:** Là quản trị viên hệ thống, tôi muốn đảm bảo khách hàng chỉ nhận thông báo về dữ liệu của chính họ qua kênh realtime, để tránh rò rỉ thông tin giữa các khách hàng.

#### Tiêu Chí Chấp Nhận

1. THE Realtime_Service SHALL đăng ký Realtime_Channel với filter `customer_id=eq.{customer_id}` trên bảng `orders` và `shipments` để Supabase chỉ gửi sự kiện liên quan đến khách hàng đó.
2. THE Realtime_Service SHALL đăng ký Realtime_Channel trên bảng `order_progress` với filter theo `order_id` thuộc về khách hàng đang đăng nhập.
3. IF payload nhận được từ Realtime_Channel chứa `customer_id` không khớp với khách hàng đang đăng nhập, THEN THE Realtime_Service SHALL bỏ qua payload đó và không tạo Notification_Item.
4. WHEN khách hàng đăng xuất, THE Realtime_Service SHALL hủy tất cả Realtime_Channel trước khi session bị xóa để tránh nhận sự kiện sau khi đăng xuất.
