# Module Kho Vải Thành Phẩm

## Vai trò

Quản lý cuộn vải thành phẩm sau khi xử lý xong và sẵn sàng cho reserve hoặc xuất hàng.

## Mục tiêu

- Nhập cuộn thành phẩm
- Mapping từ cuộn vải mộc sang thành phẩm
- Quản lý stock theo roll-level
- Làm nguồn cho shipment

## Dữ liệu chính

- Mã cuộn thành phẩm
- Cuộn mộc nguồn
- Loại vải
- Màu
- Khổ vải
- Độ dài
- Chất lượng
- Trạng thái `in_stock`, `reserved`, `shipped`

## Màn hình cần có

- Danh sách tồn kho thành phẩm
- Form tạo/sửa cuộn thành phẩm
- Bộ lọc theo loại vải, màu, trạng thái

## Phân tích chức năng chi tiết

### 1. Nhập cuộn thành phẩm

- Đây là nguồn hàng thực tế phục vụ đơn bán và xuất kho.
- Dữ liệu phải đủ chính xác để tránh giữ hàng sai hoặc xuất nhầm cuộn.

Trạng thái hiện tại:

- Đã có bảng `finished_fabric_rolls`.
- Đã có schema frontend cho `rollNumber`, `rawRollId`, `fabricType`, `colorName`, `qualityGrade`.
- Chưa có flow nhập kho thực tế.

### 2. Mapping từ vải mộc sang thành phẩm

- Mỗi cuộn thành phẩm có thể liên kết lại cuộn mộc nguồn.
- Điều này rất quan trọng cho truy vết chất lượng và nguyên nhân lỗi sau bán hàng.

Trạng thái hiện tại:

- FK `raw_roll_id` đã có ở DB.
- Chưa có màn hình trace chi tiết hoặc flow chuyển đổi tự động.

### 3. Quản lý trạng thái tồn kho

- Module này cần hỗ trợ ít nhất ba trạng thái thực dụng: còn hàng, đã giữ, đã xuất.
- Đây là điểm giao với Orders, Shipments và Inventory.

Trạng thái hiện tại:

- DB đã có `roll_status`.
- Frontend mới chỉ mô hình hóa thông tin cần thiết, chưa có business flow reserve/unreserve.

## Business rules

- Roll-level là nguồn sự thật cho shipment.
- Cuộn reserved không được dùng cho đơn khác.
- Cuộn shipped không được quay lại editable state.

## Điểm mạnh

- Thiết kế roll-level rất phù hợp với bài toán truy vết kho dệt may.
- Có quan hệ với raw roll để truy xuất nguồn gốc.
- Có enum trạng thái dùng chung với toàn hệ thống.
- Có nền tốt cho shipment và reservation.

## Điểm yếu

- Chưa có flow reserve/unreserve thật.
- Chưa có logic kiểm tra xung đột giữa nhiều đơn cùng giữ hàng.
- Chưa có UI inventory cards hay tìm kiếm theo màu/loại vải.
- Chưa có policy business cụ thể cho đổi trạng thái cuộn.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL table `finished_fabric_rolls`.
- Enum `roll_status`.
- FK `raw_roll_id`.
- RLS và policies theo role.
- Zod validation trong `finished-fabric.module.ts`.

## Đánh giá tổng thể

Đây là module rất quan trọng vì nó là điểm nối giữa kho và bán hàng. Thiết kế schema hiện tại là đúng hướng; phần phức tạp sẽ nằm ở logic reserve, trace và tránh xuất trùng cuộn.

## Phụ thuộc

- Raw Fabric
- Orders
- Shipments
- Inventory

## File liên quan

- src/features/finished-fabric/FinishedFabricPage.tsx
- src/features/finished-fabric/finished-fabric.module.ts
