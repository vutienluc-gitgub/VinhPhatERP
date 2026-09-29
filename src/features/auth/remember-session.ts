/**
 * "Ghi nhớ đăng nhập" (remember me) decides where supabase-js keeps the auth
 * session:
 *
 *   remember = true  → localStorage    (chosen across tabs, lives past a close)
 *   remember = false → sessionStorage  (cleared when the tab is closed)
 *
 * supabase-js accepts only ONE storage at construction time, so we pass this
 * adapter. The choice itself is persisted separately in localStorage, because
 * sessionStorage disappears when the tab closes and we must know which store to
 * read on the next visit.
 */

const REMEMBER_KEY = 'vinhphat_remember';

/** Read the persisted preference. Defaults to true (matches the login schema). */
export function getRememberMe(): boolean {
  try {
    const raw = window.localStorage.getItem(REMEMBER_KEY);
    if (raw === null) return true;
    return raw !== 'false';
  } catch {
    return true;
  }
}

/**
 * Persist the preference and migrate the session so the *current* login lands in
 * the right store. Call this BEFORE signing in: signOut / GoTrue's own storage
 * sync write through the adapter, so moving the key first prevents a stale
 * session leaking between stores.
 */
export function setRememberMe(remember: boolean): void {
  try {
    const keep = window.localStorage;
    const temp = window.sessionStorage;

    if (getRememberMe() !== remember) {
      // Drop the copy that would otherwise outlive the switch.
      const stale = remember ? temp : keep;
      stale.removeItem('vinhphat_session');
    }

    if (remember) {
      keep.setItem(REMEMBER_KEY, 'true');
    } else {
      keep.setItem(REMEMBER_KEY, 'false');
    }
  } catch {
    // Storage can be unavailable (private mode quota); the adapter falls back to
    // an in-memory store, so a failure here is not worth surfacing to the user.
  }
}

export const STORAGE_KEYS = { REMEMBER_KEY } as const;

/** Storage surface consumed by supabase-js (PromisifyMethods accepts sync too). */
export interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Storage adapter for supabase-js: routes the auth session to localStorage or
 * sessionStorage based on the remembered preference, with an in-memory fallback
 * so a hard storage failure cannot throw during client construction.
 */
export function createRememberSessionStorage(): SessionStorage {
  const memory = new Map<string, string>();
  const memoryFallback: SessionStorage = {
    getItem: (key) => (memory.has(key) ? memory.get(key)! : null),
    setItem: (key, value) => void memory.set(key, value),
    removeItem: (key) => void memory.delete(key),
  };

  const target = (): Storage => {
    try {
      return getRememberMe() ? window.localStorage : window.sessionStorage;
    } catch {
      return null as unknown as Storage;
    }
  };

  const run = <T>(fn: (store: Storage) => T, fallback: () => T): T => {
    const store = target();
    if (!store) return fallback();
    try {
      return fn(store);
    } catch {
      return fallback();
    }
  };

  return {
    getItem: (key) =>
      run(
        (s) => s.getItem(key),
        () => memoryFallback.getItem(key),
      ),
    setItem: (key, value) =>
      run(
        (s) => s.setItem(key, value),
        () => memoryFallback.setItem(key, value),
      ),
    removeItem: (key) =>
      run(
        (s) => s.removeItem(key),
        () => memoryFallback.removeItem(key),
      ),
  };
}
