import { useEffect, useRef, useState } from 'react';

type AutoSaveOptions<T> = {
  key: string;
  data: T;
  delay?: number;
  userId?: string;
  onSaveToDB?: (data: T) => Promise<void>;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'conflict';

export function useAutoSave<T>({
  key,
  data,
  delay = 800,
  userId = 'anonymous',
  onSaveToDB,
}: AutoSaveOptions<T>) {
  const fullKey = `${key}-${userId}`;
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');
  /**
   * Token to prevent stale async saves from overwriting newer data.
   * Each new save increments the token; after the async completes,
   * if the token has changed, the result is discarded.
   */
  const latestSaveIdRef = useRef(0);
  /** Prevents setState calls after the hook unmounts. */
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // AUTO SAVE with latest-only token pattern
  useEffect(() => {
    const serialized = JSON.stringify(data);

    if (serialized === lastSavedRef.current) return;

    setStatus('saving');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Increment token so any previously queued async save becomes stale
    latestSaveIdRef.current += 1;
    const saveId = latestSaveIdRef.current;

    timeoutRef.current = setTimeout(async () => {
      const payload = {
        data,
        updatedAt: Date.now(),
      };

      // localStorage write is synchronous — always safe
      localStorage.setItem(fullKey, JSON.stringify(payload));

      if (onSaveToDB) {
        try {
          await onSaveToDB(data);
        } catch (err: unknown) {
          // Only update state if this save is still the latest
          if (mountedRef.current && latestSaveIdRef.current === saveId) {
            console.error('[useAutoSave] DB save failed:', err);
          }
          return;
        }
      }

      // Discard result if a newer save was queued while we were awaiting
      if (latestSaveIdRef.current !== saveId) return;
      if (!mountedRef.current) return;

      lastSavedRef.current = serialized;
      setLastSavedAt(payload.updatedAt);
      setStatus('saved');
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, delay, fullKey, onSaveToDB]);

  // MULTI TAB SYNC + CONFLICT DETECT
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== fullKey || !e.newValue) return;

      const incoming = JSON.parse(e.newValue);

      if (!lastSavedAt) return;

      if (incoming.updatedAt > lastSavedAt) {
        setHasConflict(true);
        setStatus('conflict');
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [lastSavedAt, fullKey]);

  return {
    status,
    lastSavedAt,
    hasConflict,
  };
}

// LOAD DRAFT
export function loadDraft<T>(key: string, userId = 'anonymous'): T | null {
  const raw = localStorage.getItem(`${key}-${userId}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw).data;
  } catch {
    return null;
  }
}

// CLEAR
export function clearDraft(key: string, userId = 'anonymous') {
  localStorage.removeItem(`${key}-${userId}`);
}

// FORMAT TIME
export function formatTime(ts: number | null) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString();
}
