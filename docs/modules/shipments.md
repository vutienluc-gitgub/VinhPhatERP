# Module Xuất Hàng

## Vai trò

Quản lý quá trình giao hàng từ đơn hàng ra khỏi tồn kho thành phẩm.

## Mục tiêu

- Tạo shipment từ order
- Chọn cuộn thành phẩm để xuất
- Hỗ trợ giao từng phần
- Cập nhật tồn kho chính xác

## Dữ liệu chính

- Số phiếu xuất
- Đơn hàng
- Khách hàng
- Ngày giao
- Địa chỉ giao
- Carrier
- Tracking
- Danh sách cuộn xuất
- Trạng thái shipment

## Màn hình cần có

- Danh sách shipment
- Form tạo shipment từ order
- Chi tiết shipment

## Phân tích chức năng chi tiết

### 1. Tạo shipment từ order

- Shipment không nên là chứng từ nhập tay độc lập, mà nên được sinh từ order để bám đúng số lượng còn lại.
- Hệ thống cần hỗ trợ giao một phần nếu khách chưa nhận toàn bộ.

Trạng thái hiện tại:

- Đã có bảng `shipments` và `shipment_items`.
- Schema frontend đã có header + items.
- Chưa có flow tạo shipment thực tế từ order.

### 2. Chọn cuộn thành phẩm để xuất

- Shipment ở dự án này theo hướng roll-level, nghĩa là cần biết cuộn nào đã xuất cho đơn nào.
- Đây là điểm then chốt để giữ truy vết tồn kho.

Trạng thái hiện tại:

- `shipment_items` có `finished_roll_id`.
- Chưa có UI picker cuộn thành phẩm.
- Chưa có logic khóa cuộn sau khi xuất.

### 3. Đồng bộ với tồn kho và trạng thái giao hàng

- Shipment confirmed là điểm làm giảm tồn thực tế.
- Trạng thái shipment giúp theo dõi chuẩn bị, đang giao, đã giao hoặc trả hàng.

Trạng thái hiện tại:

- Đã có enum `shipment_status`.
- Chưa có rule confirm shipment trừ kho thật.
- Chưa có workflow partial shipment trên UI.

## Business rules

- Không được xuất vượt tồn hoặc vượt số lượng còn lại của order.
- Shipment confirmed là điểm trừ tồn thực tế.
- Hỗ trợ partial shipment cho cùng một order.

## Điểm mạnh

- Thiết kế shipment gắn trực tiếp với order và customer.
- Có hỗ trợ roll-level trace qua `finished_roll_id`.
- Có enum trạng thái shipment đủ dùng cho MVP.
- Có nền tốt để mở rộng sang proof of delivery hoặc in phiếu giao hàng.

## Điểm yếu

- Chưa có rule trừ kho thực tế sau confirm.
- Chưa có khóa chỉnh sửa sau khi shipment đã confirm.
- Chưa có màn hình chọn cuộn từ kho thành phẩm.
- Chưa có logic chống xuất trùng giữa nhiều shipment song song.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL tables `shipments` và `shipment_items`.
- Enum `shipment_status`.
- FK tới `orders`, `customers`, `finished_fabric_rolls`.
- RLS và policies theo role.
- Zod validation trong `shipments.module.ts`.

## Đánh giá tổng thể

Đây là module nhạy cảm vì nó là điểm tác động trực tiếp lên tồn kho thực tế. Thiết kế hiện tại đúng hướng, nhưng việc triển khai cần rất cẩn thận để tránh xuất trùng, xuất vượt và lệch tồn.

## Phụ thuộc

- Orders
- Finished Fabric
- Inventory
- Payments

## File liên quan

- src/features/shipments/ShipmentsPage.tsx
- src/features/shipments/shipments.module.ts

## Tính năng mở rộng

- [Gửi chứng từ sau xuất kho qua Zalo](./zalo-document-delivery.md)
