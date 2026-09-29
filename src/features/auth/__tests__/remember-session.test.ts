import { beforeEach, describe, expect, it } from 'vitest';

import {
  createRememberSessionStorage,
  getRememberMe,
  setRememberMe,
} from '@/features/auth/remember-session';

const KEY = 'vinhphat_session';

describe('remember-session', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('defaults to remembering when no preference is stored', () => {
    expect(getRememberMe()).toBe(true);
  });

  it('persists the preference to localStorage', () => {
    setRememberMe(false);
    expect(getRememberMe()).toBe(false);
    setRememberMe(true);
    expect(getRememberMe()).toBe(true);
  });

  it('routes writes to localStorage when remembering', () => {
    setRememberMe(true);
    createRememberSessionStorage().setItem(KEY, 'session-value');
    expect(window.localStorage.getItem(KEY)).toBe('session-value');
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('routes writes to sessionStorage when not remembering', () => {
    setRememberMe(false);
    createRememberSessionStorage().setItem(KEY, 'session-value');
    expect(window.sessionStorage.getItem(KEY)).toBe('session-value');
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('drops the stale copy when switching store', () => {
    setRememberMe(true);
    const storage = createRememberSessionStorage();
    storage.setItem(KEY, 'old-session');

    setRememberMe(false);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('reads back through the adapter after a write', () => {
    setRememberMe(false);
    const storage = createRememberSessionStorage();
    storage.setItem(KEY, 'abc');
    expect(storage.getItem(KEY)).toBe('abc');
    storage.removeItem(KEY);
    expect(storage.getItem(KEY)).toBeNull();
  });
});
