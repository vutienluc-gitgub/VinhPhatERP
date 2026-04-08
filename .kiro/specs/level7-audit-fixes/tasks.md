# Tasks — Level 7 Audit Fixes

## Task 1: [CRITICAL-01-A] Thêm missing type exports vào module files

- [x] 1.1 Thêm `export type { PaymentsFormValues, AccountFormValues, ExpenseFormValues }` vào `src/features/payments/payments.module.ts`
- [x] 1.2 Thêm `export type { OrdersFormValues }` vào `src/features/orders/orders.module.ts`
- [x] 1.3 Thêm `export type { ShipmentsFormValues, DeliveryConfirmFormValues }` vào `src/features/shipments/shipments.module.ts`
- [x] 1.4 Thêm `export type { RawFabricFormValues, BulkInputFormValues }` vào `src/features/raw-fabric/raw-fabric.module.ts`
- [x] 1.5 Thêm `export type { FinishedFabricFormValues, BulkFinishedInputFormValues }` vào `src/features/finished-fabric/finished-fabric.module.ts`
- [x] 1.6 Thêm `export type { CreateWorkOrderInput, CompleteWorkOrderInput }` vào `src/features/work-orders/work-orders.module.ts`
- [x] 1.7 Thêm `export type { FabricCatalogFormValues }` vào `src/features/fabric-catalog/fabric-catalog.module.ts`
- [x] 1.8 Thêm `export type { YarnCatalogFormValues }` vào `src/features/yarn-catalog/yarn-catalog.module.ts`
- [x] 1.9 Thêm `export type { YarnReceiptsFormValues }` vào `src/features/yarn-receipts/yarn-receipts.module.ts`
- [x] 1.10 Thêm `export type { QuotationsFormValues }` vào `src/features/quotations/quotations.module.ts`
- [x] 1.11 Thêm `export type { ShippingRateFormValues }` vào `src/features/shipping-rates/shipping-rates.module.ts`
- [x] 1.12 Thêm `export type { SupplierFormValues }` vào `src/features/suppliers/suppliers.module.ts`
- [x] 1.13 Chạy `npm run typecheck` và xác nhận lỗi TS2614 đã giảm

## Task 2: [CRITICAL-01-C] Sửa type mismatch và duplicate exports

- [x] 2.1 Sửa `customers.module.tsx`: đổi `group: 'partners'` → `group: 'sales'`, xóa unused imports `lazy` và `LazyPage`
- [x] 2.2 Sửa `reports.module.ts`: đổi `group: 'admin'` → `group: 'system'`
- [x] 2.3 Sửa `settings.module.ts`: đổi `group: 'admin'` → `group: 'system'`
- [x] 2.4 Sửa `orders.module.ts`: fix component type để match `() => Promise<{ default: React.ComponentType }>`
- [x] 2.5 Sửa `src/shared/components/FeatureScaffoldPage.tsx`: thêm `?? []` cho `highlights` và `resources`
- [x] 2.6 Sửa `src/features/order-progress/index.ts`: loại bỏ duplicate exports
- [x] 2.7 Sửa `src/features/payments/index.ts`: loại bỏ duplicate exports cho `Payment`, `Expense`, `PaymentAccount`
- [x] 2.8 Chạy `npm run typecheck` và xác nhận lỗi TS2322 đã giảm

## Task 3: [CRITICAL-01-D] Sửa CreateOrderInput missing properties

- [x] 3.1 Đọc `src/features/orders/useCreateOrderV2.ts` để xác định tất cả properties đang được truy cập
- [x] 3.2 Cập nhật type `CreateOrderInput` để bao gồm đầy đủ các properties còn thiếu (không dùng `as` assertion)
- [x] 3.3 Chạy `npm run typecheck` và xác nhận lỗi TS2339 trong `useCreateOrderV2.ts` đã hết

## Task 4: [CRITICAL-01-B] Thêm type annotations cho implicit any callbacks

- [x] 4.1 Sửa `src/features/orders/useOrders.ts`: thêm type cho tất cả callback params trong `.map()`, `.reduce()`
- [x] 4.2 Sửa `src/features/orders/useCreateOrderV2.ts`: thêm type cho tất cả callback params
- [x] 4.3 Sửa `src/features/orders/OrderForm.tsx`: thêm type cho tất cả callback params
- [x] 4.4 Sửa `src/features/shipments/useShipments.ts`: thêm type cho tất cả callback params
- [x] 4.5 Sửa `src/features/shipments/ShipmentForm.tsx`: thêm type cho tất cả callback params
- [x] 4.6 Sửa `src/features/yarn-receipts/useYarnReceipts.ts`: thêm type cho tất cả callback params
- [x] 4.7 Sửa `src/features/yarn-receipts/YarnReceiptForm.tsx`: thêm type cho tất cả callback params
- [x] 4.8 Sửa `src/features/work-orders/WorkOrderYarnTable.tsx`: thêm type cho tất cả callback params
- [x] 4.9 Sửa `src/features/finished-fabric/FinishedFabricBulkForm.tsx`: thêm type cho tất cả callback params
- [x] 4.10 Sửa `src/features/raw-fabric/RawFabricBulkForm.tsx`: thêm type cho tất cả callback params
- [x] 4.11 Sửa `src/features/quotations/useQuotations.ts`: thêm type cho tất cả callback params
- [x] 4.12 Chạy `npm run typecheck` và xác nhận 0 lỗi TS7006. Tổng lỗi TypeScript phải = 0

## Task 5: [CRITICAL-02-A] Sửa test failures do createModule

- [x] 5.1 Đọc `src/core/registry/moduleRegistry.ts` để xác nhận `createModule` được export đúng
- [x] 5.2 Thêm `vi.mock('@/core/registry/moduleRegistry', ...)` vào `src/features/orders/orders.module.test.ts`
- [x] 5.3 Thêm mock tương tự vào `src/features/quotations/quotations.module.test.ts`
- [x] 5.4 Thêm mock tương tự vào `src/features/raw-fabric/raw-fabric.module.test.ts`
- [x] 5.5 Thêm mock tương tự vào `src/features/suppliers/suppliers.module.test.ts`
- [x] 5.6 Chạy `npm run test` và xác nhận 4 test files trên pass

## Task 6: [CRITICAL-02-B] Sửa ProtectedRoute.test.tsx mock sai interface

- [x] 6.1 Đọc `src/features/auth/AuthProvider.tsx` để xác định interface `AuthContextValue` thực tế
- [x] 6.2 Cập nhật mock trong `src/app/router/ProtectedRoute.test.tsx` để match đúng interface (xóa `isAdmin`, `isManager`, `isStaff` nếu không tồn tại; thêm `profile`, `isBlocked`)
- [x] 6.3 Chạy `npm run test` và xác nhận `ProtectedRoute.test.tsx` pass

## Task 7: [CRITICAL-02-C] Sửa DashboardPage.test.tsx heading không khớp

- [x] 7.1 Đọc `src/features/dashboard/DashboardPage.tsx` để xác định text/heading thực tế component render
- [x] 7.2 Thêm `<h1>` heading vào `DashboardPage.tsx` nếu chưa có (dùng `sr-only` nếu không muốn hiển thị)
- [x] 7.3 Cập nhật assertions trong `DashboardPage.test.tsx` để match đúng nội dung render
- [x] 7.4 Chạy `npm run test` và xác nhận toàn bộ test suite pass (9/9 files)

## Task 8: [MAJOR-03] Validate overpayment trong payment schema và form

- [ ] 8.1 Thêm factory function `createPaymentsSchema(balanceDue?: number)` vào `src/schema/payment.schema.ts` dùng `.superRefine()` để validate `amount <= balanceDue`
- [ ] 8.2 Cập nhật `src/features/payments/PaymentForm.tsx`: dùng `createPaymentsSchema(balanceDue)` thay vì `paymentsSchema`
- [ ] 8.3 Thêm UI block trong `PaymentForm.tsx`: nếu `balanceDue <= 0` thì hiển thị thông báo "Đơn hàng đã thanh toán đầy đủ" và không render form
- [ ] 8.4 Viết property-based test cho `createPaymentsSchema` trong `src/schema/payment.schema.test.ts` (dùng fast-check): Property 1 — overpayment luôn bị từ chối; Property 2 — payment hợp lệ luôn được chấp nhận
- [ ] 8.5 Chạy `npm run test` và xác nhận property tests pass
- [ ] 8.6\* (Optional — cần confirm) Tạo migration DB: `supabase/migrations/YYYYMMDD_add_overpayment_constraint.sql` với CHECK constraint ngăn `amount > balance_due`

## Task 9: [MAJOR-01] Thêm Zod validation cho Supabase API responses

- [ ] 9.1 Thêm `paymentResponseSchema` vào `src/schema/payment.schema.ts`
- [ ] 9.2 Cập nhật `src/api/payments.api.ts`: thay `as unknown as Payment[]` bằng `paymentResponseSchema.array().parse(data)`
- [ ] 9.3 Thêm `orderResponseSchema` vào schema file tương ứng
- [ ] 9.4 Cập nhật `src/api/orders.api.ts`: thay type assertions bằng Zod parse
- [ ] 9.5 Thêm `shipmentResponseSchema` và cập nhật `src/api/shipments.api.ts`
- [ ] 9.6 Thêm `customerResponseSchema` và cập nhật `src/api/customers.api.ts`
- [ ] 9.7 Chạy `npm run typecheck` và xác nhận không có lỗi mới

## Task 10: [MAJOR-02] Loại bỏ cross-feature imports và cấu hình eslint-plugin-boundaries

- [ ] 10.1 Refactor `src/features/work-orders/WorkOrderForm.tsx`: thay cross-feature imports bằng props hoặc `src/api/` trực tiếp
- [ ] 10.2 Refactor `src/features/raw-fabric/RawFabricBulkForm.tsx`: nhận `fabricOptions` qua props thay vì import từ `fabric-catalog`
- [ ] 10.3 Refactor `src/features/shipments/ShipmentForm.tsx`: nhận `shippingRates` qua props thay vì import từ `shipping-rates`
- [ ] 10.4 Refactor `src/features/weaving-invoices/WeavingInvoiceForm.tsx`: nhận `fabricOptions` qua props thay vì import từ `fabric-catalog`
- [ ] 10.5 Cập nhật các parent components gọi các form trên để truyền đúng props
- [ ] 10.6 Cấu hình `eslint-plugin-boundaries` trong `.eslintrc.cjs` với rule `error` cho cross-feature imports
- [ ] 10.7 Chạy `npm run lint` và xác nhận 0 boundaries errors

## Task 11: [MINOR-01] Vá lỗ hổng bảo mật trong dependencies

- [ ] 11.1 Chạy `npm audit fix` để vá `brace-expansion` và các deps có thể fix tự động
- [ ] 11.2 Kiểm tra kết quả `npm audit` — nếu còn lỗi liên quan `esbuild`/`vite`, đánh giá upgrade vite lên version mới nhất
- [ ] 11.3 Chạy `npm run build` để xác nhận build vẫn thành công sau khi update
- [ ] 11.4 Chạy `npm run test` để xác nhận không có test failures mới
- [ ] 11.5 Xác nhận `npm audit --audit-level=moderate` báo cáo 0 issues

## Task 12: [MINOR-02] Xử lý ESLint warnings

- [ ] 12.1 Xóa unused imports `lazy` và `LazyPage` trong `src/features/customers/customers.module.tsx` (nếu chưa xử lý ở Task 2.1)
- [ ] 12.2 Fix `import/order` warnings trong tất cả module files: sắp xếp lại thứ tự import (builtin → external → internal)
- [ ] 12.3 Fix `react-refresh/only-export-components` warnings trong `inventory.module.tsx` và các files liên quan
- [ ] 12.4 Chạy `npm run lint` và xác nhận 0 warnings trong các files đã fix
