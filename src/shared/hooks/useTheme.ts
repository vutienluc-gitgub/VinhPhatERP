/**
 * useTheme — DEPRECATED internal state.
 *
 * Đây là shim tương thích ngược. Logic thật nằm trong useUserPreferences.
 * Chỉ dùng hook này ở AppShell (đã được truyền vào). Component khác không
 * nên gọi trực tiếp — dùng PreferencesContext thay thế.
 *
 * @deprecated Dùng PreferencesContext hoặc useUserPreferences trong AppShell.
 */
import { useEffect, useState } from 'react';

import { applyThemeToDom, readSystemTheme } from '@/shared/utils/theme-utils';

const LS_LEGACY_KEY = 'vinhphat-theme';

/** Đọc theme từ cache cũ hoặc system preference — dùng để boot tránh flash. */
function readBootTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(LS_LEGACY_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* ignore */
  }
  return readSystemTheme();
}

/**
 * Standalone fallback — chỉ dùng cho các context chưa migrate sang
 * useUserPreferences (ví dụ: trang login chưa có userId).
 */
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(readBootTheme);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return { theme, toggleTheme };
}
