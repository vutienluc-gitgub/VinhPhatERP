# Tài liệu Yêu cầu — Bộ lọc Mặc định Nhà cung cấp Đang giao dịch

## Giới thiệu

Trang danh sách Nhà cung cấp (Suppliers) hiện tại hiển thị toàn bộ 44 NCC, bao gồm cả những NCC đã ngừng hợp tác. Đối với nhân viên mua hàng (Purchaser), 90% thao tác hàng ngày chỉ liên quan đến ~18 NCC đang giao dịch. Việc phải lướt qua danh sách đầy đủ gây lãng phí thời gian và tạo ra nhiễu thông tin (noise).

Tính năng này giải quyết vấn đề bằng cách:

1. Mặc định bộ lọc trạng thái là "Đang giao dịch" khi vào trang — bảng chỉ hiển thị NCC đang hoạt động.
2. Cung cấp một chip/nút "Xem tất cả" kèm tổng số NCC để người dùng (thủ kho, kế toán) có thể xem lịch sử khi cần.

Tính năng tận dụng cơ chế `useUrlFilterState` hiện có — bộ lọc được lưu trên URL, cho phép bookmark và chia sẻ link.

---

## Bảng thuật ngữ

- **SuppliersList**: Component danh sách nhà cung cấp tại `src/features/suppliers/SuppliersList.tsx`
- **Filter_Bar**: Thanh bộ lọc cấu hình-driven (`FilterBar`) hiển thị phía trên bảng dữ liệu
- **Status_Filter**: Trường bộ lọc theo trạng thái NCC (`active` / `inactive`)
- **Default_Filter**: Giá trị bộ lọc được áp dụng tự động khi người dùng vào trang lần đầu (không có tham số URL)
- **Active_Supplier**: Nhà cung cấp có `status = 'active'` (nhãn hiển thị: "Hoạt động" / "Đang giao dịch")
- **Inactive_Supplier**: Nhà cung cấp có `status = 'inactive'` (nhãn hiển thị: "Ngưng hợp tác")
- **View_All_Chip**: Chip/nút hiển thị tổng số NCC và cho phép xóa bộ lọc trạng thái để xem toàn bộ
- **URL_Filter_State**: Cơ chế lưu trạng thái bộ lọc trên URL query params (`useUrlFilterState`)
- **Purchaser**: Nhân viên mua hàng — người dùng chính của trang NCC, quan tâm đến NCC đang giao dịch
- **KPI_Dashboard**: Khu vực thẻ KPI phía trên bảng, hiển thị tổng số NCC và số NCC đang giao dịch

---

## Yêu cầu

### Yêu cầu 1: Bộ lọc mặc định "Đang giao dịch"

**User Story:** As a Purchaser, I want the supplier list to show only active suppliers by default, so that I can immediately see the suppliers I work with without manually applying a filter every time.

#### Tiêu chí chấp nhận

1. WHEN a user navigates to the Suppliers page with no `status` parameter in the URL, THE SuppliersList SHALL initialize the Status_Filter with value `active`.
2. WHEN the Default_Filter is active, THE SuppliersList SHALL display only Active_Suppliers in the data table.
3. WHEN the Default_Filter is active, THE SuppliersList SHALL display the Status_Filter field in the Filter_Bar with `active` pre-selected, so the user can see which filter is applied.
4. WHEN a user navigates to the Suppliers page with an explicit `status` parameter in the URL (e.g., `?status=inactive` or `?status=`), THE SuppliersList SHALL use the URL value instead of the Default_Filter.
5. THE SuppliersList SHALL NOT apply the Default_Filter if the URL already contains a `status` query parameter, including an empty value representing "all".

---

### Yêu cầu 2: Chip "Xem tất cả"

**User Story:** As a warehouse staff or accountant, I want a quick way to view all suppliers including inactive ones, so that I can access historical supplier data without navigating through filter controls.

#### Tiêu chí chấp nhận

1. WHILE the Default_Filter is active (Status_Filter = `active`), THE SuppliersList SHALL display a View_All_Chip showing the total count of all suppliers (e.g., "Xem tất cả (44)").
2. WHEN a user clicks the View_All_Chip, THE SuppliersList SHALL clear the Status_Filter and display all suppliers regardless of status.
3. WHEN a user clicks the View_All_Chip, THE SuppliersList SHALL update the URL to reflect the cleared status filter, so the "all suppliers" view is bookmarkable and shareable.
4. WHEN the Status_Filter is cleared (showing all suppliers), THE SuppliersList SHALL hide the View_All_Chip.
5. THE View_All_Chip SHALL display the total count of all suppliers (active + inactive combined), not the count of currently filtered results.
6. THE View_All_Chip SHALL be visually distinct from primary action buttons — rendered as a small secondary chip/badge, consistent with the project's design token system.

---

### Yêu cầu 3: Tổng số NCC trong View_All_Chip phản ánh dữ liệu thực

**User Story:** As a user, I want the "Xem tất cả" chip to show an accurate total count, so that I know how many suppliers exist in the system before deciding to expand the view.

#### Tiêu chí chấp nhận

1. THE SuppliersList SHALL fetch or derive the total count of all suppliers (regardless of current filter) to display in the View_All_Chip.
2. WHEN the total supplier count changes (e.g., a new supplier is added), THE View_All_Chip SHALL reflect the updated count without requiring a page reload.
3. IF the total supplier count cannot be determined, THEN THE SuppliersList SHALL display the View_All_Chip without a count (e.g., "Xem tất cả") rather than showing an incorrect number.

---

### Yêu cầu 4: Tương thích với URL_Filter_State và điều hướng

**User Story:** As a user, I want the default filter behavior to work correctly with browser navigation (back/forward) and bookmarks, so that my filter state is preserved as expected.

#### Tiêu chí chấp nhận

1. WHEN a user bookmarks the Suppliers page URL without query parameters, THE SuppliersList SHALL apply the Default_Filter on revisit, showing only Active_Suppliers.
2. WHEN a user bookmarks the Suppliers page URL with `?status=` (empty) or `?status=inactive`, THE SuppliersList SHALL respect the bookmarked URL value and not override it with the Default_Filter.
3. WHEN a user applies a filter change via the Filter_Bar, THE SuppliersList SHALL update the URL using `replace: true` to avoid polluting browser history, consistent with the existing `useUrlFilterState` behavior.
4. WHEN a user presses the browser Back button from the Suppliers page, THE SuppliersList SHALL navigate to the previous page (not to a previous filter state), consistent with the existing `useUrlFilterState` behavior.

---

### Yêu cầu 5: Trạng thái rỗng phù hợp với bộ lọc mặc định

**User Story:** As a user, I want the empty state message to be contextually accurate when the default filter is active, so that I understand why no suppliers are shown.

#### Tiêu chí chấp nhận

1. WHEN the Default_Filter is active and no Active_Suppliers exist, THE SuppliersList SHALL display an empty state message indicating no active suppliers are found (e.g., "Không có nhà cung cấp đang giao dịch").
2. WHEN the Default_Filter is active and no Active_Suppliers exist, THE SuppliersList SHALL display the View_All_Chip so the user can check if inactive suppliers exist.
3. WHEN a user-applied filter (not the Default_Filter) returns no results, THE SuppliersList SHALL display the existing "Không tìm thấy nhà cung cấp" empty state message.
4. WHEN no filters are active and no suppliers exist at all, THE SuppliersList SHALL display the existing "Chưa có nhà cung cấp" empty state with the add-new action button.

---

### Yêu cầu 6: KPI Dashboard phản ánh đúng ngữ cảnh

**User Story:** As a Purchaser, I want the KPI cards to remain accurate regardless of the active filter, so that I always see the true totals for the business.

#### Tiêu chí chấp nhận

1. THE KPI_Dashboard SHALL always display the total count of ALL suppliers (unfiltered) in the "Tổng nhà cung cấp" KPI card, regardless of the active Status_Filter.
2. THE KPI_Dashboard SHALL always display the count of Active_Suppliers in the "Đang giao dịch" KPI card, regardless of the active Status_Filter.
3. WHEN the Default_Filter is active, THE KPI_Dashboard SHALL NOT change its displayed values — KPI counts are global, not filtered.
