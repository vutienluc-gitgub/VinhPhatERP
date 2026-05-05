# Danh sách Tasks — Bộ lọc Mặc định Nhà cung cấp Đang giao dịch

## Tổng quan

Tính năng bổ sung bộ lọc mặc định "Đang giao dịch" cho trang Nhà cung cấp, giúp Purchaser nhanh chóng thấy 18 NCC đang hoạt động thay vì phải lướt qua toàn bộ 44 NCC.

---

## Tasks

- [x] 1. Mở rộng `useUrlFilterState` với default values
  - [x] 1.1 Thêm parameter `defaults` vào function signature
  - [x] 1.2 Cập nhật logic `filters` useMemo để apply default khi param không có trên URL
  - [x] 1.3 Viết unit tests cho default value behavior
  - [x] 1.4 Test edge case: phân biệt `?status=` (empty) vs không có `?status`

- [ ] 2. Thêm API để lấy thống kê NCC
  - [x] 2.1 Tạo `fetchSupplierStats()` trong `src/api/suppliers.api.ts`
  - [x] 2.2 Tạo `useSupplierStats()` hook trong `src/application/crm/useSuppliers.ts`
  - [x] 2.3 Export hook từ `src/application/crm/index.ts`

- [~] 3. Cập nhật `SuppliersList` với default filter
  - [ ] 3.1 Thay đổi `useUrlFilterState` call với default `{ status: 'active' }`
  - [ ] 3.2 Verify FilterBar hiển thị đúng "Hoạt động" khi default active

- [~] 4. Thêm ViewAllChip component
  - [ ] 4.1 Tạo `ViewAllChip` component inline trong `SuppliersList.tsx`
  - [ ] 4.2 Hiển thị chip khi `filters.status === 'active'`
  - [ ] 4.3 Implement `onClear` handler để xóa status filter
  - [ ] 4.4 Styling: secondary chip/badge, consistent với design system

- [~] 5. Sửa KPI Dashboard
  - [ ] 5.1 Sử dụng `useSupplierStats()` thay vì client-side counting
  - [ ] 5.2 KPI "Tổng nhà cung cấp" hiển thị `stats.total`
  - [ ] 5.3 KPI "Đang giao dịch" hiển thị `stats.active`

- [~] 6. Cập nhật empty state logic
  - [ ] 6.1 Detect khi empty là do default filter (không có NCC active)
  - [ ] 6.2 Hiển thị message "Không có nhà cung cấp đang giao dịch"
  - [ ] 6.3 Vẫn hiển thị ViewAllChip trong empty state này

- [~] 7. Testing và Verification
  - [ ] 7.1 Test manual: vào trang Suppliers → chỉ hiện NCC active
  - [ ] 7.2 Test manual: click ViewAllChip → hiện tất cả NCC
  - [ ] 7.3 Test manual: reload page → filter state preserved trên URL
  - [ ] 7.4 Test manual: bookmark URL không có params → vẫn default active
  - [ ] 7.5 Test manual: URL có `?status=` → hiện tất cả (không default)
  - [ ] 7.6 Run lint và type check

---

## Dependencies

- Không có dependency blocking — tất cả tasks có thể thực hiện tuần tự

## Notes

- Task 1 (useUrlFilterState) là foundation cho toàn bộ feature
- Task 4 và 6 có thể làm song song sau khi Task 1 và 3 hoàn thành
- Task 2 (API) có thể làm song song với Task 1
