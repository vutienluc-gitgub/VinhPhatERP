import { useEffect, useState, useCallback, useRef } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

interface AutoSaveConfig<T extends FieldValues> {
  form: UseFormReturn<T>;
  formType: string;
  entityId?: string;
  debounceMs?: number;
  version?: string;
  onRecovered?: (data: T) => void;
}

interface DraftData<T> {
  data: T;
  updatedAt: number;
  version: string;
  formType: string;
  entityId?: string;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

/**
 * useAutoSaveForm
 * Reusable hook for auto-saving form drafts to localStorage.
 * Compatible with existing DraftBanner and SaveStatus components.
 */
export function useAutoSaveForm<T extends FieldValues>({
  form,
  formType,
  entityId = 'new',
  debounceMs = 2000,
  version = '1.0',
  onRecovered,
}: AutoSaveConfig<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);

  const draftKey = `draft_${formType}_${entityId}`;
  const {
    watch,
    reset,
    formState: { isDirty },
  } = form;
  const watchedValues = watch();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing draft on mount only
  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DraftData<T>;
        if (parsed.version === version && parsed.data) {
          setHasDraft(true);
          setDraftTimestamp(parsed.updatedAt);
        }
      } catch (e) {
        console.warn('Draft corrupt or invalid version', e);
      }
    }
  }, [draftKey, version]);

  const saveDraft = useCallback(
    (data: T) => {
      try {
        const timestamp = Date.now();
        const draft: DraftData<T> = {
          data,
          updatedAt: timestamp,
          version,
          formType,
          entityId,
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setLastSavedAt(timestamp);
        setStatus('saved');
      } catch (e) {
        console.error('Failed to auto-save draft', e);
        setStatus('error');
      }
    },
    [draftKey, entityId, formType, version],
  );

  // Watch for changes and triggers debounced save
  useEffect(() => {
    if (!isDirty) return;

    setStatus('saving');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      saveDraft(watchedValues);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [watchedValues, isDirty, saveDraft, debounceMs]);

  const recoverDraft = useCallback(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DraftData<T>;
        reset(parsed.data);
        setHasDraft(false);
        onRecovered?.(parsed.data);
      } catch (e) {
        console.error('Failed to recover draft', e);
      }
    }
  }, [draftKey, reset, onRecovered]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    setLastSavedAt(null);
    setDraftTimestamp(null);
    setStatus('idle');
  }, [draftKey]);

  return {
    status,
    lastSavedAt,
    hasDraft,
    draftTimestamp,
    recoverDraft,
    clearDraft,
  };
}
