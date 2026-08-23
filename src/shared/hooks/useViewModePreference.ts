import { useState, useCallback } from 'react';

const STORAGE_PREFIX = 'vp_view_mode_';

/**
 * Hook to persist view mode preferences (e.g., 'table' vs 'grid') per module in localStorage.
 *
 * @param moduleKey - Unique key for the module (e.g., 'raw-fabric', 'finished-fabric', 'crm-leads')
 * @param defaultMode - Default view mode if not previously saved
 * @returns [currentMode, setMode] tuple
 */
export function useViewModePreference<T extends string>(
  moduleKey: string,
  defaultMode: T,
): [T, (mode: T) => void] {
  const storageKey = `${STORAGE_PREFIX}${moduleKey}`;

  const [mode, setModeState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultMode;
    try {
      const saved = window.localStorage.getItem(storageKey);
      return (saved as T) || defaultMode;
    } catch {
      return defaultMode;
    }
  });

  const setMode = useCallback(
    (newMode: T) => {
      setModeState(newMode);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, newMode);
        } catch {
          // Ignore localStorage errors (e.g. private mode quota limit)
        }
      }
    },
    [storageKey],
  );

  return [mode, setMode];
}
