/**
 * theme-utils.ts
 *
 * Shared utilities cho theme detection và DOM manipulation.
 * Được dùng bởi useUserPreferences và useTheme (shim).
 * Export ra ngoài để tránh duplicate logic.
 */

/** Đọc system preference (prefers-color-scheme). */
export function readSystemTheme(): 'light' | 'dark' {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
}

/** Áp dụng theme lên `<html>` tag (data-theme attribute). */
export function applyThemeToDom(theme: 'light' | 'dark'): void {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}
