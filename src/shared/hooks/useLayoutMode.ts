/**
 * useFluidDashboard — DEPRECATED internal state.
 *
 * Shim tương thích ngược. Logic thật đã chuyển sang useUserPreferences.
 * Chỉ dùng khi cần đọc fluid state ngoài AppShell context.
 *
 * @deprecated Dùng PreferencesContext.prefs.fluid_layout thay thế.
 */
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'erp-fluid-dashboard';

export function useFluidDashboard() {
  const [isFluid, setIsFluidLocal] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isFluid));
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle('fluid', isFluid);
    window.dispatchEvent(new Event('layout-mode-changed'));
  }, [isFluid]);

  return { isFluid, setIsFluid: setIsFluidLocal };
}
