import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debounced value - trì hoãn cập nhật giá trị.
 * Dùng cho ô tìm kiếm để tránh spam API khi user type liên tục.
 *
 * @param value Giá trị cần debounce
 * @param delay Thời gian trì hoãn (ms)
 * @returns Giá trị đã được debounce
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 500);
 * // debouncedSearch chỉ cập nhật sau 500ms kể từ lần type cuối
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook cho debounced callback - trì hoãn gọi hàm.
 * Giữ reference ổn định để tránh reset timer liên tục.
 *
 * @param callback Hàm cần debounce
 * @param delay Thời gian trì hoãn (ms)
 * @returns Function để gọi với debounce
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: TArgs) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
