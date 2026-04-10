# Design Document: shared-button-components

## Overview

Feature này extract 4 button pattern lặp lại nhiều nhất trong codebase thành shared components tái sử dụng. Hiện tại mỗi List page, filter bar, và form footer đều hardcode cùng một className, cùng Icon, cùng behavior — dẫn đến code trùng lặp và khó maintain.

Mục tiêu: tạo 4 components (`AddButton`, `ClearFilterButton`, `CancelButton`, `ActionBar`) trong `src/shared/components/`, export qua barrel `src/shared/components/index.ts`, sau đó migrate toàn bộ hardcode patterns hiện có.

Các components này phải:

- Fully type-safe (TypeScript strict mode, không `as any`, không implicit any)
- Sử dụng `IconName` type từ `Icon.tsx`
- Tuân theo CSS classes đã định nghĩa trong `src/styles/data-ui.css`
- Không tạo circular dependency trong shared layer

---

## Architecture

Shared components nằm trong `src/shared/components/` — layer không phụ thuộc vào bất kỳ feature nào. Feature pages import từ `@/shared/components` (barrel), không dùng relative import giữa features.

```
src/shared/components/
  AddButton.tsx          ← mới
  ClearFilterButton.tsx  ← mới
  CancelButton.tsx       ← mới
  ActionBar.tsx          ← mới
  index.ts               ← cập nhật barrel export
  Icon.tsx               ← đã có, cung cấp IconName type
  ViewToggle.tsx         ← pattern tham khảo
  TabSwitcher.tsx        ← pattern tham khảo
```

Dependency flow:

```
Feature Pages
    ↓ import từ @/shared/components
AddButton / ClearFilterButton / CancelButton / ActionBar
    ↓ import
Icon (từ ./Icon)
```

Không có circular dependency vì shared components chỉ import từ cùng layer (`./Icon`), không import từ features.

---

## Components and Interfaces

### AddButton

Dùng ở header của List page để trigger hành động "thêm mới".

```tsx
interface AddButtonProps {
  onClick: () => void;
  label: string;
  icon?: IconName; // default: "Plus"
  disabled?: boolean; // default: false
}
```

Render output:

```html
<button type="button" class="btn-primary" style="minHeight: 42px" [disabled?]>
  <Icon name="{icon}" size="{18}" />
  {label}
</button>
```

### ClearFilterButton

Dùng trong filter bar để reset tất cả filters.

```tsx
interface ClearFilterButtonProps {
  onClick: () => void;
  label?: string; // default: "Xóa lọc"
}
```

Render output:

```html
<button
  type="button"
  class="btn-secondary text-danger border-danger/20 flex items-center gap-2"
>
  <Icon name="X" size="{14}" />
  {label}
</button>
```

Icon luôn là `"X"`, không configurable — đây là design intent của clear filter pattern.

### CancelButton

Dùng trong form footer để hủy/đóng form.

```tsx
interface CancelButtonProps {
  onClick: () => void;
  label?: string; // default: "Hủy"
  disabled?: boolean; // default: false
}
```

Render output:

```html
<button type="button" class="btn-secondary" [disabled?]>{label}</button>
```

Không có icon — cancel button trong form footer thường là text-only theo design system hiện tại.

### ActionConfig (interface) và ActionBar

`ActionConfig` là interface mô tả một action trong table row. `ActionBar` nhận array và render ra các icon buttons.

```tsx
export interface ActionConfig {
  icon: IconName;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}
```

```tsx
interface ActionBarProps {
  actions: ActionConfig[];
}
```

Render output:

```html
<div class="flex justify-end gap-1">
  <!-- for each action: -->
  <button
    type="button"
    class="btn-icon [text-danger if variant=danger]"
    title="{action.title}"
    [disabled if action.disabled]
  >
    <Icon name="{action.icon}" size="{16}" />
  </button>
</div>
```

Design decision: `variant="danger"` thêm class `text-danger` (không phải `danger` — vì `.btn-icon.danger:hover` trong CSS dùng class `danger`, nhưng text color cần `text-danger` Tailwind class để hiển thị màu đỏ ở trạng thái bình thường). Cần verify với CSS hiện có.

---

## Data Models

### ActionConfig

```typescript
export interface ActionConfig {
  icon: IconName; // required — tên icon từ lucide-react
  onClick: () => void; // required — handler khi click
  title?: string; // optional — tooltip text
  disabled?: boolean; // optional — disable button
  variant?: 'default' | 'danger'; // optional — visual variant
}
```

`IconName` được import từ `./Icon` và là `keyof typeof LucideIcons` — đảm bảo TypeScript báo lỗi compile-time nếu truyền icon name không hợp lệ.

### Props types

Mỗi component định nghĩa props interface riêng trong file của nó. Không export props interfaces ra barrel (chỉ export `ActionConfig` vì nó là data model dùng bởi consumer).

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: AddButton rendering invariants

_For any_ combination of valid props passed to `AddButton`, the rendered `<button>` element SHALL always have `type="button"`, contain `"btn-primary"` in its className, have `minHeight: 42` in its style, and render an `<Icon>` with `size={18}`.

**Validates: Requirements 1.6, 1.7, 1.8**

### Property 2: ClearFilterButton rendering invariants

_For any_ valid props passed to `ClearFilterButton`, the rendered `<button>` element SHALL always have `type="button"` and its className SHALL contain `"btn-secondary"`, `"text-danger"`, and `"border-danger/20"`, and SHALL render Icon `"X"` with `size={14}`.

**Validates: Requirements 2.4, 2.5, 2.6**

### Property 3: ClearFilterButton label round-trip

_For any_ non-empty label string passed to `ClearFilterButton`, the rendered output SHALL contain that exact label string as visible text.

**Validates: Requirements 2.7**

### Property 4: CancelButton rendering invariants

_For any_ combination of valid props passed to `CancelButton`, the rendered `<button>` element SHALL always have `type="button"` and contain `"btn-secondary"` in its className.

**Validates: Requirements 3.5, 3.6**

### Property 5: CancelButton label round-trip

_For any_ label string passed to `CancelButton`, the rendered output SHALL contain that exact label string as visible text.

**Validates: Requirements 3.8**

### Property 6: ActionBar structural invariant

_For any_ array of N `ActionConfig` items passed to `ActionBar`, the rendered output SHALL contain exactly N `<button>` elements each with `type="button"` and className containing `"btn-icon"`, each rendering an `<Icon>` with `size={16}`, all wrapped in a `<div>` with className `"flex justify-end gap-1"`.

**Validates: Requirements 4.5, 4.6**

### Property 7: ActionBar ActionConfig fields reflected in rendered buttons

_For any_ `ActionConfig` item, the rendered button SHALL reflect its fields: if `variant="danger"` then button className contains `"text-danger"`; if `disabled=true` then button has `disabled` attribute; if `title` is provided then button has that `title` attribute.

**Validates: Requirements 4.7, 4.8, 4.9**

---

## Error Handling

### Type errors (compile-time)

- Truyền `icon` không hợp lệ vào `AddButton` hoặc `ActionConfig.icon` → TypeScript compiler báo lỗi vì `IconName = keyof typeof LucideIcons`
- Bỏ qua prop bắt buộc (`onClick`, `label` của AddButton, `actions` của ActionBar) → TypeScript compiler báo lỗi
- Truyền `variant` không hợp lệ vào `ActionConfig` → TypeScript compiler báo lỗi vì union type `'default' | 'danger'`

### Runtime edge cases

- `actions=[]` truyền vào `ActionBar` → render wrapper div rỗng, không crash
- `label=""` truyền vào `ClearFilterButton` hoặc `CancelButton` → render button với text rỗng (consumer chịu trách nhiệm truyền label hợp lệ)
- `disabled=true` + `onClick` → button có `disabled` attribute, browser tự ngăn click event, không cần guard trong handler

### Không có async state

Các components này là pure presentational — không có loading state, không có error boundary riêng. Consumer chịu trách nhiệm quản lý `disabled` state khi cần (ví dụ: `disabled={mutation.isPending}`).

---

## Testing Strategy

### PBT applicability assessment

Feature này bao gồm pure presentational React components với clear input/output behavior (props → rendered HTML). Input variation (khác nhau về label, icon, disabled, actions array) ảnh hưởng đến output theo cách có thể verify. PBT phù hợp cho các rendering invariants và round-trip properties.

Library đề xuất: **`@fast-check/vitest`** (fast-check tích hợp với Vitest — stack hiện tại của project).

### Unit tests (example-based)

Các test cụ thể cho behavior không phù hợp với PBT:

- `AddButton` renders với default icon "Plus" khi không truyền `icon` prop
- `AddButton` renders với custom icon khi truyền `icon` prop
- `ClearFilterButton` renders default label "Xóa lọc" khi không truyền `label`
- `CancelButton` renders default label "Hủy" khi không truyền `label`
- `AddButton` với `disabled=true` có `disabled` attribute
- `CancelButton` với `disabled=true` có `disabled` attribute
- `ActionBar` với `actions=[]` renders wrapper div không crash
- Barrel export: tất cả 5 symbols (`AddButton`, `ClearFilterButton`, `CancelButton`, `ActionBar`, `ActionConfig`) được export từ `@/shared/components`

### Property-based tests

Mỗi property test chạy tối thiểu 100 iterations. Tag format: `Feature: shared-button-components, Property {N}: {text}`.

**Property 1** — `AddButton` rendering invariants:

- Generator: arbitrary `label` string + optional `icon` (sample từ valid IconName subset) + optional `disabled` boolean
- Assert: rendered button có `type="button"`, className chứa `"btn-primary"`, style có `minHeight: 42`, có Icon với `size={18}`
- Tag: `Feature: shared-button-components, Property 1: AddButton rendering invariants`

**Property 2** — `ClearFilterButton` rendering invariants:

- Generator: arbitrary optional `label` string
- Assert: rendered button có `type="button"`, className chứa `"btn-secondary"`, `"text-danger"`, `"border-danger/20"`, có Icon `"X"` với `size={14}`
- Tag: `Feature: shared-button-components, Property 2: ClearFilterButton rendering invariants`

**Property 3** — `ClearFilterButton` label round-trip:

- Generator: arbitrary non-empty string làm `label`
- Assert: rendered output chứa label string đó
- Tag: `Feature: shared-button-components, Property 3: ClearFilterButton label round-trip`

**Property 4** — `CancelButton` rendering invariants:

- Generator: arbitrary optional `label` string + optional `disabled` boolean
- Assert: rendered button có `type="button"`, className chứa `"btn-secondary"`
- Tag: `Feature: shared-button-components, Property 4: CancelButton rendering invariants`

**Property 5** — `CancelButton` label round-trip:

- Generator: arbitrary non-empty string làm `label`
- Assert: rendered output chứa label string đó
- Tag: `Feature: shared-button-components, Property 5: CancelButton label round-trip`

**Property 6** — `ActionBar` structural invariant:

- Generator: arbitrary array (length 0–10) của `ActionConfig` objects với valid `icon`, `onClick`, optional fields
- Assert: số lượng rendered buttons = số lượng actions; mỗi button có `type="button"` và `"btn-icon"` class; wrapper div có `"flex justify-end gap-1"`
- Tag: `Feature: shared-button-components, Property 6: ActionBar structural invariant`

**Property 7** — `ActionBar` ActionConfig fields reflected:

- Generator: arbitrary `ActionConfig` với random combination của `variant`, `disabled`, `title`
- Assert: `variant="danger"` → button className chứa `"text-danger"`; `disabled=true` → button có `disabled` attribute; `title` string → button có `title` attribute với giá trị đó
- Tag: `Feature: shared-button-components, Property 7: ActionBar ActionConfig fields reflected`

### Typecheck và lint

Sau mỗi task implement:

- `npm run typecheck` — không có lỗi mới
- `npm run lint` — không có warning mới

Đây là gate bắt buộc trước khi task được đánh dấu complete.
