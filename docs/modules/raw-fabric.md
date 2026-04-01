# Module Kho Vải Mộc

## Vai trò

Quản lý cuộn vải mộc sau công đoạn dệt, trước khi chuyển thành vải thành phẩm.

## Mục tiêu

- Nhập cuộn vải mộc vào kho, mỗi cuộn vải mộc có cân nặng khác nhau
- Theo dõi chất lượng A/B/C
- Gắn vị trí kho
- Truy vết nguồn gốc từ sợi nếu cần

## Dữ liệu chính

- Mã cuộn
- Loại vải
- Màu
- Khổ vải
- Độ dài
- Trọng lượng( cân nặng )
- Chất lượng
- Vị trí kho
- Trạng thái

## Màn hình cần có

- Danh sách cuộn vải mộc
- Form tạo/sửa cuộn
- Bộ lọc theo chất lượng, loại vải, trạng thái

## Phân tích chức năng chi tiết

### 1. Nhập cuộn vải mộc

- Đây là bước chuyển từ nguyên liệu sợi sang bán thành phẩm dệt.
- Mỗi cuộn cần có mã riêng để phục vụ truy vết và kiểm kê.

Trạng thái hiện tại:

- Đã có bảng `raw_fabric_rolls`.
- Đã có schema Zod cho `rollNumber`, `fabricType`, `qualityGrade`, `warehouseLocation`.
- Chưa có UI nhập kho thực tế.

### 2. Quản lý chất lượng và thông số

- Module cần lưu chất lượng A/B/C, khổ, độ dài, trọng lượng và vị trí kho.
- Đây là dữ liệu quan trọng để quyết định có chuyển tiếp sang thành phẩm hay không.

Trạng thái hiện tại:

- Database đã có check constraint cho `quality_grade`.
- Chưa có quy trình kiểm phẩm trên UI.

### 3. Truy vết theo receipt nguồn

- Một cuộn vải mộc có thể tham chiếu về `yarn_receipt_id`.
- Đây là nền tảng tốt cho việc truy xuất nguồn nguyên liệu và đối chiếu sản xuất.

Trạng thái hiện tại:

- Quan hệ với `yarn_receipts` đã có.
- Chưa có màn hình trace đầy đủ.

## Business rules

- Mã cuộn phải duy nhất.
- Chất lượng chỉ được A/B/C.
- Cuộn đã chuyển sang thành phẩm không được sửa tự do.

## Điểm mạnh

- Thiết kế theo roll-level rất phù hợp với kho vải.
- Có đủ trường phục vụ truy vết và kiểm kê.
- Có index theo trạng thái, loại vải và receipt nguồn.
- Có thể nối tốt sang finished fabric.

## Điểm yếu

- Chưa có quy trình kiểm phẩm hoặc chuyển trạng thái thực tế.
- Chưa có inventory movement riêng ngoài trạng thái cuộn.
- Chưa có UI tìm kiếm/scan mã cuộn.
- Chưa có logic khóa sửa sau khi cuộn đã được chuyển tiếp.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- PostgreSQL table `raw_fabric_rolls`.
- Enum `roll_status`.
- Check constraint cho `quality_grade`.
- FK về `yarn_receipts`.
- RLS và policies theo role.
- Zod validation trong `raw-fabric.module.ts`.

## Đánh giá tổng thể

Module này có dữ liệu nền tương đối tốt cho một kho theo cuộn. Khó khăn chính không nằm ở schema mà nằm ở việc thiết kế UI nhập kho, kiểm phẩm và truy vết sao cho thao tác nhanh nhưng vẫn giữ chính xác dữ liệu.

## Phụ thuộc

- Yarn Receipts
- Finished Fabric
- Inventory

## File liên quan

- src/features/raw-fabric/RawFabricPage.tsx
- src/features/raw-fabric/raw-fabric.module.ts
