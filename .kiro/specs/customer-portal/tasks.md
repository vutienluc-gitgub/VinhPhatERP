# Implementation Plan: Customer Portal

## Overview

Triển khai Customer Portal theo từng lớp: database migration → auth/routing → layout → data hooks → UI pages → admin tools → property tests. Mỗi bước build trên bước trước, kết thúc bằng wiring toàn bộ vào AppRouter.

## Tasks

- [x] 1. Database migration: thêm role `customer` và cột `customer_id` vào `profiles`
  - Tạo file migration `supabase/migrations/20260411000001_add_customer_portal.sql`
  - `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer'`
  - `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id)`
  - `CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_customer_id_unique ON profiles (customer_id) WHERE customer_id IS NOT NULL`
  - Cập nhật `src/services/supabase/database.types.ts`: thêm `'customer'` vào `user_role` enum, thêm `customer_id: string | null` vào `profiles` Row/Insert/Update
  - _Requirements: 1.1, 2.1, 8.1, 8.2_

- [x] 2. RLS policies cho Customer Portal
  - [x] 2.1 Viết SQL RLS policies trong cùng migration hoặc migration riêng `20260411000002_customer_portal_rls.sql`
    - Policy `customer_portal_orders_select` trên bảng `orders`
    - Policy `customer_portal_payments_select` trên bảng `payments`
    - Policy `customer_portal_shipments_select` trên bảng `shipments`
    - Policy `customer_portal_order_progress_select` trên bảng `order_progress`
    - Policy `customer_portal_order_items_select` trên bảng `order_items`
    - Policy `customer_portal_shipment_items_select` trên bảng `shipment_items`
    - _Requirements: 2.2, 2.3, 2.5_

- [x] 3. Pure utility functions (không phụ thuộc React/Supabase)
  - Tạo `src/features/customer-portal/utils.ts`
  - `applyCustomerFilter<T extends { customer_id: string }>(records: T[], customerId: string): T[]`
  - `sortByDateDesc<T>(records: T[], dateField: keyof T): T[]`
  - `computeDebtSummary(totalAmount: number, paidAmount: number): { total_amount: number; paid_amount: number; remaining_debt: number }`
  - `computeStageOverdue(stage: { actual_date: string | null; planned_date: string | null }): { is_overdue: boolean }`
  - `paginateList<T>(records: T[], pageSize: number): T[][]`
  - _Requirements: 2.3, 2.5, 3.1, 4.4, 5.2, 6.1, 7.1_

  - [ ]\* 3.1 Viết property test cho `applyCustomerFilter` (Property 1)
    - **Property 1: Cách ly dữ liệu theo customer**
    - **Validates: Requirements 2.3, 2.5**
    - Tạo `src/features/customer-portal/__tests__/utils.property.test.ts`
    - Dùng `fc.array(fc.record({ id: fc.uuid(), customer_id: fc.uuid(), ... }))` để generate mixed records
    - Assert mọi phần tử kết quả có `customer_id === customerId`

  - [ ]\* 3.2 Viết property test cho `sortByDateDesc` (Property 2)
    - **Property 2: Sắp xếp danh sách theo ngày giảm dần**
    - **Validates: Requirements 3.1, 6.1, 7.1**
    - Assert `sorted[i-1].date >= sorted[i].date` với mọi i

  - [ ]\* 3.3 Viết property test cho `computeDebtSummary` (Property 3)
    - **Property 3: Tính toán công nợ nhất quán**
    - **Validates: Requirements 5.2**
    - `fc.float({ min: 0, max: 1e9 })` cho total và paid
    - Assert `|remaining_debt - (total - paid)| < 0.01`

  - [ ]\* 3.4 Viết property test cho `computeStageOverdue` (Property 4)
    - **Property 4: Đánh dấu trễ hạn công đoạn**
    - **Validates: Requirements 4.4**
    - `fc.date()` cho actual và planned
    - Assert `is_overdue === (actual > planned)`

  - [ ]\* 3.5 Viết property test cho `paginateList` (Property 5)
    - **Property 5: Phân trang đầy đủ**
    - **Validates: Requirements 3.5**
    - Assert tổng bản ghi qua tất cả trang = N, mỗi trang ≤ pageSize

- [x] 4. TypeScript types và PortalRoute guard
  - [x] 4.1 Tạo `src/features/customer-portal/types.ts` với các interface từ design
    - `PortalOrder`, `PortalOrderItem`, `PortalProgressStage`, `PortalDebtSummary`, `PortalPayment`, `PortalShipment`, `PortalShipmentItem`
    - _Requirements: 3.2, 4.2, 5.1, 6.2, 7.2_

  - [x] 4.2 Tạo `src/features/customer-portal/PortalRoute.tsx`
    - Dùng `useAuth()` từ `@/features/auth/AuthProvider`
    - `loading` → `<LoadingScreen />` (hoặc spinner inline)
    - `!session` → `<Navigate to="/auth" replace />`
    - `isBlocked` → `<Navigate to="/blocked" replace />`
    - `profile?.role !== 'customer'` → `<Navigate to="/unauthorized" replace />`
    - Ngược lại → `<Outlet />`
    - _Requirements: 1.2, 1.4, 1.5, 1.6, 2.4_

  - [ ]\* 4.3 Viết unit test cho `PortalRoute`
    - Test redirect đúng theo từng trường hợp: loading, no session, blocked, wrong role, customer role
    - Tạo `src/features/customer-portal/__tests__/PortalRoute.test.tsx`
    - _Requirements: 1.2, 1.4, 1.5, 2.4_

- [x] 5. CustomerPortalLayout và CustomerPortalRouter
  - [x] 5.1 Tạo `src/features/customer-portal/CustomerPortalLayout.tsx`
    - Header tối giản: logo, tên khách hàng (`profile.full_name`), nút đăng xuất
    - Không có sidebar ERP, không có bottom nav nội bộ
    - Dùng `<Outlet />` cho content area
    - _Requirements: 1.4_

  - [x] 5.2 Tạo `src/features/customer-portal/CustomerPortalRouter.tsx`
    - Định nghĩa routes `/portal/*` với lazy imports cho tất cả portal pages
    - Wrap bằng `<CustomerPortalLayout />`
    - _Requirements: 1.2, 2.4_

  - [x] 5.3 Đăng ký portal routes vào `src/app/router/AppRouter.tsx`
    - Thêm route group `path: '/portal'` với `element: <PortalRoute />`
    - Children: `CustomerPortalRouter` routes
    - Đảm bảo route ERP hiện tại (`ProtectedRoute` không có `allowedRoles: ['customer']`) block role customer
    - _Requirements: 1.2, 2.4_

  - [ ]\* 5.4 Viết unit test cho `CustomerPortalLayout`
    - Assert không render sidebar ERP
    - Assert render tên khách hàng và nút đăng xuất
    - _Requirements: 1.4_

- [x] 6. Data hooks
  - [x] 6.1 Tạo `src/features/customer-portal/hooks/usePortalOrders.ts`
    - Query `orders` với `select('*, order_items(*)')`, order by `order_date desc`
    - Pagination state: `page`, `setPage`, `PAGE_SIZE = 20`
    - Return `{ orders, loading, error, page, setPage }`
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 6.2 Tạo `src/features/customer-portal/hooks/usePortalDebt.ts`
    - Query `orders` để tính `totalAmount`, `paidAmount`
    - Dùng `computeDebtSummary()` từ `utils.ts`
    - Lọc `overdueOrders`: đơn có `paid_amount < total_amount`, sort by `due_date asc`
    - Return `{ totalAmount, paidAmount, remainingDebt, overdueOrders, loading }`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.3 Tạo `src/features/customer-portal/hooks/usePortalPayments.ts`
    - Query `payments` join `orders(order_number)`, order by `payment_date desc`
    - Return `{ payments, loading }`
    - _Requirements: 6.1, 6.2_

  - [x] 6.4 Tạo `src/features/customer-portal/hooks/usePortalShipments.ts`
    - Query `shipments` với `select('*, shipment_items(*)')`, order by `shipment_date desc`
    - Return `{ shipments, loading }`
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 7. Checkpoint — Đảm bảo tất cả tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Portal pages — Dashboard và Orders
  - [x] 8.1 Tạo `src/features/customer-portal/dashboard/PortalDashboardPage.tsx`
    - Summary cards: tổng đơn hàng, công nợ còn lại, phiếu giao gần nhất
    - Dùng `usePortalOrders`, `usePortalDebt`, `usePortalShipments`
    - _Requirements: 3.1, 5.1_

  - [x] 8.2 Tạo `src/features/customer-portal/orders/PortalOrdersPage.tsx`
    - Danh sách đơn hàng dùng `usePortalOrders`
    - Mỗi row: số đơn, ngày đặt, ngày giao dự kiến, tổng tiền, đã thanh toán, trạng thái
    - Pagination controls
    - Read-only (không có nút tạo/sửa/xóa)
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 8.3 Tạo `src/features/customer-portal/orders/PortalProgressTimeline.tsx`
    - Nhận `stages: PortalProgressStage[]` làm prop
    - Hiển thị từng công đoạn: tên, trạng thái, ngày dự kiến, ngày thực tế
    - Dùng `computeStageOverdue()` để đánh dấu trễ hạn (visual indicator)
    - Read-only
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 8.4 Tạo `src/features/customer-portal/orders/PortalOrderDetail.tsx`
    - Fetch order by id với `order_items` và `order_progress`
    - Hiển thị danh sách sản phẩm: tên vải, màu, số lượng, đơn giá, thành tiền
    - Render `<PortalProgressTimeline stages={...} />`
    - _Requirements: 3.3, 4.1, 4.2_

  - [ ]\* 8.5 Viết property test cho `PortalOrdersPage` render (Property 6)
    - **Property 6: Render đầy đủ các trường bắt buộc**
    - **Validates: Requirements 3.2**
    - Dùng `fc.record(...)` để generate `PortalOrder` arbitrary
    - Assert rendered output chứa `order_number`, `order_date`, `total_amount`

- [x] 9. Portal pages — Debt, Payments, Shipments
  - [x] 9.1 Tạo `src/features/customer-portal/debt/PortalDebtPage.tsx`
    - Summary: tổng tiền đơn, đã thanh toán, còn nợ (dùng `usePortalDebt`)
    - Danh sách đơn còn nợ sort by `due_date asc`
    - Read-only
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 9.2 Tạo `src/features/customer-portal/payments/PortalPaymentsPage.tsx`
    - Danh sách phiếu thu dùng `usePortalPayments`
    - Mỗi row: số phiếu, ngày thu, số tiền, phương thức, số đơn hàng liên quan
    - Read-only
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 9.3 Tạo `src/features/customer-portal/shipments/PortalShipmentsPage.tsx`
    - Danh sách phiếu giao dùng `usePortalShipments`
    - Mỗi row: số phiếu, ngày giao, số đơn, trạng thái, địa chỉ giao
    - Read-only
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 9.4 Tạo `src/features/customer-portal/shipments/PortalShipmentDetail.tsx`
    - Hiển thị chi tiết cuộn vải đã giao: mã cuộn, loại vải, số lượng (kg/m)
    - _Requirements: 7.3_

- [x] 10. Barrel export và wiring hoàn chỉnh
  - Tạo `src/features/customer-portal/index.ts` export `CustomerPortalRouter`, `PortalRoute`
  - Cập nhật `src/app/router/AppRouter.tsx` để import và mount portal routes
  - Đảm bảo `ProtectedRoute` (ERP) không cho role `customer` vào (kiểm tra logic hiện tại — nếu `allowedRoles` không include `customer` thì đã đúng)
  - Cập nhật `AuthProvider` redirect logic: sau login nếu `profile.role === 'customer'` → redirect `/portal`
  - _Requirements: 1.2, 1.5, 2.4_

- [x] 11. Supabase Edge Function: `create-customer-account`
  - Tạo `supabase/functions/create-customer-account/index.ts`
  - Nhận `{ email, password, customer_id, full_name }` từ request body (service role only)
  - Kiểm tra `customer_id` chưa có account (query `profiles WHERE customer_id = ?`)
  - Nếu đã tồn tại → trả về lỗi rõ ràng (Requirements 8.4)
  - Tạo Supabase Auth user với `supabaseAdmin.auth.admin.createUser()`
  - Upsert `profiles`: `role = 'customer'`, `customer_id`, `is_active = true`
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 12. Admin UI: quản lý tài khoản khách hàng
  - Tạo `src/features/customers/CustomerPortalAccountPanel.tsx`
  - Form nhỏ trong trang chi tiết khách hàng: email, password tạm thời, nút "Tạo tài khoản Portal"
  - Gọi Edge Function `create-customer-account`
  - Hiển thị trạng thái: chưa có account / đã có account (email)
  - Nút "Vô hiệu hóa" → PATCH `profiles SET is_active = false` (Requirements 8.3)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Final checkpoint — Đảm bảo tất cả tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để ra MVP nhanh hơn
- Property tests dùng `fast-check` (đã có trong devDependencies)
- RLS là tầng bảo vệ chính — frontend chỉ là UX, không phải security layer
- `customer` role chưa có trong `user_role` enum → migration task 1 phải chạy trước mọi thứ khác
- Edge Function dùng service role key, không expose ra client
