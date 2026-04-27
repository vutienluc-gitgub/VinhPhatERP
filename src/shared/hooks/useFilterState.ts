import { useCallback, useState } from 'react';

/**
 * useFilterState — Hook đóng gói logic quản lý bộ lọc.
 *
 * Loại bỏ boilerplate lặp ~5 dòng ở 20+ component list.
 * Interface trả về tương thích trực tiếp với FilterBarPremium props.
 *
 * @example
 * const { filters, setFilter, clearFilters } = useFilterState<MyFilter>();
 *
 * <FilterBarPremium
 *   schema={filterSchema}
 *   value={filters}
 *   onChange={setFilter}
 *   onClear={clearFilters}
 * />
 */
export function useFilterState<T extends Record<string, string | undefined>>(
  initial?: Partial<T>,
) {
  const [filters, setFilters] = useState<T>((initial ?? {}) as T);

  /**
   * Cập nhật 1 trường filter. Tương thích với FilterBarPremium onChange.
   * Giá trị rỗng ('') sẽ được chuẩn hoá thành undefined.
   */
  const setFilter = useCallback((key: string, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  /** Reset toàn bộ filter về trạng thái ban đầu. */
  const clearFilters = useCallback(() => {
    setFilters((initial ?? {}) as T);
  }, [initial]);

  /** True nếu có bất kỳ filter nào đang active. */
  const hasActiveFilter = Object.values(filters).some(
    (v) => v !== undefined && v !== '',
  );

  return { filters, setFilter, clearFilters, hasActiveFilter };
}
