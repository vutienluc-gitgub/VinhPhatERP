# Design Document: Tối ưu UX Màn hình Kho Vải Mộc

## Overview

Tài liệu này mô tả thiết kế kỹ thuật cho việc tối ưu UX màn hình "Quản lý cuộn vải mộc" trong ERP Sản xuất. Mục tiêu là cải thiện khả năng đọc hiểu, tương tác mobile, và phân cấp thị giác mà không thay đổi data model hay business logic hiện có.

Toàn bộ thay đổi là **UI-only**: refactor component render, thêm Tailwind classes, bổ sung shadcn/ui components (Combobox, Tooltip, Badge). Không có API mới, không thay đổi schema.

---

## Architecture

### Phạm vi thay đổi

```
src/
  components/
    raw-fabric/
      RawFabricList.tsx          ← header buttons, filter bar, pagination, overflow-x-hidden wrapper
      LotMatrixCard.tsx          ← header layout, legend, grid classes
      RollGridItem.tsx           ← truncate + tooltip, anomaly tooltip
      KpiCard.tsx                ← footer label, color semantics, tooltip
      FilterBar.tsx              ← Combobox, debounce input, clear button, result count
      AnomalyLegend.tsx          ← NEW: legend component cho màu anomaly
      Pagination.tsx             ← font size, touch size, hide when 1 page
      ActionMenu.tsx             ← NEW: mobile overflow menu "..."
```

Không tạo thêm context, hook mới ngoài những gì cần thiết cho debounce và filter state.

### Luồng dữ liệu

```
RawFabricList
  ├── FilterBar (filter state, debounce, clear)
  │     └── Combobox (fabric_type autocomplete)
  ├── KpiCard × 3 (click → apply filter)
  ├── [LOT list]
  │     └── LotMatrixCard × N
  │           ├── AnomalyLegend (conditional on standardWeightKg)
  │           └── RollGridItem × M (truncate, anomaly tooltip)
  ├── Pagination (hide when totalPages ≤ 1)
  └── ActionButtons / ActionMenu (mobile overflow)
```

---

## Components and Interfaces

### KpiCard

```typescript
interface KpiCardProps {
  type: 'rolls' | 'length' | 'weight';
  value: number;
  footerLabel: string; // mô tả phạm vi tính toán
  colorVariant: 'primary' | 'success' | 'info';
  onClick?: () => void;
}
```

- `type='rolls'` → `colorVariant='primary'`
- `type='length'` → `colorVariant='success'`; khi `value=0` → màu neutral + tooltip "Chưa có dữ liệu chiều dài"
- `type='weight'` → `colorVariant='info'`
- `footerLabel` ví dụ: `"Chỉ tính cuộn đang trong kho (in_stock)"`

### FilterBar

```typescript
interface FilterState {
  fabricType: string;
  rollCode: string;
  status: RollStatus | '';
  quality: string;
}

interface FilterBarProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  fabricTypeOptions: string[]; // danh sách fabric_type từ kho
  resultCount?: number; // số cuộn đang hiển thị
}
```

- `fabricType` dùng shadcn `Combobox`, lọc gợi ý trong 300ms
- `rollCode` dùng `Input` với `useDebounce(400)`
- Nút "Xóa lọc" hiện khi `isAnyFilterActive(value) === true`
- Result count hiện khi `resultCount !== undefined && isAnyFilterActive(value)`

### AnomalyLegend

```typescript
interface AnomalyLegendProps {
  compact?: boolean; // true khi viewport < 640px
}
```

Luôn hiển thị 3 mục: normal (xám), light (đỏ), heavy (cam). Compact mode chỉ hiện icon màu + nhãn ngắn.

### LotMatrixCard

```typescript
interface LotMatrixCardProps {
  lot: LotData;
  lotIndex: number; // 1-based
  totalLots: number;
  standardWeightKg?: number;
}
```

- Header: `flex flex-col sm:flex-row` — tránh overflow mobile
- Hiển thị `"LOT {lotIndex}/{totalLots}"` ở header
- Render `<AnomalyLegend />` chỉ khi `standardWeightKg` được cung cấp
- Grid: `grid grid-cols-5 md:grid-cols-10` (không dùng inline style)

### RollGridItem

```typescript
interface RollGridItemProps {
  roll: RollData;
  standardWeightKg?: number;
}
```

- `roll_number` dài > 8 ký tự → `truncate` + `<Tooltip>` hiện full text
- Khi `anomalyStatus` là `light` hoặc `heavy` → `<Tooltip>` hiện `"Nhẹ hơn chuẩn X%"` / `"Nặng hơn chuẩn X%"`
- Tính deviation: `Math.abs((roll.weightKg - standardWeightKg) / standardWeightKg * 100).toFixed(1)`

### Pagination

```typescript
interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}
```

- Ẩn hoàn toàn khi `totalPages <= 1`
- Text: `"Trang {page} / {totalPages} — {totalItems} cuộn"`, `text-sm` (14px)
- Nút Prev/Next: `min-h-[44px] min-w-[44px]`

### ActionButtons / ActionMenu

Desktop (≥ 640px):

```
[Xuất Excel (icon)] [Nhập mẻ (secondary)] [Nhập mới (primary)]
```

Mobile (< 640px):

```
[... menu] [Nhập mới (primary, full-width)]
```

`ActionMenu` dùng shadcn `DropdownMenu` chứa "Nhập mẻ" và "Xuất Excel".

---

## Data Models

Không thay đổi data model. Các type hiện có được sử dụng trực tiếp:

```typescript
// Đã tồn tại trong codebase
type AnomalyStatus = 'normal' | 'light' | 'heavy' | 'empty';
type RollStatus =
  | 'in_stock'
  | 'reserved'
  | 'in_process'
  | 'shipped'
  | 'damaged'
  | 'written_off';

interface RollData {
  id: string;
  roll_number: string;
  weightKg: number;
  anomalyStatus: AnomalyStatus;
  status: RollStatus;
}

interface LotData {
  lot_number: string;
  rolls: RollData[];
}
```

Thêm helper function (pure, không side-effect):

```typescript
// Tính % lệch so với chuẩn
function calcDeviationPercent(
  weightKg: number,
  standardWeightKg: number,
): number;

// Kiểm tra có filter nào đang active không
function isAnyFilterActive(filter: FilterState): boolean;

// Format pagination text
function formatPaginationText(
  page: number,
  totalPages: number,
  totalItems: number,
): string;
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Feature này là UI component với pure render functions và helper logic. PBT phù hợp cho các helper functions và conditional render logic (không phụ thuộc external service, behavior thay đổi theo input).

### Property 1: KPI_Card luôn có footer label

_For any_ KpiCardProps với value hợp lệ, component render phải chứa footer label text không rỗng.

**Validates: Requirements 1.1**

### Property 2: KPI_Card màu success khi totalLengthM > 0

_For any_ giá trị `totalLengthM` dương, KPI_Card type `length` phải render với class màu success (không phải neutral hay warning).

**Validates: Requirements 1.3**

### Property 3: KPI_Card click trigger đúng filter

_For any_ loại KPI_Card (rolls/length/weight), khi click vào card, callback `onClick` phải được gọi với đúng filter value tương ứng với loại card đó.

**Validates: Requirements 1.5**

### Property 4: Legend hiển thị khi và chỉ khi có standardWeightKg

_For any_ LotMatrixCard, legend phải xuất hiện trong render output khi và chỉ khi `standardWeightKg` được cung cấp (không undefined/null).

**Validates: Requirements 2.4**

### Property 5: Anomaly tooltip chứa deviation percentage

_For any_ RollGridItem với `anomalyStatus` là `light` hoặc `heavy` và `standardWeightKg` đã biết, tooltip text phải chứa phần trăm lệch tính từ `calcDeviationPercent(roll.weightKg, standardWeightKg)`.

**Validates: Requirements 2.5**

### Property 6: Nút Xóa lọc hiện khi có filter active

_For any_ FilterState có ít nhất một field không rỗng/default, FilterBar phải render nút "Xóa lọc". Ngược lại, khi tất cả fields về default, nút không được xuất hiện.

**Validates: Requirements 3.4**

### Property 7: Clear filter reset toàn bộ về default

_For any_ FilterState không rỗng, sau khi gọi handler clear, FilterState mới phải có tất cả fields bằng giá trị default (empty string / undefined).

**Validates: Requirements 3.5**

### Property 8: Result count hiển thị khi filter active

_For any_ FilterState active với `resultCount` được cung cấp, FilterBar phải render text chứa số lượng kết quả.

**Validates: Requirements 3.6**

### Property 9: Pagination format text đúng

_For any_ bộ giá trị `(page, totalPages, totalItems)` hợp lệ, `formatPaginationText` phải trả về string chứa đủ 3 giá trị theo đúng format `"Trang X / Y — Z cuộn"`.

**Validates: Requirements 4.1**

### Property 10: LOT index format đúng

_For any_ cặp `(lotIndex, totalLots)` hợp lệ, LotMatrixCard header phải render text khớp pattern `"LOT {lotIndex}/{totalLots}"`.

**Validates: Requirements 4.4**

### Property 11: Tất cả nút bị disable khi đang xuất Excel

_For any_ component state với `isExporting=true`, tất cả action buttons (Nhập mới, Nhập mẻ, Xuất Excel) phải có attribute `disabled`.

**Validates: Requirements 5.5**

### Property 12: roll_number dài > 8 ký tự luôn có truncate và tooltip

_For any_ `roll_number` có độ dài lớn hơn 8 ký tự, RollGridItem phải render với class `truncate` và tooltip chứa full `roll_number`.

**Validates: Requirements 6.6**

---

## Error Handling

| Tình huống                                | Xử lý                                                  |
| ----------------------------------------- | ------------------------------------------------------ |
| `fabricTypeOptions` rỗng                  | Combobox hiển thị "Không có gợi ý"                     |
| `resultCount` undefined khi filter active | Ẩn result count text (không crash)                     |
| `standardWeightKg = 0`                    | Treat như undefined, không hiện legend/anomaly tooltip |
| `totalLots = 0`                           | Hiển thị empty state với nút "Xóa bộ lọc"              |
| `isExporting` throw error                 | Re-enable buttons, hiển thị toast error                |
| `roll.weightKg` undefined                 | `anomalyStatus` fallback về `'normal'`                 |

---

## Testing Strategy

### Approach

Feature này là UI component thuần túy với helper functions có logic rõ ràng. Dùng **dual testing**:

- **Unit/Example tests**: Kiểm tra specific cases, edge cases, CSS classes
- **Property-based tests**: Kiểm tra universal properties trên helper functions và conditional render logic

### Property-Based Testing

Library: **fast-check** (TypeScript, phù hợp với React Testing Library)

Mỗi property test chạy tối thiểu **100 iterations**.

Tag format: `// Feature: kho-vai-moc-ux, Property {N}: {property_text}`

Các property test tập trung vào:

- `calcDeviationPercent` — pure function, dễ test với arbitrary numbers
- `isAnyFilterActive` — pure function, test với arbitrary FilterState
- `formatPaginationText` — pure function, test với arbitrary page/total values
- Conditional render logic (legend, clear button, result count, truncate)

### Unit Tests (Example-based)

Tập trung vào:

- Render đúng variant class cho từng loại KPI_Card
- Pagination ẩn khi `totalPages=1`
- Empty state khi lots rỗng
- Debounce behavior với fake timers (vitest `useFakeTimers`)
- Mobile overflow menu render khi viewport < 640px (mock `useMediaQuery`)
- Nút "Nhập mới" là last element trong button group

### Integration Tests

Không cần — feature không có external service calls mới.

### Test File Structure

```
src/
  components/raw-fabric/
    __tests__/
      KpiCard.test.tsx
      FilterBar.test.tsx
      AnomalyLegend.test.tsx
      LotMatrixCard.test.tsx
      RollGridItem.test.tsx
      Pagination.test.tsx
      helpers.property.test.ts   ← property tests cho pure functions
```
