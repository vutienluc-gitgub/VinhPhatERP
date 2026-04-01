# Module Tồn Kho

## Vai trò

Tổng hợp hiện trạng tồn kho và cung cấp khả năng điều chỉnh tồn cho vận hành.

## Mục tiêu

- Hiển thị tồn sợi, vải mộc, vải thành phẩm
- Hiển thị low-stock alerts
- Điều chỉnh tồn kho có lý do và lịch sử

## Dữ liệu chính

- Loại hàng tồn
- Reference item
- Quantity delta
- Kiểu điều chỉnh
- Lý do
- Ngày điều chỉnh

## Màn hình cần có

- Dashboard tồn kho tổng hợp
- Stock list chi tiết
- Form inventory adjustment

## Phân tích chức năng chi tiết

### 1. Hiển thị tồn kho tổng hợp

- Module này cần nhìn được tồn ở ba nhóm chính: sợi, vải mộc và vải thành phẩm.
- Ngoài số lượng, hệ thống còn cần phân biệt tồn khả dụng và tồn đã giữ.

Trạng thái hiện tại:

- Đã có schema frontend cho inventory adjustment.
- Đã có view `v_raw_fabric_inventory` và `v_finished_fabric_inventory` ở DB.
- Chưa có dashboard tồn thực tế trên UI.

### 2. Điều chỉnh tồn kho

- Điều chỉnh tồn dùng khi kiểm kê phát hiện lệch hoặc cần ghi nhận nghiệp vụ đặc biệt.
- Mỗi lần điều chỉnh phải có lý do để đảm bảo kiểm soát nội bộ.

Trạng thái hiện tại:

- Đã có bảng `inventory_adjustments`.
- Đã có enum `adjustment_type` và `inventory_item_type`.
- Chưa có form điều chỉnh tồn thực tế.

### 3. Cảnh báo tồn thấp và sức khỏe kho

- Inventory không chỉ là số lượng, mà còn là nơi phát hiện rủi ro thiếu hàng hoặc ứ hàng.
- Dữ liệu này rất quan trọng cho điều phối mua hàng, sản xuất và bán hàng.

Trạng thái hiện tại:

- Metadata frontend đã định hướng `Low stock`.
- Chưa có logic cảnh báo và chưa có badge dữ liệu thật trên navigation.

## Business rules

- Mọi điều chỉnh tồn phải có lý do.
- Không làm sai lệch nguồn sự thật của shipment và receipts.
- Cần tách tồn có sẵn và tồn đã reserve.

## Điểm mạnh

- Đã có mô hình `inventory_adjustments` tách riêng, phù hợp với audit.
- Đã có enum rõ ràng cho loại hàng và kiểu điều chỉnh.
- Có view inventory ở DB để tái sử dụng cho dashboard.
- Thiết kế đúng hướng theo movement và reservation.

## Điểm yếu

- Chưa có inventory dashboard thật.
- Chưa có unified stock service gộp dữ liệu từ receipts, rolls, shipments và adjustments.
- Chưa có cảnh báo low stock, aging stock hoặc over-reserved.
- Chưa có inventory history theo reference item trên UI.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL table `inventory_adjustments`.
- Enums `inventory_item_type` và `adjustment_type`.
- Views `v_raw_fabric_inventory` và `v_finished_fabric_inventory`.
- RLS và policies theo role.
- Zod validation trong `inventory.module.ts`.

## Đánh giá tổng thể

Inventory là module tổng hợp và sẽ chỉ thật sự mạnh khi các module giao dịch trước nó đã chạy. Thiết kế hiện tại đúng hướng nhưng cần thêm lớp tính toán và hiển thị để biến dữ liệu rời rạc thành bức tranh tồn kho dùng được cho vận hành.

## Phụ thuộc

- Yarn Receipts
- Raw Fabric
- Finished Fabric
- Shipments
- Reports

## File liên quan

- src/features/inventory/InventoryPage.tsx
- src/features/inventory/inventory.module.ts
