# Module Báo Cáo

## Vai trò

Tổng hợp các chỉ số vận hành và thương mại để chủ doanh nghiệp ra quyết định.

## Mục tiêu

- Báo cáo doanh thu
- Báo cáo công nợ
- Báo cáo tồn kho
- Báo cáo đơn trễ hạn và tiến độ sản xuất

## Dữ liệu chính

- Doanh thu theo kỳ
- Công nợ theo khách hàng
- Tồn kho theo loại vải
- Đơn hàng sắp đến hạn và trễ hạn
- Tiến độ theo công đoạn

## Màn hình cần có

- Dashboard KPI
- Filter theo thời gian
- Các report slice theo domain

## Phân tích chức năng chi tiết

### 1. Dashboard KPI tổng hợp

- Đây là lớp nhìn tổng quan cho chủ doanh nghiệp hoặc quản lý.
- KPI cần ưu tiên các chỉ số thực dụng: doanh thu, công nợ, tồn kho, đơn trễ, tiến độ.

Trạng thái hiện tại:

- Đã có metadata report filters ở frontend.
- Chưa có dashboard KPI thực tế.

### 2. Báo cáo doanh thu và công nợ

- Doanh thu cần bám theo orders và payments.
- Công nợ cần nhìn được cả tổng và chi tiết theo khách hàng.

Trạng thái hiện tại:

- DB đã có `v_order_summary`.
- Chưa có report slice sử dụng view này trên frontend.

### 3. Báo cáo tồn kho và tiến độ

- Tồn kho cần lấy từ inventory views và trạng thái hàng thực tế.
- Tiến độ cần lấy từ `order_progress` để hỗ trợ điều độ và cảnh báo trễ hạn.

Trạng thái hiện tại:

- Đã có views inventory cơ bản.
- Chưa có filter, biểu đồ hay bảng tổng hợp thực tế.

## Business rules

- Báo cáo phải dùng dữ liệu từ giao dịch thật.
- KPI trên mobile phải dễ đọc, chart không thay thế số liệu cốt lõi.
- Số liệu công nợ phải khớp với payments và orders.

## Điểm mạnh

- Đã có hướng đi đúng: dùng SQL views + React Query.
- Có filter schema phù hợp cho dashboard/report.
- Có sẵn `v_order_summary`, `v_raw_fabric_inventory`, `v_finished_fabric_inventory`.
- Phù hợp để phát triển theo từng widget nhỏ.

## Điểm yếu

- Chưa có báo cáo thực tế nào ở frontend.
- Chưa có layer query/report service riêng.
- Chưa có chuẩn hóa chỉ số nào là nguồn sự thật cuối cùng.
- Chưa có export Excel/PDF, dù đây chưa phải blocker của MVP.

## Công nghệ và kiểm soát dữ liệu đang áp dụng

- SQL views trong Postgres.
- React Query đã sẵn nền trong `AppProviders`.
- Zod filter schema trong `reports.module.ts`.
- RLS ở các bảng nguồn dữ liệu.

## Đánh giá tổng thể

Reports là module tổng hợp cuối chuỗi, nên hiện tại đúng là đang ít hoàn thiện hơn các module khác. Tuy vậy, nền dữ liệu đã được chuẩn bị khá tốt. Khi các module giao dịch đi vào hoạt động, Reports có thể được dựng theo từng slice nhỏ mà không cần thay đổi kiến trúc lớn.

## Phụ thuộc

- Orders
- Shipments
- Payments
- Inventory
- Order Progress

## File liên quan

- src/features/reports/ReportsPage.tsx
- src/features/reports/reports.module.ts
