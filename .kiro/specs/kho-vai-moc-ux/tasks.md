# Implementation Plan: Tối ưu UX Màn hình Kho Vải Mộc

## Overview

Refactor UI-only cho màn hình Kho Vải Mộc: cải thiện KPI Cards, thêm AnomalyLegend, nâng cấp FilterBar với Combobox + debounce, tối ưu Pagination, phân cấp ActionButtons, và fix layout mobile. Không thay đổi data model hay API.

## Tasks

- [x] 1. Tạo helper functions và types
  - [x] 1.1 Viết `calcDeviationPercent`, `isAnyFilterActive`, `formatPaginationText` trong `src/components/raw-fabric/helpers.ts`
    - `calcDeviationPercent(weightKg, standardWeightKg): number` — trả về % lệch tuyệt đối
    - `isAnyFilterActive(filter: FilterState): boolean` — kiểm tra có field nào khác default không
    - `formatPaginationText(page, totalPages, totalItems): string` — format `"Trang X / Y — Z cuộn"`
    - _Requirements: 3.4, 3.5, 4.1, 2.5_

  - [ ]\* 1.2 Viết property tests cho helper functions (`helpers.property.test.ts`)
    - **Property 9: Pagination format text đúng** — `formatPaginationText` chứa đủ 3 giá trị
    - **Validates: Requirements 4.1**
    - **Property 6: Nút Xóa lọc hiện khi có filter active** — `isAnyFilterActive` đúng với mọi FilterState
    - **Validates: Requirements 3.4**
    - **Property 7: Clear filter reset toàn bộ về default** — sau clear, tất cả fields về default
    - **Validates: Requirements 3.5**
    - Dùng `fc.record` để generate arbitrary FilterState, `fc.integer` cho page/total values

- [x] 2. Implement KpiCard
  - [x] 2.1 Refactor `KpiCard.tsx` theo interface mới
    - Thêm prop `footerLabel: string`, `colorVariant: 'primary' | 'success' | 'info'`, `onClick?: () => void`
    - Áp dụng màu theo `colorVariant`: primary/success/info — không dùng warning cho dữ liệu bình thường
    - Khi `type='length'` và `value=0`: render màu neutral + Tooltip "Chưa có dữ liệu chiều dài"
    - Khi `type='length'` và `value>0`: render màu success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]\* 2.2 Viết property test cho KpiCard (`KpiCard.test.tsx`)
    - **Property 1: KPI_Card luôn có footer label** — mọi props hợp lệ đều render footer label không rỗng
    - **Validates: Requirements 1.1**
    - **Property 2: KPI_Card màu success khi totalLengthM > 0** — `value > 0` → class success
    - **Validates: Requirements 1.3**
    - **Property 3: KPI_Card click trigger đúng filter** — onClick được gọi khi click
    - **Validates: Requirements 1.5**

- [x] 3. Implement AnomalyLegend
  - [x] 3.1 Tạo `AnomalyLegend.tsx` mới
    - Props: `compact?: boolean`
    - Render 3 mục: normal (xám), light (đỏ), heavy (cam)
    - Compact mode (viewport < 640px): chỉ icon màu + nhãn ngắn
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]\* 3.2 Viết unit tests cho AnomalyLegend (`AnomalyLegend.test.tsx`)
    - Test render đủ 3 mục màu
    - Test compact mode chỉ hiện nhãn ngắn
    - _Requirements: 2.2, 2.3_

- [x] 4. Implement RollGridItem với truncate và anomaly tooltip
  - [x] 4.1 Refactor `RollGridItem.tsx`
    - `roll_number` dài > 8 ký tự → thêm class `truncate` + `<Tooltip>` hiện full text
    - Khi `anomalyStatus` là `light`/`heavy` và có `standardWeightKg` → Tooltip hiện `"Nhẹ hơn chuẩn X%"` / `"Nặng hơn chuẩn X%"` dùng `calcDeviationPercent`
    - _Requirements: 2.5, 6.6_

  - [ ]\* 4.2 Viết property tests cho RollGridItem (`RollGridItem.test.tsx`)
    - **Property 5: Anomaly tooltip chứa deviation percentage** — tooltip text chứa % từ `calcDeviationPercent`
    - **Validates: Requirements 2.5**
    - **Property 12: roll_number dài > 8 ký tự luôn có truncate và tooltip** — class `truncate` + tooltip present
    - **Validates: Requirements 6.6**
    - Dùng `fc.string({ minLength: 9 })` để generate roll_number dài

- [x] 5. Implement LotMatrixCard
  - [x] 5.1 Refactor `LotMatrixCard.tsx`
    - Thêm props `lotIndex: number`, `totalLots: number`, `standardWeightKg?: number`
    - Header: `flex flex-col sm:flex-row` — tránh overflow mobile
    - Hiển thị `"LOT {lotIndex}/{totalLots}"` ở header
    - Render `<AnomalyLegend compact={isMobile} />` chỉ khi `standardWeightKg` được cung cấp (không undefined/null/0)
    - Grid: `grid grid-cols-5 md:grid-cols-10` — bỏ inline style
    - _Requirements: 2.1, 2.4, 4.4, 6.1, 6.2, 6.4_

  - [ ]\* 5.2 Viết property tests cho LotMatrixCard (`LotMatrixCard.test.tsx`)
    - **Property 4: Legend hiển thị khi và chỉ khi có standardWeightKg** — conditional render đúng
    - **Validates: Requirements 2.4**
    - **Property 10: LOT index format đúng** — header chứa pattern `"LOT {lotIndex}/{totalLots}"`
    - **Validates: Requirements 4.4**

- [x] 6. Checkpoint — Đảm bảo các tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement FilterBar nâng cấp
  - [x] 7.1 Refactor `FilterBar.tsx`
    - Thêm props `fabricTypeOptions: string[]`, `resultCount?: number`
    - Thay input "Loại vải" bằng shadcn `Combobox` với autocomplete, lọc gợi ý trong 300ms
    - Thay input "Mã cuộn" bằng `Input` với `useDebounce(400)` — trigger filter khi ngừng gõ, không cần blur
    - Hiển thị nút "Xóa lọc" khi `isAnyFilterActive(value) === true`
    - Hiển thị `"Đang hiển thị {resultCount} cuộn"` khi filter active và `resultCount !== undefined`
    - Layout: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.5_

  - [ ]\* 7.2 Viết property tests cho FilterBar (`FilterBar.test.tsx`)
    - **Property 6: Nút Xóa lọc hiện khi có filter active** — render nút khi ít nhất 1 field không rỗng
    - **Validates: Requirements 3.4**
    - **Property 7: Clear filter reset toàn bộ về default** — handler clear trả về FilterState default
    - **Validates: Requirements 3.5**
    - **Property 8: Result count hiển thị khi filter active** — text chứa số kết quả
    - **Validates: Requirements 3.6**

  - [ ]\* 7.3 Viết unit tests cho debounce behavior (`FilterBar.test.tsx`)
    - Test debounce 400ms với `vitest useFakeTimers`
    - Test Combobox gợi ý lọc trong 300ms
    - _Requirements: 3.2, 3.3_

- [x] 8. Implement Pagination
  - [x] 8.1 Refactor `Pagination.tsx`
    - Ẩn hoàn toàn khi `totalPages <= 1`
    - Text: `formatPaginationText(page, totalPages, totalItems)`, `text-sm` (14px)
    - Nút Prev/Next: `min-h-[44px] min-w-[44px]`
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]\* 8.2 Viết unit tests cho Pagination (`Pagination.test.tsx`)
    - Test ẩn khi `totalPages=1`
    - Test render đúng text format
    - Test kích thước nút ≥ 44px
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Implement ActionButtons và ActionMenu mobile
  - [x] 9.1 Tạo `ActionMenu.tsx` mới và refactor ActionButtons trong `RawFabricList.tsx`
    - Desktop (≥ 640px): `[Xuất Excel (icon+tooltip)] [Nhập mẻ (secondary)] [Nhập mới (primary)]`
    - Mobile (< 640px): `[... DropdownMenu] [Nhập mới (primary, full-width)]` — DropdownMenu chứa "Nhập mẻ" và "Xuất Excel"
    - Tooltip cho nút Xuất Excel: `"Xuất Excel (tất cả kết quả hiện tại)"`
    - Khi `isExporting=true`: disable tất cả nút + spinner trên nút Xuất Excel
    - "Nhập mới" luôn là element ngoài cùng bên phải
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]\* 9.2 Viết property test cho ActionButtons (`ActionMenu.test.tsx`)
    - **Property 11: Tất cả nút bị disable khi đang xuất Excel** — `isExporting=true` → tất cả buttons có `disabled`
    - **Validates: Requirements 5.5**
    - Dùng `fc.boolean()` để generate `isExporting` state

  - [ ]\* 9.3 Viết unit tests cho ActionMenu mobile
    - Test mobile overflow menu render khi viewport < 640px (mock `useMediaQuery`)
    - Test "Nhập mới" là last element trong button group
    - _Requirements: 5.2, 5.3_

- [x] 10. Refactor RawFabricList — wiring và overflow fix
  - [x] 10.1 Cập nhật `RawFabricList.tsx`
    - Bọc khu vực lưới LOT trong `overflow-x-hidden`
    - Truyền `lotIndex` (1-based) và `totalLots` vào từng `LotMatrixCard`
    - Truyền `fabricTypeOptions` và `resultCount` vào `FilterBar`
    - Kết nối KpiCard `onClick` → apply filter tương ứng
    - Hiển thị empty state với nút "Xóa bộ lọc" khi danh sách LOT rỗng
    - _Requirements: 3.5, 4.4, 4.5, 5.1, 6.3_

- [x] 11. Checkpoint cuối — Đảm bảo tất cả tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để ra MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Property tests dùng `fast-check` với tối thiểu 100 iterations mỗi property
- Unit tests dùng `vitest` + React Testing Library
- Không thay đổi data model, API, hay business logic — UI-only refactor
