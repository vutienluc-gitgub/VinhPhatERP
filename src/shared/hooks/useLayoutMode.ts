import { useEffect, useState } from 'react';

const STORAGE_KEY = 'erp-fluid-dashboard';

export function useFluidDashboard() {
  const [isFluid, setIsFluid] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isFluid));
    document.documentElement.classList.toggle('fluid', isFluid);
    window.dispatchEvent(new Event('layout-mode-changed'));
  }, [isFluid]);

  return { isFluid, setIsFluid };
}
