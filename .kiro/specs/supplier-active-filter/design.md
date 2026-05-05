# Tài liệu Thiết kế — Bộ lọc Mặc định Nhà cung cấp Đang giao dịch

## Tổng quan kiến trúc

Tính năng được triển khai hoàn toàn ở **presentation layer** — không yêu cầu thay đổi API hay database. Mô hình đơn giản:

```
SuppliersPage
  └── SuppliersList  ← Nơi thay đổi chính
        ├── useUrlFilterState (có mở rộng)
        ├── FilterBar
        ├── KPI Section
        └── DataTableAdvanced
```

## Thay đổi kỹ thuật

### 1. Mở rộng `useUrlFilterState` để hỗ trợ default values

**File:** `src/shared/hooks/useUrlFilterState.ts`

**Vấn đề hiện tại:**

- Hook không hỗ trợ giá trị mặc định khi URL không có param
- Không phân biệt được "không có ?status" (cần default) vs "?status=" (rỗng, xem tất cả)

**Giải pháp:** Thêm parameter `defaults` và logic xử lý:

```typescript
export function useUrlFilterState<K extends string>(
  keys: readonly K[],
  defaults?: Partial<Record<K, string>>,
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) {
      const rawValue = searchParams.get(key);
      // Key có trên URL → dùng giá trị URL (kể cả rỗng)
      if (rawValue !== null) {
        result[key] = rawValue || undefined;
      }
      // Key không có trên URL → dùng default nếu có
      else if (defaults && key in defaults) {
        result[key] = defaults[key as K];
      }
    }
    return result;
  }, [searchParams, keys, defaults]);

  // ... rest unchanged
}
```

**Lưu ý quan trọng:**

- `searchParams.get('status') === null` → không có param, áp dụng default
- `searchParams.get('status') === ''` → có param rỗng (`?status=`), không áp dụng default

### 2. Cập nhật `SuppliersList` để sử dụng default filter

**File:** `src/features/suppliers/SuppliersList.tsx`

**Thay đổi:**

```typescript
// Trước
const { filters, setFilter, clearFilters } = useUrlFilterState([
  'search',
  'category',
  'status',
]);

// Sau
const { filters, setFilter, clearFilters } = useUrlFilterState(
  ['search', 'category', 'status'] as const,
  { status: 'active' }, // ← Default: chỉ hiện NCC đang giao dịch
);
```

### 3. Thêm View All Chip

**File:** `src/features/suppliers/SuppliersList.tsx`

**Vị trí:** Hiển thị dưới FilterBar khi bộ lọc status đang là 'active' (từ default hoặc user chọn).

**Component mới:** `ViewAllChip`

```tsx
function ViewAllChip({
  totalCount,
  onClear,
}: {
  totalCount: number;
  onClear: () => void;
}) {
  if (totalCount === 0) return null;

  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-sm 
                 text-muted-foreground hover:text-foreground 
                 bg-muted/50 hover:bg-muted rounded-full 
                 transition-colors cursor-pointer"
    >
      <span>Xem tất cả</span>
      <span className="text-xs font-medium">({totalCount})</span>
    </button>
  );
}
```

**Placement trong JSX:**

```tsx
{
  /* Filter (Config-Driven) */
}
<FilterBar
  schema={filterSchema}
  value={filters}
  onChange={handleFilterChange}
  onClear={() => {
    clearFilters();
    setPage(1);
  }}
/>;

{
  /* View All Chip - chỉ hiện khi status = 'active' (từ default hoặc user chọn) */
}
{
  filters.status === 'active' && (
    <div className="px-4 pb-2">
      <ViewAllChip
        totalCount={result?.total ?? 0}
        onClear={() => setFilter('status', undefined)}
      />
    </div>
  );
}
```

### 4. Sửa KPI Dashboard

**Vấn đề hiện tại:**

```tsx
// Sai: chỉ đếm trên trang hiện tại
{
  suppliers.filter((s) => s.status === 'active').length;
}
```

**Giải pháp:** Thêm API call để lấy tổng số NCC active

**Option A (Recommended):** Thêm hook mới để fetch KPI stats

```typescript
// src/application/crm/useSuppliers.ts
export function useSupplierStats() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'stats'],
    queryFn: fetchSupplierStats,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });
}

// src/api/suppliers.api.ts
export async function fetchSupplierStats(): Promise<{
  total: number;
  active: number;
}> {
  const { count: total, error: err1 } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true });

  const { count: active, error: err2 } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (err1 || err2) throw err1 || err2;

  return { total: total ?? 0, active: active ?? 0 };
}
```

**Option B (Simpler):** Tận dụng query đã có với filter khác

```tsx
// Trong SuppliersList.tsx
const { data: allSuppliersResult } = useSuppliersList({}, 1, {
  enabled: true,
  staleTime: 60000,
});
// Note: API cần expose total count từ query không filter
```

**Recommendation:** Sử dụng Option A vì:

- Không thay đổi behavior của API hiện tại
- Cache riêng, không ảnh hưởng performance
- Dễ test và maintain

**Cập nhật KPI Section:**

```tsx
const { data: stats } = useSupplierStats();

// KPI Dashboard
<div className="kpi-section kpi-grid">
  <div className="kpi-card-premium kpi-primary">
    <div className="kpi-overlay" />
    <div className="kpi-content">
      <div className="kpi-info">
        <p className="kpi-label">Tổng nhà cung cấp</p>
        <p className="kpi-value">{stats?.total ?? result?.total ?? 0}</p>
      </div>
      <div className="kpi-icon-box">
        <Icon name="Truck" size={32} />
      </div>
    </div>
    <div className="kpi-footer text-xs opacity-80 italic">
      Đối tác cung cấp vật tư
    </div>
  </div>

  <div className="kpi-card-premium kpi-success">
    <div className="kpi-overlay" />
    <div className="kpi-content">
      <div className="kpi-info">
        <p className="kpi-label">Đang giao dịch</p>
        <p className="kpi-value">{stats?.active ?? 0}</p>
      </div>
      <div className="kpi-icon-box">
        <Icon name="CheckCircle" size={32} />
      </div>
    </div>
    <div className="kpi-footer text-xs opacity-80 italic">
      Trạng thái hoạt động
    </div>
  </div>
</div>;
```

### 5. Empty State Context-Aware

**File:** `src/features/suppliers/SuppliersList.tsx`

**Logic cập nhật:**

```tsx
// Determining empty state
const isDefaultFilterActive =
  filters.status === 'active' && !filters.search && !filters.category;
const isEmptyFromDefaultFilter =
  isDefaultFilterActive && suppliers.length === 0;

// Trong DataTableAdvanced
<DataTableAdvanced
  // ...
  emptyStateTitle={
    isEmptyFromDefaultFilter
      ? 'Không có nhà cung cấp đang giao dịch'
      : hasFilter
        ? 'Không tìm thấy nhà cung cấp'
        : 'Chưa có nhà cung cấp'
  }
  emptyStateDescription={
    isEmptyFromDefaultFilter
      ? 'Tất cả nhà cung cấp hiện đang ngưng hợp tác.'
      : hasFilter
        ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
        : 'Nhấn nút thêm nhà cung cấp mới để lưu trữ thông tin liên hệ.'
  }
  emptyStateIcon={isEmptyFromDefaultFilter || hasFilter ? 'Search' : 'Truck'}
  emptyStateActionLabel={!hasFilter ? '+ Thêm NCC mới' : undefined}
  onEmptyStateAction={!hasFilter ? onNew : undefined}
/>;
```

## Chi tiết Implementation

### Thứ tự thực hiện

| Thứ tự | Task                                        | File                                       | Độ phức tạp |
| ------ | ------------------------------------------- | ------------------------------------------ | ----------- |
| 1      | Mở rộng `useUrlFilterState` với defaults    | `src/shared/hooks/useUrlFilterState.ts`    | Trung bình  |
| 2      | Thêm `useSupplierStats` hook                | `src/application/crm/useSuppliers.ts`      | Thấp        |
| 3      | Thêm `fetchSupplierStats` API               | `src/api/suppliers.api.ts`                 | Thấp        |
| 4      | Cập nhật `SuppliersList` với default filter | `src/features/suppliers/SuppliersList.tsx` | Trung bình  |
| 5      | Thêm `ViewAllChip` component                | `src/features/suppliers/SuppliersList.tsx` | Thấp        |
| 6      | Sửa KPI Dashboard                           | `src/features/suppliers/SuppliersList.tsx` | Thấp        |
| 7      | Cập nhật empty state logic                  | `src/features/suppliers/SuppliersList.tsx` | Thấp        |

### Edge Cases

#### 1. URL có `?status=` (empty string)

- `searchParams.get('status')` trả về `''`
- Hook sẽ treat như "user muốn xem tất cả"
- Không áp dụng default, không hiện ViewAllChip

#### 2. URL có `?status=inactive`

- Fallback bình thường, filter theo inactive
- Không hiện ViewAllChip

#### 3. URL có `?status=active&search=abc`

- Filter theo active + search
- Vẫn hiện ViewAllChip (click sẽ clear status nhưng giữ search)

#### 4. User click ViewAllChip

- `setFilter('status', undefined)` → xóa status khỏi URL
- Table hiển thị tất cả NCC
- ViewAllChip ẩn đi

#### 5. Browser Back button

- `replace: true` đã được dùng → không tạo history entry cho filter changes
- Back sẽ quay về trang trước (không phải filter state trước)

## Testing Strategy

### Unit Tests

**`useUrlFilterState` với defaults:**

```typescript
describe('useUrlFilterState with defaults', () => {
  it('should apply default when param not in URL', () => {
    // URL: /suppliers
    // Result: { status: 'active' }
  });

  it('should not apply default when param is empty string', () => {
    // URL: /suppliers?status=
    // Result: { status: undefined }
  });

  it('should not apply default when param has value', () => {
    // URL: /suppliers?status=inactive
    // Result: { status: 'inactive' }
  });
});
```

**ViewAllChip:**

```typescript
describe('ViewAllChip', () => {
  it('should render when status=active', () => {});
  it('should not render when status is not active', () => {});
  it('should call onClear when clicked', () => {});
  it('should show correct total count', () => {});
});
```

### Integration Tests

**SuppliersPage flow:**

```typescript
describe('SuppliersPage default filter', () => {
  it('should show only active suppliers on initial load', () => {});
  it('should show ViewAllChip with total count', () => {});
  it('should clear status filter when ViewAllChip clicked', () => {});
  it('should maintain filter state on URL after page reload', () => {});
});
```

## Rollback Plan

Nếu có issues sau deploy:

1. **Default filter gây confusion:** Remove default parameter trong `useUrlFilterState` call
2. **ViewAllChip không hoạt động:** Remove component, vẫn dùng FilterBar để clear
3. **KPI stats chậm:** Revert về client-side counting (nhưng sẽ không chính xác)

## Performance Considerations

- `useSupplierStats` cache 5 phút → không spam database
- `useUrlFilterState` đã dùng `useMemo` → không re-render không cần thiết
- ViewAllChip component nhẹ, không ảnh hưởng performance

## Security Considerations

- Không có security concern — chỉ là UI enhancement
- Filter value được validate bởi TypeScript types
- API đã có authentication/authorization layer
