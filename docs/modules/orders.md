# Module Đơn Hàng

## Vai trò

Là trung tâm của nghiệp vụ bán hàng. Module này nhận nhu cầu từ khách hàng và liên kết với tiến độ sản xuất, shipment và payment.

## Mục tiêu

- Tạo đơn hàng
- Quản lý nhiều dòng hàng
- Theo dõi due date và trạng thái
- Làm đầu mối cho shipment và payment

## Dữ liệu chính

- Số đơn hàng
- Khách hàng
- Ngày đặt
- Ngày giao dự kiến
- Tổng tiền
- Đã thu
- Trạng thái
- Danh sách item

## Màn hình cần có

- Danh sách đơn hàng
- Form tạo/sửa đơn hàng
- Chi tiết đơn hàng

## Phân tích chức năng chi tiết

### 1. Tạo và quản lý order header

- Header là phần chứa khách hàng, ngày đặt, ngày giao, ghi chú và trạng thái đơn.
- Đây là lớp dữ liệu tổng quát để các module sau bám vào.

Trạng thái hiện tại:

- Đã có bảng `orders`.
- Đã có schema Zod cho header ở `orders.module.ts`.
- Chưa có list/detail/form thực tế.

### 2. Quản lý order items

- Mỗi đơn hàng có nhiều dòng vải khác nhau theo loại, màu, số lượng và đơn giá.
- Đây là phần quan trọng nhất vì shipment và payment thường quy chiếu lại từ đây.

Trạng thái hiện tại:

- Đã có bảng `order_items`.
- Schema frontend đã hỗ trợ repeater `items`.
- Chưa có UI line editor và chưa có tính tổng theo item/header ở frontend.

### 3. Theo dõi tiến độ và giao hàng theo đơn

- Orders là điểm nối với `order_progress`, `shipments` và `payments`.
- Hệ thống đã định hướng cho phép giao nhiều lần trên một đơn.

Trạng thái hiện tại:

- Quan hệ DB đã có đủ.
- Chưa có business flow confirm order, reserve hàng hay tạo tiến độ tự động.

## Business rules

- Mỗi đơn hàng phải có ít nhất 1 item.
- Khách hàng phải tồn tại và đang hoạt động.
- Đơn đã complete hoặc cancelled không được sửa tự do.
- Shipment không được vượt quantity của order.

## Điểm mạnh

- Thiết kế header/item đúng chuẩn chứng từ bán hàng.
- Có `paid_amount` trên order để theo dõi công nợ tổng quan.
- Có generated `amount` ở item level trong DB.
- Schema frontend đã hỗ trợ form repeater ngay từ đầu.
- Quan hệ với progress, shipments, payments rất rõ ràng.

## Điểm yếu

- Chưa có CRUD thực tế.
- Chưa có due-date board hoặc overdue list.
- Chưa có reserve flow với kho thành phẩm.
- Chưa có logic state transition rõ ràng ở frontend.
- Chưa có detail page để nhìn toàn bộ vòng đời của đơn hàng.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL tables `orders` và `order_items`.
- Enum `order_status`.
- Generated column `amount` ở `order_items`.
- FK tới `customers` và `profiles`.
- RLS và policies theo role.
- Zod validation trong `orders.module.ts`.

## Đánh giá tổng thể

Đây là module cốt lõi của luồng bán hàng và đã có schema đủ tốt để phát triển tiếp. Khó khăn chính không nằm ở dữ liệu mà ở điều phối luồng nghiệp vụ giữa order, tiến độ, shipment và công nợ.

## Phụ thuộc

- Customers
- Order Progress
- Shipments
- Payments
- Reports

## File liên quan

- src/features/orders/OrdersPage.tsx
- src/features/orders/orders.module.ts
