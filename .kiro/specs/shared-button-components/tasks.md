# Implementation Plan: shared-button-components

## Overview

Extract 4 button patterns lặp lại thành shared components trong `src/shared/components/`, export qua barrel, sau đó migrate toàn bộ hardcode trong feature pages. Mỗi task kết thúc bằng typecheck + lint.

## Tasks

- [ ] 1. Implement AddButton component
  - Tạo file `src/shared/components/AddButton.tsx`
  - Props interface: `onClick: () => void`, `label: string`, `icon?: IconName` (default `"Plus"`), `disabled?: boolean` (default `false`)
  - Render: `<button type="button" className="btn-primary" style={{ minHeight: 42, padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} disabled={disabled} onClick={onClick}>`
  - Import `Icon` và `IconName` từ `./Icon` — không dùng `as any`, không implicit any
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]\* 1.1 Write property test for AddButton rendering invariants
    - **Property 1: AddButton rendering invariants**
    - **Validates: Requirements 1.6, 1.7, 1.8**
    - Dùng `@fast-check/vitest`: generate arbitrary `label`, optional `icon` (subset of valid IconName), optional `disabled`
    - Assert: `type="button"`, className chứa `"btn-primary"`, style `minHeight: 42`, có Icon `size={18}`

  - [ ]\* 1.2 Write unit tests for AddButton
    - Test default icon là `"Plus"` khi không truyền `icon`
    - Test custom icon khi truyền `icon` prop
    - Test `disabled=true` có attribute `disabled`
    - _Requirements: 1.4, 1.5, 1.9_

- [ ] 2. Implement ClearFilterButton component
  - Tạo file `src/shared/components/ClearFilterButton.tsx`
  - Props interface: `onClick: () => void`, `label?: string` (default `"Xóa lọc"`)
  - Render: `<button type="button" className="btn-secondary text-danger border-danger/20 flex items-center gap-2">`
  - Icon luôn là `"X"` size `14` — không configurable
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]\* 2.1 Write property test for ClearFilterButton rendering invariants
    - **Property 2: ClearFilterButton rendering invariants**
    - **Validates: Requirements 2.4, 2.5, 2.6**
    - Generate arbitrary optional `label`
    - Assert: `type="button"`, className chứa `"btn-secondary"`, `"text-danger"`, `"border-danger/20"`, Icon `"X"` size `14`

  - [ ]\* 2.2 Write property test for ClearFilterButton label round-trip
    - **Property 3: ClearFilterButton label round-trip**
    - **Validates: Requirements 2.7**
    - Generate arbitrary non-empty string làm `label`
    - Assert: rendered output chứa label string đó

  - [ ]\* 2.3 Write unit tests for ClearFilterButton
    - Test default label `"Xóa lọc"` khi không truyền `label`
    - Test custom label khi truyền `label` prop
    - _Requirements: 2.3, 2.7_

- [ ] 3. Implement CancelButton component
  - Tạo file `src/shared/components/CancelButton.tsx`
  - Props interface: `onClick: () => void`, `label?: string` (default `"Hủy"`), `disabled?: boolean` (default `false`)
  - Render: `<button type="button" className="btn-secondary" disabled={disabled} onClick={onClick}>`
  - Không có icon — text-only theo design system
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ]\* 3.1 Write property test for CancelButton rendering invariants
    - **Property 4: CancelButton rendering invariants**
    - **Validates: Requirements 3.5, 3.6**
    - Generate arbitrary optional `label`, optional `disabled`
    - Assert: `type="button"`, className chứa `"btn-secondary"`

  - [ ]\* 3.2 Write property test for CancelButton label round-trip
    - **Property 5: CancelButton label round-trip**
    - **Validates: Requirements 3.8**
    - Generate arbitrary non-empty string làm `label`
    - Assert: rendered output chứa label string đó

  - [ ]\* 3.3 Write unit tests for CancelButton
    - Test default label `"Hủy"` khi không truyền `label`
    - Test `disabled=true` có attribute `disabled`
    - _Requirements: 3.3, 3.4, 3.7_

- [ ] 4. Implement ActionBar component
  - Tạo file `src/shared/components/ActionBar.tsx`
  - Export interface `ActionConfig`: `{ icon: IconName; onClick: () => void; title?: string; disabled?: boolean; variant?: 'default' | 'danger' }`
  - Props interface: `actions: ActionConfig[]`
  - Render wrapper: `<div className="flex justify-end gap-1">`
  - Mỗi action: `<button type="button" className={\`btn-icon\${action.variant === 'danger' ? ' text-danger' : ''}\`}>`
  - Icon size `16` cho mỗi action
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ]\* 4.1 Write property test for ActionBar structural invariant
    - **Property 6: ActionBar structural invariant**
    - **Validates: Requirements 4.5, 4.6**
    - Generate arbitrary array (length 0–10) của `ActionConfig` với valid `icon`, `onClick`
    - Assert: số buttons = số actions; mỗi button `type="button"` và `"btn-icon"`; wrapper `"flex justify-end gap-1"`

  - [ ]\* 4.2 Write property test for ActionBar ActionConfig fields reflected
    - **Property 7: ActionBar ActionConfig fields reflected**
    - **Validates: Requirements 4.7, 4.8, 4.9**
    - Generate arbitrary `ActionConfig` với random `variant`, `disabled`, `title`
    - Assert: `variant="danger"` → className chứa `"text-danger"`; `disabled=true` → button có `disabled`; `title` → button có `title` attribute

  - [ ]\* 4.3 Write unit tests for ActionBar
    - Test `actions=[]` renders wrapper div không crash
    - Test `variant="danger"` thêm class `text-danger`
    - Test `disabled=true` có attribute `disabled`
    - Test `title` được render thành attribute
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9_

- [ ] 5. Update barrel export
  - Mở `src/shared/components/index.ts`
  - Thêm exports: `AddButton`, `ClearFilterButton`, `CancelButton`, `ActionBar`
  - Thêm export type: `ActionConfig`
  - Không xóa bất kỳ export nào đã có
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]\* 5.1 Write unit test for barrel exports
    - Assert tất cả 5 symbols (`AddButton`, `ClearFilterButton`, `CancelButton`, `ActionBar`, `ActionConfig`) được export từ `@/shared/components`
    - _Requirements: 5.1_

- [ ] 6. Checkpoint — Verify components compile clean
  - Chạy `npm run typecheck` — không có lỗi mới
  - Chạy `npm run lint` — không có warning mới
  - Đảm bảo 4 component files và barrel export đều pass trước khi bắt đầu migration
  - _Requirements: 7.1, 7.2_

- [ ] 7. Migrate AddButton — List page headers
  - Thay thế tất cả hardcode `btn-primary` + `minHeight: 42` / `min-h-[42px]` ở header của các List pages bằng `<AddButton>`
  - Các files cần migrate:
    - `src/features/bom/BomPage.tsx`
    - `src/features/customers/CustomerList.tsx`
    - `src/features/dyeing-orders/DyeingOrdersPage.tsx`
    - `src/features/employees/EmployeeListPage.tsx`
    - `src/features/fabric-catalog/FabricCatalogList.tsx`
    - `src/features/finished-fabric/FinishedFabricList.tsx` (nút "Nhập mới")
    - `src/features/orders/OrderList.tsx`
    - `src/features/payments/AccountList.tsx`
    - `src/features/payments/ExpenseList.tsx`
    - `src/features/raw-fabric/RawFabricList.tsx` (nút "Nhập mới")
    - `src/features/shipping-rates/ShippingRateList.tsx`
    - `src/features/suppliers/SuppliersList.tsx`
    - `src/features/weaving-invoices/WeavingInvoiceList.tsx`
    - `src/features/work-orders/WorkOrderList.tsx`
    - `src/features/yarn-catalog/YarnCatalogList.tsx`
    - `src/features/yarn-receipts/YarnReceiptList.tsx`
  - Import `AddButton` từ `@/shared/components`
  - Chạy `npm run typecheck` và `npm run lint` sau khi migrate xong
  - _Requirements: 6.1, 6.5_

- [ ] 8. Migrate ClearFilterButton — Filter bars
  - Thay thế tất cả hardcode `btn-secondary text-danger border-danger/20 flex items-center gap-2` trong filter bar bằng `<ClearFilterButton>`
  - Các files cần migrate:
    - `src/features/bom/BomPage.tsx`
    - `src/features/employees/EmployeeListPage.tsx`
    - `src/features/payments/ExpenseList.tsx`
    - `src/features/payments/PaymentList.tsx`
    - `src/features/quotations/QuotationList.tsx`
    - `src/features/raw-fabric/RawFabricList.tsx`
    - `src/features/reports/ReportsFilter.tsx`
    - `src/features/shipping-rates/ShippingRateList.tsx`
    - `src/features/suppliers/SuppliersList.tsx`
    - `src/features/weaving-invoices/WeavingInvoiceList.tsx`
    - `src/features/work-orders/WorkOrderList.tsx`
  - Lưu ý: `bom/BomDetail.tsx` dùng pattern này cho nút "Deprecate" — không migrate (không phải clear filter)
  - Import `ClearFilterButton` từ `@/shared/components`
  - Chạy `npm run typecheck` và `npm run lint` sau khi migrate xong
  - _Requirements: 6.2, 6.6_

- [ ] 9. Migrate CancelButton — Form footers
  - Thay thế tất cả `btn-secondary` cancel/close button trong form footer bằng `<CancelButton>`
  - Các files cần migrate:
    - `src/features/dyeing-orders/DyeingOrderForm.tsx` (nút "Huy")
    - `src/features/payments/PaymentForm.tsx` (nút "Đóng")
    - `src/features/shipping-rates/ShippingRateForm.tsx` (nút "Huỷ")
    - `src/features/weaving-invoices/WeavingInvoiceForm.tsx` (nút "Hủy")
  - Lưu ý: `QuotationDetail.tsx` và `OrderDetail.tsx` dùng `btn-secondary` cho nút "Quay lại" — không migrate (không phải cancel form)
  - Import `CancelButton` từ `@/shared/components`
  - Chạy `npm run typecheck` và `npm run lint` sau khi migrate xong
  - _Requirements: 6.3_

- [ ] 10. Migrate ActionBar — Table row action buttons
  - Thay thế tất cả `<div className="flex justify-end gap-1">` + nhóm `btn-icon` buttons trong table rows bằng `<ActionBar actions={[...]}>`
  - Các files cần migrate:
    - `src/features/bom/BomList.tsx`
    - `src/features/customers/CustomerList.tsx`
    - `src/features/dyeing-orders/DyeingOrderList.tsx`
    - `src/features/employees/EmployeeListPage.tsx`
    - `src/features/fabric-catalog/FabricCatalogList.tsx`
    - `src/features/finished-fabric/FinishedFabricList.tsx`
    - `src/features/orders/OrderList.tsx`
    - `src/features/payments/AccountList.tsx`
    - `src/features/payments/ExpenseList.tsx`
    - `src/features/quotations/QuotationList.tsx`
    - `src/features/shipments/ShipmentList.tsx`
    - `src/features/shipping-rates/ShippingRateList.tsx`
    - `src/features/suppliers/SuppliersList.tsx`
    - `src/features/weaving-invoices/WeavingInvoiceList.tsx`
    - `src/features/work-orders/WorkOrderList.tsx`
    - `src/features/yarn-catalog/YarnCatalogList.tsx`
    - `src/features/yarn-receipts/YarnReceiptList.tsx`
  - Lưu ý: Các row có conditional buttons (status-dependent) — map điều kiện thành `disabled` hoặc chỉ include action khi điều kiện thỏa, dùng `.filter(Boolean)` với type `ActionConfig[]`
  - Import `ActionBar` và `ActionConfig` từ `@/shared/components`
  - Chạy `npm run typecheck` và `npm run lint` sau khi migrate xong
  - _Requirements: 6.4_

- [ ] 11. Final checkpoint — Verify full migration
  - Chạy `npm run typecheck` — không có lỗi mới
  - Chạy `npm run lint` — không có warning mới
  - Verify không còn hardcode pattern `btn-primary min-h-[42px]` / `minHeight: 42` ở header List pages
  - Verify không còn hardcode pattern `btn-secondary text-danger border-danger/20 flex items-center gap-2` trong filter bars
  - Verify không còn `<div className="flex justify-end gap-1">` + inline `btn-icon` buttons trong table rows của feature pages
  - _Requirements: 6.5, 6.6, 7.1, 7.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Mỗi task implement xong phải pass `npm run typecheck` và `npm run lint` trước khi chuyển task tiếp theo
- Không dùng `as any`, không implicit any ở bất kỳ đâu trong component files mới
- Import luôn từ `@/shared/components` — không dùng relative import giữa features
- Conditional action buttons trong table rows: dùng array filter thay vì inline ternary để giữ type safety với `ActionConfig[]`
