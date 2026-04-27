/**
 * PreferencesContext
 *
 * Cung cấp user preferences cho toàn bộ app tree.
 * Provider được đặt trong AppShell (đã có userId từ useAuth).
 *
 * Usage:
 *   const { prefs, toggleTheme, setFluidLayout } = usePreferences();
 */
import { createContext, useContext } from 'react';

import type { UserPreferences } from '@/shared/hooks/useUserPreferences';

// ─── Context type ─────────────────────────────────────────────────────────────

export interface PreferencesContextValue {
  prefs: UserPreferences;
  toggleTheme: () => void;
  setFluidLayout: (isFluid: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarGroupsCollapsed: (groups: Record<string, boolean>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const PreferencesContext = createContext<PreferencesContextValue | null>(
  null,
);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error(
      'usePreferences phai duoc dung ben trong <PreferencesProvider> (AppShell)',
    );
  return ctx;
}
