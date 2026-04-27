import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useUrlFilterState — URL-backed filter state management.
 *
 * Drop-in replacement cho useFilterState khi cần persist filter lên URL.
 * User có thể bookmark, share link, hoặc dùng F5 mà không mất filter.
 *
 * Interface trả về tương thích 100% với FilterBarPremium props,
 * giống hệt useFilterState — chỉ thay đổi nơi lưu trữ (URL thay vì memory).
 *
 * Dùng `replace: true` để tránh đẩy mỗi thay đổi filter vào browser history,
 * giữ nút Back hoạt động đúng (quay về trang trước, không quay về filter cũ).
 *
 * @param keys Danh sách key hợp lệ — chỉ những key này được đọc/ghi từ URL.
 *             Bắt buộc khai báo để tránh đọc nhầm params không liên quan
 *             (ví dụ: `action`, `bom_id` từ deep-link khác).
 *
 * @example
 * const { filters, setFilter, clearFilters } = useUrlFilterState([
 *   'search', 'status', 'from_date', 'to_date',
 * ]);
 *
 * <FilterBarPremium
 *   schema={filterSchema}
 *   value={filters}
 *   onChange={setFilter}
 *   onClear={clearFilters}
 * />
 */
export function useUrlFilterState(keys: readonly string[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  /** Đọc filter từ URL — chỉ lấy các key đã khai báo. */
  const filters = useMemo(() => {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) {
      const value = searchParams.get(key);
      result[key] = value ?? undefined;
    }
    return result;
  }, [searchParams, keys]);

  /**
   * Cập nhật 1 trường filter. Tương thích với FilterBarPremium onChange.
   * Giá trị rỗng ('') sẽ được xoá khỏi URL thay vì lưu ?key=.
   * Dùng `replace: true` để không spam browser history.
   */
  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /** Reset toàn bộ filter — xoá tất cả key đã khai báo khỏi URL. */
  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const key of keys) {
          next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams, keys]);

  /** True nếu có bất kỳ filter nào đang active trên URL. */
  const hasActiveFilter = keys.some((key) => {
    const value = searchParams.get(key);
    return value !== null && value !== '';
  });

  return { filters, setFilter, clearFilters, hasActiveFilter };
}
