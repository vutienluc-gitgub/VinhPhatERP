# Module Khách Hàng

## Vai trò

Module này quản lý master data khách hàng và cung cấp dữ liệu đầu vào cho đơn hàng, xuất hàng, thu tiền và báo cáo công nợ.

## Mục tiêu

- Tạo, sửa, xem, khóa khách hàng
- Tìm kiếm theo tên, mã, số điện thoại
- Dùng lại trong order và payment lookup

## Dữ liệu chính

- Mã khách hàng
- Tên khách hàng
- Số điện thoại
- Email
- Địa chỉ
- Mã số thuế
- Người liên hệ
- Trạng thái active/inactive

## Màn hình cần có

- Danh sách khách hàng
- Form tạo/sửa khách hàng
- Chi tiết khách hàng

## Phân tích chức năng chi tiết

### 1. Quản lý hồ sơ khách hàng

- Module này là nơi lưu dữ liệu chuẩn của khách hàng để dùng chung cho toàn hệ thống.
- Mỗi khách hàng cần có mã riêng, tên, thông tin liên hệ và trạng thái hoạt động.

Trạng thái hiện tại:

- Đã có bảng `customers` trong database.
- Đã có schema validate ở `src/features/customers/customers.module.ts`.
- Chưa có CRUD thực tế ở frontend.

### 2. Tìm kiếm và lọc khách hàng

- Người dùng cần tìm nhanh khách hàng theo tên, mã hoặc số điện thoại.
- Đây là tính năng quan trọng vì khách hàng sẽ được chọn lại nhiều lần trong orders và payments.

Trạng thái hiện tại:

- Đã có `CustomersFilters` trong code.
- Database đã có index cho `code`, `status` và GIN index theo `name`.
- Chưa có UI search/filter thực tế.

### 3. Tái sử dụng dữ liệu ở các module khác

- Customers là nguồn dữ liệu đầu vào cho Orders, Payments, Reports và một phần Shipments.
- Dữ liệu khách hàng cần ổn định để tránh nhập trùng và lệch công nợ.

Trạng thái hiện tại:

- Thiết kế phụ thuộc đã đúng.
- Chưa có lookup/autocomplete dùng chung.

## Business rules

- Mã khách hàng phải duy nhất.
- Khách hàng inactive không được chọn cho đơn mới nếu không có quyền đặc biệt.
- Email nếu có phải hợp lệ.

## Điểm mạnh

- Có schema Zod khá gọn và đúng trọng tâm cho CRUD cơ bản.
- Có tách `status` rõ ràng để quản lý khóa mềm dữ liệu.
- Database đã có unique key cho `code`.
- Có index hỗ trợ search và filter từ sớm.
- Phù hợp để làm module CRUD đầu tiên trong dự án.

## Điểm yếu

- Chưa có UI CRUD thực tế.
- Chưa có phân trang, tìm kiếm và lọc ở frontend.
- Chưa có kiểm tra trùng dữ liệu ở mức trải nghiệm người dùng.
- Chưa có màn hình chi tiết công nợ theo khách hàng.
- Chưa có lookup dùng chung cho Orders và Payments.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL table `customers`.
- `active_status` enum cho trạng thái dữ liệu.
- Trigger `updated_at`.
- GIN index cho tên khách hàng để hỗ trợ tìm kiếm gần đúng.
- RLS đã được bật trong migration.
- Policy read/write theo role đã có ở tầng database.
- Zod validation trong `customers.module.ts`.

## Đánh giá tổng thể

Đây là module có độ khó thấp nhưng giá trị nền rất cao. Thiết kế dữ liệu hiện tại đủ tốt để bắt đầu CRUD thật mà không phải sửa kiến trúc. Điểm còn thiếu chủ yếu nằm ở frontend và trải nghiệm nhập/chọn khách hàng.

## Phụ thuộc

- Auth
- Orders
- Payments
- Reports

## File liên quan

- src/features/customers/CustomersPage.tsx
- src/features/customers/customers.module.ts
