/**
 * useUserPreferences
 *
 * Nguồn sự thật DUY NHẤT cho các tùy chọn giao diện người dùng.
 * Lưu vào profiles.preferences (DB) — không dùng localStorage là nguồn chính.
 *
 * Chiến lược:
 *   1. Đọc localStorage ngay lập tức → áp dụng để tránh flash khi page load.
 *   2. Khi profile DB load xong → ghi đè lên localStorage (DB là nguồn đúng).
 *   3. Khi user toggle → cập nhật state local + DB + localStorage (đồng bộ ba nơi).
 *
 * CẤM: component khác tự đọc/ghi localStorage cho theme/layout.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/services/supabase/client';
import type { Json } from '@/services/supabase/database.types';
import { applyThemeToDom, readSystemTheme } from '@/shared/utils/theme-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  theme: 'light' | 'dark';
  fluid_layout: boolean;
  sidebar_collapsed: boolean;
  sidebar_groups_collapsed: Record<string, boolean>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  fluid_layout: false,
  sidebar_collapsed: false,
  sidebar_groups_collapsed: {},
};

const LS_KEY = 'vinhphat-prefs-cache';

/** Thời gian debounce khi ghi preferences lên DB (ms). */
const PREFERENCES_SAVE_DEBOUNCE_MS = 800;

/** Đọc từ localStorage (cache ngay khi boot — tránh flash). */
function readLocalCache(): UserPreferences {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserPreferences>;
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch {
    /* ignore parse errors */
  }
  return { ...DEFAULT_PREFERENCES, theme: readSystemTheme() };
}

/** Ghi cache ra localStorage để lần reload sau không bị flash. */
function writeLocalCache(prefs: UserPreferences): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/** Áp dụng fluid layout lên DOM. */
function applyFluidLayout(isFluid: boolean): void {
  document.documentElement.classList.toggle('fluid', isFluid);
  window.dispatchEvent(new Event('layout-mode-changed'));
}

/** Parse preferences từ DB (JSONB có thể là bất cứ thứ gì). */
function parseDbPreferences(raw: unknown): Partial<UserPreferences> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const result: Partial<UserPreferences> = {};

  if (obj['theme'] === 'light' || obj['theme'] === 'dark') {
    result.theme = obj['theme'];
  }
  if (typeof obj['fluid_layout'] === 'boolean') {
    result.fluid_layout = obj['fluid_layout'];
  }
  if (typeof obj['sidebar_collapsed'] === 'boolean') {
    result.sidebar_collapsed = obj['sidebar_collapsed'];
  }
  if (
    obj['sidebar_groups_collapsed'] &&
    typeof obj['sidebar_groups_collapsed'] === 'object' &&
    !Array.isArray(obj['sidebar_groups_collapsed'])
  ) {
    result.sidebar_groups_collapsed = obj['sidebar_groups_collapsed'] as Record<
      string,
      boolean
    >;
  }

  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserPreferences(userId: string | null | undefined) {
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    // Boot ngay từ cache để tránh flash
    const cached = readLocalCache();
    applyThemeToDom(cached.theme);
    applyFluidLayout(cached.fluid_layout);
    return cached;
  });

  // Debounce timer để tránh ghi DB quá nhiều lần khi toggle nhanh
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Theo dõi userId để skip update khi chưa login
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // ── Load từ DB khi userId sẵn sàng ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    async function loadPreferences() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', userId as string)
          .single();

        if (error || !data) return;

        const dbPrefs = parseDbPreferences(data.preferences);

        // Nếu DB preferences trống (user chưa set) → giữ nguyên cache local hiện tại
        // Chỉ ghi đè khi DB thực sự có giá trị
        if (Object.keys(dbPrefs).length === 0) return;

        const merged: UserPreferences = { ...DEFAULT_PREFERENCES, ...dbPrefs };

        // DB là nguồn đúng — ghi đè cache local
        writeLocalCache(merged);
        applyThemeToDom(merged.theme);
        applyFluidLayout(merged.fluid_layout);
        setPrefs(merged);
      } catch (err: unknown) {
        console.error('[useUserPreferences] Load error:', err);
      }
    }

    void loadPreferences();
  }, [userId]);

  // ── Lưu lên DB (debounced PREFERENCES_SAVE_DEBOUNCE_MS) ─────────────────────
  const persistToDb = useCallback((newPrefs: UserPreferences) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const uid = userIdRef.current;
      if (!uid) return;

      async function save() {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ preferences: newPrefs as unknown as Json })
            .eq('id', uid as string);
          if (error) {
            console.error('[useUserPreferences] Save error:', error);
          }
        } catch (err: unknown) {
          console.error('[useUserPreferences] Save exception:', err);
        }
      }

      void save();
    }, PREFERENCES_SAVE_DEBOUNCE_MS);
  }, []);

  // ── Setter thống nhất ────────────────────────────────────────────────────────
  const updatePrefs = useCallback(
    (patch: Partial<UserPreferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch };
        writeLocalCache(next);
        persistToDb(next);
        return next;
      });
    },
    [persistToDb],
  );

  // ── Actions cụ thể ───────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setPrefs((prev) => {
      const next = {
        ...prev,
        theme: (prev.theme === 'light' ? 'dark' : 'light') as 'light' | 'dark',
      };
      applyThemeToDom(next.theme);
      writeLocalCache(next);
      persistToDb(next);
      return next;
    });
  }, [persistToDb]);

  const setFluidLayout = useCallback(
    (isFluid: boolean) => {
      applyFluidLayout(isFluid);
      updatePrefs({ fluid_layout: isFluid });
    },
    [updatePrefs],
  );

  const setSidebarCollapsed = useCallback(
    (collapsed: boolean) => {
      updatePrefs({ sidebar_collapsed: collapsed });
    },
    [updatePrefs],
  );

  const setSidebarGroupsCollapsed = useCallback(
    (groups: Record<string, boolean>) => {
      updatePrefs({ sidebar_groups_collapsed: groups });
    },
    [updatePrefs],
  );

  return {
    prefs,
    toggleTheme,
    setFluidLayout,
    setSidebarCollapsed,
    setSidebarGroupsCollapsed,
    /** Setter tổng quát cho trường hợp đặc biệt */
    updatePrefs,
  };
}
