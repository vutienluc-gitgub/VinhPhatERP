import { useCallback, useEffect, useRef, useState } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';

import { useAuth } from '@/shared/hooks/useAuth';
import { useConfirm } from '@/shared/hooks/useConfirm';

import { clearDraft, formatTime, loadDraft } from './useAutoSave';

// ── Constants ──────────────────────────────────────────────────────────────

const RESTORE_PROMPT_DELAY_MS = 300;

const DRAFT_MESSAGES = {
  TITLE: 'Phục hồi bản nháp',
  MESSAGE: 'Bạn có dữ liệu đang nhập dở, bạn muốn tiếp tục hay tạo mới?',
  CONFIRM_LABEL: 'Tiếp tục',
  CANCEL_LABEL: 'Tạo mới',
};

// ── Types ──────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type UseFormAutoSaveOptions<T extends FieldValues> = {
  formId: string;
  methods: UseFormReturn<T>;
  delay?: number;
  enabled?: boolean;
  /** Optional stepper reference to prevent autosave during step transitions */
  stepperRef?: React.MutableRefObject<{
    isTransitioning: boolean;
    isValidating?: boolean;
  }>;
};

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Auto-saves form values to localStorage WITHOUT causing extra re-renders.
 *
 * Uses RHF's watch(callback) API instead of watch() in render to avoid
 * creating a reactive subscription that re-renders the host component on every
 * keystroke — which would fight with stepper state or any other local state.
 */
export function useFormAutoSave<T extends FieldValues>({
  formId,
  methods,
  delay = 1000,
  enabled = true,
  stepperRef,
}: UseFormAutoSaveOptions<T>) {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const userId = user?.id ?? 'anonymous';
  const fullKey = `${formId}-${userId}`;

  const hasPromptedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');
  const latestSaveIdRef = useRef(0);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Subscribe to form changes WITHOUT calling watch() in render
  useEffect(() => {
    if (!enabled) return;

    const save = (values: T) => {
      const serialized = JSON.stringify(values);
      if (serialized === lastSavedRef.current) return;
      if (!mountedRef.current) return;

      // Prevent autosave during step transitions to avoid interference
      if (
        stepperRef?.current?.isTransitioning ||
        stepperRef?.current?.isValidating
      ) {
        return;
      }

      setStatus('saving');

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      latestSaveIdRef.current += 1;
      const saveId = latestSaveIdRef.current;

      timeoutRef.current = setTimeout(() => {
        if (!mountedRef.current || latestSaveIdRef.current !== saveId) return;

        // Double-check stepper state before saving to localStorage
        if (
          stepperRef?.current?.isTransitioning ||
          stepperRef?.current?.isValidating
        ) {
          setStatus('idle');
          return;
        }

        const payload = { data: values, updatedAt: Date.now() };
        try {
          localStorage.setItem(fullKey, JSON.stringify(payload));
        } catch (err) {
          console.error('[useFormAutoSave] localStorage write failed:', err);
          setStatus('error');
          return;
        }

        lastSavedRef.current = serialized;
        setLastSavedAt(payload.updatedAt);
        setStatus('saved');
      }, delay);
    };

    const subscription = methods.watch((values) => {
      save(values as T);
    });

    return () => subscription.unsubscribe();
  }, [enabled, fullKey, delay, methods, stepperRef]);

  // Restore draft on mount
  useEffect(() => {
    if (!enabled || hasPromptedRef.current) return;

    const draft = loadDraft<T>(formId, userId);
    if (!draft) return;

    hasPromptedRef.current = true;

    const timerId = setTimeout(() => {
      confirm({
        title: DRAFT_MESSAGES.TITLE,
        message: DRAFT_MESSAGES.MESSAGE,
        confirmLabel: DRAFT_MESSAGES.CONFIRM_LABEL,
        cancelLabel: DRAFT_MESSAGES.CANCEL_LABEL,
      })
        .then((restore) => {
          if (restore) {
            methods.reset(draft);
          } else {
            clearDraft(formId, userId);
          }
        })
        .catch((err: unknown) => {
          console.error('[useFormAutoSave] restore prompt failed:', err);
        });
    }, RESTORE_PROMPT_DELAY_MS);

    return () => clearTimeout(timerId);
  }, [formId, userId, methods, enabled, confirm]);

  const clear = useCallback(() => clearDraft(formId, userId), [formId, userId]);

  return {
    status,
    lastSavedAt,
    lastSavedTimeText: formatTime(lastSavedAt),
    clearDraft: clear,
  };
}
