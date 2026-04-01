# VinhPhat App V2 — Plan triển khai Kho và Bán hàng

## Mục tiêu

Xây dựng MVP cho doanh nghiệp dệt may theo luồng nghiệp vụ cốt lõi:

- Nhập nguyên liệu
- Quản lý định mức nguyên liệu cấu thành vải mộc
- Quản lý kho vải mộc và vải thành phẩm
- Tạo và theo dõi đơn hàng
- Xuất hàng
- Thu tiền và theo dõi công nợ
- Báo cáo tồn kho và doanh thu

Ưu tiên triển khai theo thứ tự ít rủi ro nhất: foundation trước, master data sau, rồi đến luồng kho và bán hàng.

---

## Phase 1 — Foundation

### 1. Supabase và môi trường

Mục tiêu:

- Hoàn thiện Supabase client thật trong `src/services/supabase/client.ts`
- Cấu hình `.env.local`
- Áp migration `supabase/migrations/0001_initial_schema.sql`
- Xác nhận app kết nối được DB

Kết quả cần đạt:

- Có thể gọi Supabase từ frontend
- Dashboard không còn báo thiếu env
- Toàn bộ phase sau có nền tảng để chạy

### 2. Auth và phân quyền

Mục tiêu:

- Triển khai login/logout ở `src/features/auth/AuthPage.tsx`
- Bootstrap session trong `src/app/providers/AppProviders.tsx`
- Thêm route guard trong `src/app/router/routes.tsx`
- Ẩn/hiện navigation theo quyền ở `src/app/layouts/AppShell.tsx`

Phân quyền tối thiểu:

- `viewer`: chỉ xem
- `staff`: thao tác kho, đơn hàng, thanh toán
- `manager`: có quyền kiểm soát mạnh hơn
- `admin`: toàn quyền

Kết quả cần đạt:

- Người dùng đăng nhập được
- Session giữ được sau khi refresh
- Các route nhạy cảm được bảo vệ

---

## Phase 2 — Master Data

### 3. Khách hàng

File chính:

- `src/features/customers/CustomersPage.tsx`
- `src/features/customers/customers.module.ts`

Mục tiêu:

- CRUD khách hàng
- Search theo tên, mã, số điện thoại
- Filter theo trạng thái
- Có thể dùng lại để chọn khách trong orders và payments

Kết quả cần đạt:

- Có danh sách khách hàng
- Có form tạo/sửa khách hàng
- Có lookup ổn định cho các module sau

### 4. Nhà cung cấp

File chính:

- `src/features/suppliers/SuppliersPage.tsx`
- `src/features/suppliers/suppliers.module.ts`

Mục tiêu:

- CRUD nhà cung cấp
- Filter theo `category`
- Dùng lại trong yarn receipts

Kết quả cần đạt:

- Có master data nhà cung cấp
- Dùng được trong luồng nhập nguyên liệu

---

## Phase 3 — Luồng Kho

### 5. Nhập sợi

File chính:

- `src/features/yarn-receipts/YarnReceiptsPage.tsx`
- `src/features/yarn-receipts/yarn-receipts.module.ts`

Mục tiêu:

- Tạo phiếu nhập sợi
- Hỗ trợ nhiều line items
- Tính tổng tiền
- Lưu vào `yarn_receipts` và `yarn_receipt_items`

Kết quả cần đạt:

- Tạo được phiếu nhập sợi hoàn chỉnh
- Có thể tra cứu theo ngày và nhà cung cấp

### 6. Kho vải mộc

File chính:

- `src/features/raw-fabric/RawFabricPage.tsx`
- `src/features/raw-fabric/raw-fabric.module.ts`

Mục tiêu:

- Nhập cuộn vải mộc
- Gán chất lượng A/B/C
- Gán vị trí kho
- Liên kết với receipt nguồn nếu có

Kết quả cần đạt:

- Theo dõi được từng cuộn vải mộc
- Có thể truy vết từ nguyên liệu đầu vào

### 7. Kho vải thành phẩm

File chính:

- `src/features/finished-fabric/FinishedFabricPage.tsx`
- `src/features/finished-fabric/finished-fabric.module.ts`

Mục tiêu:

- Nhập cuộn vải thành phẩm
- Mapping từ raw roll sang finished roll
- Quản lý trạng thái `in_stock`, `reserved`, `shipped`

Kết quả cần đạt:

- Có tồn kho thành phẩm sẵn sàng cho đơn hàng
- Có khả năng reserve hàng cho shipment

---

## Phase 4 — Luồng Bán hàng

### 8. Đơn hàng

File chính:

- `src/features/orders/OrdersPage.tsx`
- `src/features/orders/orders.module.ts`

Mục tiêu:

- CRUD đơn hàng
- Quản lý item repeater
- Theo dõi trạng thái đơn và ngày giao dự kiến
- Tạo dữ liệu nền cho shipment và payment

Kết quả cần đạt:

- Có thể tạo đơn hàng nhiều dòng
- Theo dõi được tình trạng từng đơn

### 9. Tiến độ đơn hàng

File chính:

- `src/features/order-progress/OrderProgressPage.tsx`
- `src/features/order-progress/order-progress.module.ts`

Mục tiêu:

- Hiển thị timeline 7 công đoạn
- Cập nhật trạng thái `pending`, `in_progress`, `done`, `skipped`
- Theo dõi chậm tiến độ

Kết quả cần đạt:

- Có màn hình theo dõi tiến độ sản xuất
- Có dữ liệu phục vụ dashboard và báo cáo

### 10. Xuất hàng

File chính:

- `src/features/shipments/ShipmentsPage.tsx`
- `src/features/shipments/shipments.module.ts`

Mục tiêu:

- Tạo shipment từ order
- Chọn cuộn thành phẩm để xuất
- Hỗ trợ giao từng phần
- Cập nhật trạng thái shipment và stock state

Kết quả cần đạt:

- Không xuất vượt tồn
- Theo dõi được mỗi lần giao hàng

### 11. Thu tiền và công nợ

File chính:

- `src/features/payments/PaymentsPage.tsx`
- `src/features/payments/payments.module.ts`

Mục tiêu:

- Tạo phiếu thu tiền
- Theo dõi công nợ theo khách hàng và đơn hàng
- Đồng bộ `orders.paid_amount` bằng trigger DB

Kết quả cần đạt:

- Xem được còn nợ bao nhiêu
- Theo dõi lịch sử thu tiền rõ ràng

---

## Phase 5 — Tồn kho và Báo cáo

### 12. Dashboard tồn kho

File chính:

- `src/features/inventory/InventoryPage.tsx`
- `src/features/inventory/inventory.module.ts`

Mục tiêu:

- Hiển thị tồn sợi, vải mộc, vải thành phẩm
- Cảnh báo tồn thấp
- Có form điều chỉnh tồn kho

Kết quả cần đạt:

- Có màn hình tồn kho tổng hợp
- Có thể kiểm soát chênh lệch tồn kho

### 13. Báo cáo bán hàng và tồn kho

File chính:

- `src/features/reports/ReportsPage.tsx`
- `src/features/reports/reports.module.ts`

Mục tiêu:

- Báo cáo doanh thu
- Báo cáo công nợ
- Báo cáo tồn kho
- Báo cáo đơn hàng trễ hạn

Kết quả cần đạt:

- Chủ doanh nghiệp có số liệu để ra quyết định
- Sales và kho có dashboard theo dõi hàng ngày

---

## Phase 6 — Hardening

### 14. Phân quyền dữ liệu và kiểm thử

Mục tiêu:

- Tạo migration mới cho RLS
- Hoàn thiện loading, error, empty states
- Thêm test cho các luồng quan trọng

Kết quả cần đạt:

- Dữ liệu an toàn theo vai trò
- Ứng dụng ổn định hơn khi đưa vào vận hành

### 15. Offline và diagnostics

File chính:

- `src/services/offline/queue.ts`

Mục tiêu:

- Thêm queue cho thao tác offline khi cần
- Thêm diagnostics để kiểm tra sync

Ghi chú:

- Đây không phải blocker của MVP đầu tiên
- Chỉ nên làm sau khi CRUD chính đã ổn định

---

## Thứ tự ưu tiên thực hiện

1. Auth
2. Customers
3. Suppliers
4. Yarn Receipts
5. Raw Fabric
6. Finished Fabric
7. Orders
8. Order Progress
9. Shipments
10. Payments
11. Inventory
12. Reports
13. RLS + test + hardening

---

## Checklist triển khai

### Documentation và Scaffold

- [x] Tạo `docs/INTRO.md`
- [x] Tạo `docs/CODING_RULES.md`
- [x] Tạo `docs/PLAN.md`
- [x] Tách tài liệu module riêng trong `docs/modules/`
- [x] Bổ sung đầy đủ tài liệu cho `Auth` và `Settings`
- [x] Scaffold route skeleton cho toàn bộ feature modules
- [x] Tạo `*.module.ts` và `index.ts` cho các feature trong `src/features/`

### Foundation Scaffold đã có

- [x] Tạo `supabaseConfig` và `hasSupabaseEnv()` trong `src/services/supabase/client.ts`
- [x] Cấu hình `QueryClientProvider` trong `src/app/providers/AppProviders.tsx`
- [x] Tạo route `/auth` và `/settings` trong `src/app/router/routes.tsx`
- [x] Tạo navigation skeleton cho `Auth` và `Settings` trong `src/app/router/routes.tsx`
- [x] Tạo page scaffold cho `Auth` và `Settings`
- [x] Tách tài liệu module cho `Auth` và `Settings` trong `docs/modules/`

### Module Scaffold đã có

- [x] `Auth` có `AuthPage.tsx`, `auth.module.ts`, `index.ts`
- [x] `Customers` có `CustomersPage.tsx`, `customers.module.ts`, `index.ts`
- [x] `Suppliers` có `SuppliersPage.tsx`, `suppliers.module.ts`, `index.ts`
- [x] `Yarn Receipts` có `YarnReceiptsPage.tsx`, `yarn-receipts.module.ts`, `index.ts`
- [x] `Raw Fabric` có `RawFabricPage.tsx`, `raw-fabric.module.ts`, `index.ts`
- [x] `Finished Fabric` có `FinishedFabricPage.tsx`, `finished-fabric.module.ts`, `index.ts`
- [x] `Orders` có `OrdersPage.tsx`, `orders.module.ts`, `index.ts`
- [x] `Order Progress` có `OrderProgressPage.tsx`, `order-progress.module.ts`, `index.ts`
- [x] `Shipments` có `ShipmentsPage.tsx`, `shipments.module.ts`, `index.ts`
- [x] `Payments` có `PaymentsPage.tsx`, `payments.module.ts`, `index.ts`
- [x] `Inventory` có `InventoryPage.tsx`, `inventory.module.ts`, `index.ts`
- [x] `Reports` có `ReportsPage.tsx`, `reports.module.ts`, `index.ts`
- [x] `Settings` có `SettingsPage.tsx`, `settings.module.ts`, `index.ts`

### Foundation

- [x] Hoàn thiện `src/services/supabase/client.ts`
- [x] Cấu hình `.env.local`
- [x] Áp migration `supabase/migrations/0001_initial_schema.sql`
- [x] Kiểm tra app kết nối được Supabase

### Auth và Settings

- [x] Triển khai login tại `src/features/auth/AuthPage.tsx`
- [x] Triển khai logout và khôi phục session
- [x] Bootstrap session trong `src/app/providers/AppProviders.tsx`
- [x] Thêm route guard trong `src/app/router/ProtectedRoute.tsx` và `src/app/router/AppRouter.tsx`
- [x] Ẩn/hiện navigation theo quyền trong `src/app/layouts/AppShell.tsx`
- [ ] Hoàn thiện trang `Settings`
- [x] Khóa quyền sửa `Settings` cho admin
- [ ] Kiểm tra prefix chứng từ và diagnostics cơ bản

### Master Data

- [x] Hoàn thiện CRUD `Customers`
- [x] Thêm search và filter cho `Customers`
- [x] Hoàn thiện CRUD `Suppliers`
- [x] Thêm filter `category` cho `Suppliers`
- [ ] Tạo lookup dùng lại cho orders, payments, yarn receipts

### Luồng Kho

- [ ] Hoàn thiện `Yarn Receipts`
- [ ] Thêm line item repeater cho phiếu nhập sợi
- [ ] Tính tổng tiền phiếu nhập
- [x] Hoàn thiện `Raw Fabric`
- [x] Quản lý chất lượng A/B/C cho vải mộc
- [x] Quản lý vị trí kho cho vải mộc
- [ ] Hoàn thiện `Finished Fabric`
- [ ] Mapping từ raw roll sang finished roll
- [ ] Quản lý trạng thái `in_stock`, `reserved`, `shipped`

### Luồng Bán hàng

- [ ] Hoàn thiện CRUD `Orders`
- [ ] Thêm item repeater cho đơn hàng
- [ ] Theo dõi due date và trạng thái đơn
- [ ] Hoàn thiện `Order Progress`
- [ ] Hiển thị timeline 7 công đoạn
- [ ] Hoàn thiện `Shipments`
- [ ] Tạo shipment từ order
- [ ] Hỗ trợ giao hàng từng phần
- [ ] Hoàn thiện `Payments`
- [ ] Theo dõi công nợ theo khách hàng và đơn hàng
- [ ] Kiểm tra trigger đồng bộ `orders.paid_amount`

### Tồn kho và Báo cáo

- [ ] Hoàn thiện `Inventory`
- [ ] Hiển thị tồn sợi, vải mộc, vải thành phẩm
- [ ] Thêm low-stock alerts
- [ ] Thêm form điều chỉnh tồn kho
- [ ] Hoàn thiện `Reports`
- [ ] Thêm báo cáo doanh thu
- [ ] Thêm báo cáo công nợ
- [ ] Thêm báo cáo tồn kho
- [ ] Thêm báo cáo đơn hàng trễ hạn

### Hardening

- [ ] Tạo migration mới cho RLS
- [ ] Hoàn thiện loading states
- [ ] Hoàn thiện error states
- [ ] Hoàn thiện empty states
- [ ] Thêm test cho các luồng quan trọng
- [ ] Mở rộng offline queue khi CRUD chính đã ổn định
- [x] Chạy `npm run typecheck`
- [ ] Chạy `npm run lint`

---

## Điều kiện hoàn thành MVP

MVP được xem là đạt khi:

- Đăng nhập được và có phân quyền cơ bản
- Tạo được khách hàng và nhà cung cấp
- Nhập được sợi, vải mộc, vải thành phẩm
- Tạo được đơn hàng
- Theo dõi được tiến độ đơn hàng
- Xuất được hàng từ tồn kho thành phẩm
- Thu được tiền và theo dõi được công nợ
- Có dashboard tồn kho và báo cáo cơ bản

---

## Quy tắc triển khai

- Mọi thay đổi schema sau migration đầu tiên phải tạo migration mới
- Mọi dữ liệu từ form hoặc API đều phải validate bằng Zod
- Sau mỗi phase phải chạy:

```bash
npm run typecheck
npm run lint
```

- Không bỏ qua các trạng thái loading, error, empty
- Không triển khai báo cáo nâng cao hoặc PDF/Excel trước khi xong luồng nghiệp vụ chính
