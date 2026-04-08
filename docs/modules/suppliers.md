# Module Nhà Cung Cấp

## Vai trò

Quản lý danh mục nhà cung cấp cho sợi, nhuộm, phụ liệu và các dịch vụ liên quan đến sản xuất.

## Mục tiêu

- CRUD nhà cung cấp
- Phân loại theo category
- Dùng lại trong luồng nhập sợi và kho

## Dữ liệu chính

- Mã nhà cung cấp
- Tên nhà cung cấp
- Category
- Số điện thoại
- Người liên hệ
- Địa chỉ
- Mã số thuế
- Trạng thái

## Màn hình cần có

- Danh sách nhà cung cấp
- Form tạo/sửa
- Filter theo category và status

## Phân tích chức năng chi tiết

### 1. Quản lý danh mục nhà cung cấp

- Module này lưu danh sách nguồn cung cho toàn bộ chuỗi nghiệp vụ nhập nguyên liệu và gia công.
- Dữ liệu cần ổn định vì nhiều chứng từ sẽ tham chiếu lại theo thời gian.

Trạng thái hiện tại:

- Đã có bảng `suppliers`.
- Đã có schema Zod với `category`, `contactPerson`, `status`.
- Chưa có CRUD frontend thật.

### 2. Phân loại theo nghiệp vụ

- Category giúp tách nhà cung cấp sợi, nhuộm, phụ liệu hoặc nhóm khác.
- Đây là nền để lọc dữ liệu và tái sử dụng đúng ngữ cảnh trong phiếu nhập.

Trạng thái hiện tại:

- Đã có enum `supplier_category` trong database.
- Đã có filter field ở schema frontend.
- Chưa có UI filter thật và chưa có quick picker theo loại.

### 3. Tái sử dụng dữ liệu trong chuỗi kho

- Suppliers sẽ được dùng lại trong Yarn Receipts, Raw Fabric và các luồng nhập khác.
- Nếu dữ liệu nhà cung cấp không sạch sẽ làm giảm khả năng truy vết nguồn gốc hàng hóa.

Trạng thái hiện tại:

- Kiến trúc phụ thuộc đã đúng.
- Chưa có lookup component dùng chung.

## Business rules

- Mã nhà cung cấp phải duy nhất.
- Category nằm trong tập được cho phép.
- Nhà cung cấp inactive không được sử dụng cho receipt mới.

## Điểm mạnh

- Đã có enum category rõ ràng ở DB và frontend.
- Có unique code và index cho tên, code, category.
- Có schema Zod phù hợp cho form CRUD.
- Có thể tái sử dụng mạnh trong các module kho.

## Điểm yếu

- Chưa có CRUD thực tế.
- Chưa có đánh giá độ tin cậy, lead time hay lịch sử giao dịch với nhà cung cấp.
- Chưa có autocomplete/picker dùng lại trong receipts.
- Chưa có màn hình chi tiết tổng hợp chứng từ theo nhà cung cấp.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL table `suppliers`.
- Enum `supplier_category`.
- Trigger `updated_at`.
- Index hỗ trợ tìm kiếm và lọc.
- RLS và policies theo role đã có.
- Zod validation ở `suppliers.module.ts`.

## Đánh giá tổng thể

Module này có mức độ hoàn thiện thiết kế tốt và có thể triển khai ngay sau Customers. Điểm giá trị lớn nhất là chuẩn hóa nguồn cung để phục vụ truy vết và kiểm soát đầu vào cho kho.

## Phụ thuộc

- Auth
- Yarn Receipts
- Raw Fabric

## File liên quan

- src/features/suppliers/SuppliersPage.tsx
- src/features/suppliers/suppliers.module.ts
