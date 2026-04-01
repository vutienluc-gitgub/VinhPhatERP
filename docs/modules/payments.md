# Module Thu Tiền Và Công Nợ

## Vai trò

Quản lý phiếu thu, lịch sử thanh toán và số dư công nợ của khách hàng.

## Mục tiêu

- Tạo phiếu thu tiền
- Theo dõi đã thu và còn nợ
- Liên kết payment với order và customer

## Dữ liệu chính

- Số phiếu thu
- Đơn hàng
- Khách hàng
- Ngày thu
- Số tiền
- Phương thức thanh toán
- Số tham chiếu

## Màn hình cần có

- Danh sách payment
- Form tạo phiếu thu
- Tổng hợp công nợ theo khách hàng

## Phân tích chức năng chi tiết

### 1. Tạo phiếu thu tiền

- Module này ghi nhận từng lần khách thanh toán, dù là trả đủ hay trả từng phần.
- Payment phải gắn đúng order và customer để tránh lệch công nợ.

Trạng thái hiện tại:

- Đã có bảng `payments`.
- Đã có schema frontend cho các trường chính.
- Chưa có form payment thực tế.

### 2. Đồng bộ số tiền đã thu trên đơn hàng

- `orders.paid_amount` là số tổng hợp quan trọng để biết đơn đã thu được bao nhiêu.
- Hệ thống hiện dùng trigger DB để tự động đồng bộ.

Trạng thái hiện tại:

- Trigger `sync_order_paid_amount()` đã có trong migration.
- Chưa có UI hiển thị realtime payment status và balance due.

### 3. Theo dõi công nợ

- Công nợ là chênh lệch giữa tổng tiền đơn và tổng tiền đã thu.
- Dữ liệu này sẽ được dùng lại trong reports và quản trị bán hàng.

Trạng thái hiện tại:

- DB đã có nền tốt.
- Chưa có widget công nợ hoặc màn hình debt aging.

## Business rules

- Số tiền thu phải > 0.
- `orders.paid_amount` phải đồng bộ với tổng payments.
- Cần hiển thị balance due rõ ràng theo order.

## Điểm mạnh

- Có trigger tự đồng bộ `paid_amount`, giảm rủi ro lệch dữ liệu.
- Có enum `payment_method` rõ ràng.
- Có schema Zod phù hợp cho form tạo phiếu thu.
- Dễ kết nối với orders và reports.

## Điểm yếu

- Chưa có quick receive flow từ order detail.
- Chưa có báo cáo công nợ theo khách hàng.
- Chưa có đối chiếu nhiều payment cho một order ở UI.
- Chưa có quy trình xử lý hoàn tiền hoặc điều chỉnh sai sót.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL table `payments`.
- Enum `payment_method`.
- Trigger `sync_order_paid_amount()`.
- FK tới `orders`, `customers`, `profiles`.
- RLS và policies theo role.
- Zod validation trong `payments.module.ts`.

## Đánh giá tổng thể

Module này có phần backend rất mạnh so với mức scaffold hiện tại, đặc biệt nhờ trigger đồng bộ công nợ. Khi triển khai UI, cần ưu tiên hiển thị rõ số đã thu, số còn nợ và lịch sử thanh toán để phục vụ bán hàng và quản trị dòng tiền.

## Phụ thuộc

- Orders
- Customers
- Reports

## File liên quan

- src/features/payments/PaymentsPage.tsx
- src/features/payments/payments.module.ts
