# Module Nhập Sợi

## Vai trò

Là điểm bắt đầu của luồng kho. Module này ghi nhận việc nhập sợi từ nhà cung cấp vào hệ thống.

## Mục tiêu

- Tạo phiếu nhập sợi
- Quản lý nhiều dòng hàng trong một phiếu
- Tính tổng giá trị phiếu nhập
- Làm nền cho kho vải mộc

## Dữ liệu chính

- Số phiếu nhập
- Nhà cung cấp
- Ngày nhập
- Ghi chú
- Danh sách loại sợi
- Số lượng
- Đơn giá

## Màn hình cần có

- Danh sách phiếu nhập
- Form tạo phiếu nhập có repeater line items
- Chi tiết phiếu nhập

## Phân tích chức năng chi tiết

### 1. Tạo phiếu nhập sợi

- Mỗi phiếu nhập là một chứng từ đầu vào cho kho nguyên liệu.
- Phiếu nhập phải gắn với nhà cung cấp và ngày nhập cụ thể.

Trạng thái hiện tại:

- Đã có bảng `yarn_receipts`.
- Đã có schema form với `receiptNumber`, `supplierId`, `receiptDate`, `items`.
- Chưa có form tạo chứng từ thực tế.

### 2. Quản lý line items

- Mỗi phiếu nhập có nhiều dòng tương ứng nhiều loại sợi hoặc màu sợi.
- Dòng hàng cần lưu số lượng, đơn giá và tự tính thành tiền.

Trạng thái hiện tại:

- Đã có `yarn_receipt_items`.
- Database có cột `amount` generated từ `quantity * unit_price`.
- Schema frontend đã yêu cầu ít nhất một item.
- Chưa có UI repeater thật.

### 3. Gắn với nhà cung cấp và truy xuất đầu vào

- Phiếu nhập là đầu mối truy xuất nguồn nguyên liệu.
- Từ receipt có thể lần sang nhà cung cấp và về sau sang vải mộc.

Trạng thái hiện tại:

- Quan hệ FK với `suppliers` đã có.
- Chưa có quick select supplier và chưa có detail flow.

## Business rules

- Mỗi phiếu nhập phải có ít nhất 1 dòng hàng.
- Số lượng phải > 0.
- Đơn giá phải >= 0.
- Không được confirm nếu thiếu nhà cung cấp.

## Điểm mạnh

- Thiết kế header/item tách bạch đúng chuẩn chứng từ.
- Có generated amount ở DB, giúp tránh lệch số liệu tính toán.
- Có index theo nhà cung cấp, ngày và trạng thái.
- Zod schema đã mô tả đúng form có repeater.

## Điểm yếu

- Chưa có form line item thực tế.
- Chưa có tổng tiền realtime ở UI.
- Chưa có autosave draft hay retry offline như định hướng.
- Chưa ghi inventory movement thật sau khi confirm.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL tables `yarn_receipts` và `yarn_receipt_items`.
- Enum `doc_status`.
- Generated column `amount`.
- FK tới `suppliers` và `profiles`.
- RLS trên cả header và items.
- Zod validation trong `yarn-receipts.module.ts`.

## Đánh giá tổng thể

Đây là module giao dịch đầu tiên của luồng kho và có thiết kế DB khá chắc. Khi triển khai UI, cần ưu tiên trải nghiệm nhập nhanh và tính tổng chính xác vì đây là dữ liệu nguồn cho toàn bộ chuỗi sản xuất sau đó.

## Phụ thuộc

- Suppliers
- Inventory
- Raw Fabric

## File liên quan

- src/features/yarn-receipts/YarnReceiptsPage.tsx
- src/features/yarn-receipts/yarn-receipts.module.ts
