import { useState, useCallback, useRef } from 'react';
import type { VisibilityState } from '@tanstack/react-table';

const LS_PREFIX = 'vp-col-vis';

/**
 * Đọc VisibilityState đã lưu từ localStorage.
 * Trả về {} nếu chưa có hoặc parse lỗi.
 */
function readStoredVisibility(storageKey: string): VisibilityState {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}:${storageKey}`);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as VisibilityState;
      }
    }
  } catch {
    /* ignore parse errors */
  }
  return {};
}

/** Ghi VisibilityState xuống localStorage. */
function writeStoredVisibility(
  storageKey: string,
  state: VisibilityState,
): void {
  try {
    localStorage.setItem(`${LS_PREFIX}:${storageKey}`, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Hook lưu trạng thái ẩn/hiện cột vào localStorage.
 *
 * - Khi `storageKey` được cung cấp → khởi tạo từ localStorage,
 *   mỗi lần thay đổi tự động ghi xuống.
 * - Khi `storageKey` undefined → hoạt động như `useState({})` bình thường,
 *   không đọc/ghi localStorage.
 */
export function usePersistedColumnVisibility(storageKey?: string) {
  const keyRef = useRef(storageKey);
  keyRef.current = storageKey;

  const [columnVisibility, setColumnVisibilityRaw] = useState<VisibilityState>(
    () => (storageKey ? readStoredVisibility(storageKey) : {}),
  );

  const setColumnVisibility = useCallback(
    (
      updater: VisibilityState | ((prev: VisibilityState) => VisibilityState),
    ) => {
      setColumnVisibilityRaw((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (keyRef.current) {
          writeStoredVisibility(keyRef.current, next);
        }
        return next;
      });
    },
    [],
  );

  return [columnVisibility, setColumnVisibility] as const;
}
