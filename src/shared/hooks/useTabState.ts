import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useTabState — URL-backed tab state management.
 *
 * Quản lý `?tab=` param trên URL một cách độc lập với filter params.
 * Cho phép Tab và Filter tồn tại song song mà không xung đột.
 *
 * - Đọc `?tab=` từ URL, validate trong `validTabs`.
 * - Nếu giá trị không hợp lệ → fallback về `defaultTab`.
 * - Dùng `replace: true` để không spam browser history.
 *
 * @param paramKey   Tên param trên URL, mặc định là 'tab'.
 * @param defaultTab Tab mặc định khi không có param hoặc giá trị không hợp lệ.
 * @param validTabs  Danh sách tab keys hợp lệ để validate.
 *
 * @example
 * const { activeTab, setTab } = useTabState('tab', 'all', ['all', 'mine', 'new'] as const);
 */
export function useTabState<T extends string>(
  paramKey: string,
  defaultTab: T,
  validTabs: readonly T[],
): { activeTab: T; setTab: (tab: T) => void } {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawValue = searchParams.get(paramKey);
  const activeTab: T =
    rawValue !== null && (validTabs as readonly string[]).includes(rawValue)
      ? (rawValue as T)
      : defaultTab;

  const setTab = useCallback(
    (tab: T) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === defaultTab) {
            // Xóa param khi về default để URL sạch hơn
            next.delete(paramKey);
          } else {
            next.set(paramKey, tab);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, paramKey, defaultTab],
  );

  return { activeTab, setTab };
}
