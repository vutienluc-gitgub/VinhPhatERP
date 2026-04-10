# Requirements Document

## Introduction

Codebase hiện tại có hàng chục button được hardcode trực tiếp trong JSX của các feature page, lặp lại cùng một className, cùng Icon, cùng behavior. Feature này extract các pattern lặp lại nhiều nhất thành shared components tái sử dụng, đặt trong `src/shared/components/`, export qua barrel `src/shared/components/index.ts`.

Phạm vi: 4 button pattern cốt lõi:

1. `AddButton` — nút "Thêm mới" ở header của List page
2. `ClearFilterButton` — nút "Xóa lọc" trong filter bar
3. `CancelButton` — nút "Hủy" / "Đóng" trong form footer
4. `ActionBar` — nhận array of action configs, render ra các `btn-icon` buttons trong table row

## Glossary

- **Button_System**: Tập hợp các shared button components được định nghĩa trong feature này
- **AddButton**: Component nút thêm mới, dùng ở header của List page
- **ClearFilterButton**: Component nút xóa bộ lọc, dùng trong filter bar
- **CancelButton**: Component nút hủy/đóng, dùng trong form footer
- **ActionBar**: Component nhận array of `ActionConfig`, render ra các icon buttons trong table row
- **ActionConfig**: Interface mô tả một action: `{ icon, onClick, title?, disabled?, variant? }`
- **List_Page**: Trang hiển thị danh sách dữ liệu (WorkOrderList, SuppliersList, v.v.)
- **Form_Component**: Component form nhập liệu (WeavingInvoiceForm, ShippingRateForm, v.v.)
- **Barrel_Export**: File `src/shared/components/index.ts` tập trung export tất cả shared components
- **IconName**: Kiểu string hợp lệ từ `lucide-react`, được định nghĩa trong `src/shared/components/Icon.tsx`

---

## Requirements

### Requirement 1: AddButton Component

**User Story:** As a developer, I want a shared AddButton component, so that I can replace all hardcoded "Thêm mới" buttons across List pages with a single consistent component.

#### Acceptance Criteria

1. THE Button_System SHALL export một component `AddButton` từ `src/shared/components/index.ts`
2. THE `AddButton` SHALL nhận prop `onClick: () => void` bắt buộc
3. THE `AddButton` SHALL nhận prop `label: string` bắt buộc để hiển thị text
4. THE `AddButton` SHALL nhận prop `icon?: IconName` tùy chọn, mặc định là `"Plus"`
5. THE `AddButton` SHALL nhận prop `disabled?: boolean` tùy chọn, mặc định là `false`
6. THE `AddButton` SHALL render với `className="btn-primary"` và `style={{ minHeight: 42 }}`
7. THE `AddButton` SHALL render Icon với `size={18}` ở bên trái label
8. THE `AddButton` SHALL có `type="button"` để tránh submit form không mong muốn
9. WHEN `disabled` là `true`, THE `AddButton` SHALL có attribute `disabled` trên element `<button>`
10. THE `AddButton` SHALL không sử dụng kiểu `as any` hoặc gây lỗi TypeScript `any`

### Requirement 2: ClearFilterButton Component

**User Story:** As a developer, I want a shared ClearFilterButton component, so that I can replace all hardcoded "Xóa lọc" buttons across filter bars with a single consistent component.

#### Acceptance Criteria

1. THE Button_System SHALL export một component `ClearFilterButton` từ `src/shared/components/index.ts`
2. THE `ClearFilterButton` SHALL nhận prop `onClick: () => void` bắt buộc
3. THE `ClearFilterButton` SHALL nhận prop `label?: string` tùy chọn, mặc định là `"Xóa lọc"`
4. THE `ClearFilterButton` SHALL render với `className="btn-secondary text-danger border-danger/20 flex items-center gap-2"`
5. THE `ClearFilterButton` SHALL render Icon `"X"` với `size={14}` ở bên trái label
6. THE `ClearFilterButton` SHALL có `type="button"`
7. WHEN `label` được truyền vào, THE `ClearFilterButton` SHALL hiển thị label đó thay vì mặc định
8. THE `ClearFilterButton` SHALL không sử dụng kiểu `as any` hoặc gây lỗi TypeScript `any`

### Requirement 3: CancelButton Component

**User Story:** As a developer, I want a shared CancelButton component, so that I can replace all hardcoded "Hủy" / "Đóng" buttons in form footers with a single consistent component.

#### Acceptance Criteria

1. THE Button_System SHALL export một component `CancelButton` từ `src/shared/components/index.ts`
2. THE `CancelButton` SHALL nhận prop `onClick: () => void` bắt buộc
3. THE `CancelButton` SHALL nhận prop `label?: string` tùy chọn, mặc định là `"Hủy"`
4. THE `CancelButton` SHALL nhận prop `disabled?: boolean` tùy chọn, mặc định là `false`
5. THE `CancelButton` SHALL render với `className="btn-secondary"`
6. THE `CancelButton` SHALL có `type="button"` để tránh submit form
7. WHEN `disabled` là `true`, THE `CancelButton` SHALL có attribute `disabled` trên element `<button>`
8. WHEN `label` được truyền vào, THE `CancelButton` SHALL hiển thị label đó thay vì mặc định
9. THE `CancelButton` SHALL không sử dụng kiểu `as any` hoặc gây lỗi TypeScript `any`

### Requirement 4: ActionBar Component

**User Story:** As a developer, I want a shared ActionBar component that accepts an array of action configs, so that I can replace all hardcoded icon button groups in table rows with a single declarative component.

#### Acceptance Criteria

1. THE Button_System SHALL export một interface `ActionConfig` từ `src/shared/components/index.ts`
2. THE `ActionConfig` SHALL có các fields: `icon: IconName` (bắt buộc), `onClick: () => void` (bắt buộc), `title?: string`, `disabled?: boolean`, `variant?: "default" | "danger"`
3. THE Button_System SHALL export một component `ActionBar` từ `src/shared/components/index.ts`
4. THE `ActionBar` SHALL nhận prop `actions: ActionConfig[]` bắt buộc
5. THE `ActionBar` SHALL render một `<div className="flex justify-end gap-1">` bao ngoài
6. THE `ActionBar` SHALL render mỗi action thành một `<button type="button" className="btn-icon">` với Icon `size={16}`
7. WHEN `variant` là `"danger"`, THE `ActionBar` SHALL thêm class `text-danger` vào button đó
8. WHEN `disabled` là `true`, THE `ActionBar` SHALL có attribute `disabled` trên button đó
9. WHEN `title` được truyền vào, THE `ActionBar` SHALL render attribute `title` trên button đó
10. THE `ActionBar` SHALL không sử dụng kiểu `as any` hoặc gây lỗi TypeScript `any`

### Requirement 5: Barrel Export và Không Duplicate

**User Story:** As a developer, I want all button components exported from the barrel file, so that I can import them consistently using `@/shared/components`.

#### Acceptance Criteria

1. THE Barrel_Export SHALL export `AddButton`, `ClearFilterButton`, `CancelButton`, `ActionBar`, `ActionConfig`
2. THE Button_System SHALL đặt mỗi component trong file riêng biệt: `AddButton.tsx`, `ClearFilterButton.tsx`, `CancelButton.tsx`, `ActionBar.tsx`
3. THE Button_System SHALL không duplicate logic — mỗi component chỉ được định nghĩa một lần
4. WHEN một feature page import button component, THE feature page SHALL import từ `@/shared/components`, không dùng relative import giữa các feature
5. THE Button_System SHALL không tạo circular dependency giữa shared components

### Requirement 6: Migration — Thay thế Hardcode

**User Story:** As a developer, I want existing hardcoded buttons replaced with shared components, so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. THE Button_System SHALL thay thế tất cả `btn-primary min-h-[42px]` button ở header của List pages bằng `AddButton`
2. THE Button_System SHALL thay thế tất cả `btn-secondary text-danger border-danger/20 flex items-center gap-2` button trong filter bar bằng `ClearFilterButton`
3. THE Button_System SHALL thay thế tất cả `btn-secondary` cancel button trong form footer bằng `CancelButton`
4. THE Button_System SHALL thay thế tất cả nhóm `btn-icon` action buttons trong table row bằng `ActionBar`
5. WHEN migration hoàn tất, THE Button_System SHALL không còn hardcode pattern `btn-primary min-h-[42px] px-6` trong feature pages
6. WHEN migration hoàn tất, THE Button_System SHALL không còn hardcode pattern `btn-secondary text-danger border-danger/20 flex items-center gap-2` trong feature pages

### Requirement 7: Type Safety và Code Quality

**User Story:** As a developer, I want all button components to be fully type-safe, so that TypeScript catches misuse at compile time.

#### Acceptance Criteria

1. THE Button_System SHALL pass `npm run typecheck` mà không có lỗi mới sau khi implement
2. THE Button_System SHALL pass `npm run lint` mà không có warning mới sau khi implement
3. THE Button_System SHALL không sử dụng `as any` ở bất kỳ đâu trong các file component mới
4. THE Button_System SHALL không gây ra lỗi TypeScript `implicit any`
5. WHEN prop `icon` của `ActionBar` nhận giá trị không hợp lệ, THE TypeScript compiler SHALL báo lỗi tại compile time
6. THE Button_System SHALL sử dụng `IconName` type từ `src/shared/components/Icon.tsx` cho tất cả prop liên quan đến icon name
