# Module Tiến Độ Đơn Hàng

## Vai trò

Theo dõi quá trình sản xuất của từng đơn hàng qua các công đoạn chính.

## Mục tiêu

- Hiển thị timeline 7 công đoạn
- Cập nhật trạng thái theo stage
- Theo dõi chậm tiến độ và sẵn sàng giao hàng

## Dữ liệu chính

- Đơn hàng
- Stage
- Trạng thái
- Planned date
- Actual date
- Notes

## Màn hình cần có

- Timeline tiến độ theo đơn
- Board hoặc list theo stage
- Chi tiết lịch sử cập nhật

## Phân tích chức năng chi tiết

### 1. Theo dõi tiến độ theo stage

- Mỗi đơn hàng được chia thành 7 công đoạn từ warping đến packing.
- Mục tiêu là nhìn rõ đơn nào đang ở đâu trong dây chuyền.

Trạng thái hiện tại:

- Đã có bảng `order_progress`.
- Đã có enum `production_stage` và `stage_status`.
- Chưa có timeline thực tế trên UI.

### 2. Cập nhật trạng thái và thời gian thực tế

- Người dùng cần cập nhật stage đang chờ, đang làm, đã xong hoặc bỏ qua.
- Planned date và actual date là cơ sở để tính trễ hạn.

Trạng thái hiện tại:

- Schema frontend đã có đủ field.
- DB đã có unique `(order_id, stage)` để tránh trùng stage.
- Chưa có workflow cập nhật hay ghi lịch sử thay đổi.

### 3. Cấp dữ liệu cho báo cáo và giao hàng

- Progress là nguồn dữ liệu để báo cáo overdue, ready-to-ship và hiệu suất vận hành.
- Module này cũng hỗ trợ ưu tiên xử lý đơn gần đến hạn.

Trạng thái hiện tại:

- Thiết kế phụ thuộc đúng.
- Chưa có dashboard slice hay audit trail thực tế.

## Business rules

- Mỗi stage chỉ có 1 row cho một order.
- Thứ tự stage phải nhất quán.
- Actual date chỉ có ý nghĩa khi stage đã bắt đầu hoặc xong.

## Điểm mạnh

- Mô hình stage tách riêng khỏi orders là đúng hướng.
- Có unique key chống trùng stage.
- Có thể mở rộng tốt sang overdue reporting.
- Schema frontend đã đủ để làm form cập nhật trạng thái.

## Điểm yếu

- Chưa có timeline UI thực tế.
- Chưa có tự động tạo 7 dòng progress khi order được confirm.
- Chưa có audit log thay đổi trạng thái.
- Chưa có rule rõ cho stage dependency ở frontend.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL table `order_progress`.
- Enums `production_stage` và `stage_status`.
- Unique constraint `(order_id, stage)`.
- RLS và policies theo role.
- Zod validation trong `order-progress.module.ts`.

## Đánh giá tổng thể

Module này có thiết kế dữ liệu đúng và đủ cho MVP theo dõi tiến độ. Giá trị lớn nhất của nó nằm ở khả năng biến tiến độ sản xuất thành dữ liệu vận hành có thể đo lường, nhưng phần UI và automation hiện vẫn chưa được triển khai.

## Phụ thuộc

- Orders
- Reports

## File liên quan

- src/features/order-progress/OrderProgressPage.tsx
- src/features/order-progress/order-progress.module.ts
