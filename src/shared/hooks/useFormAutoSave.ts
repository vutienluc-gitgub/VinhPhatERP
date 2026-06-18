import { useEffect, useRef } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

import { useAuth } from '@/shared/hooks/useAuth';
import { useConfirm } from '@/shared/hooks/useConfirm';

import { useAutoSave, loadDraft, clearDraft, formatTime } from './useAutoSave';

type UseFormAutoSaveOptions<T extends FieldValues> = {
  formId: string;
  methods: UseFormReturn<T>;
  enabled?: boolean;
};

export function useFormAutoSave<T extends FieldValues>({
  formId,
  methods,
  enabled = true,
}: UseFormAutoSaveOptions<T>) {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const userId = user?.id || 'anonymous';
  const hasPromptedRef = useRef(false);

  const values = methods.watch();

  const { status, lastSavedAt } = useAutoSave({
    key: formId,
    data: values,
    userId,
    delay: 1000,
  });

  // Restore logic
  useEffect(() => {
    if (!enabled || hasPromptedRef.current) return;

    const draft = loadDraft<T>(formId, userId);
    if (draft) {
      hasPromptedRef.current = true;
      // Use setTimeout to avoid interfering with initial render / mount
      setTimeout(() => {
        confirm({
          title: 'Phục hồi bản nháp',
          message:
            'Bạn có dữ liệu đang nhập dở, bạn muốn tiếp tục hay tạo mới?',
          confirmLabel: 'Tiếp tục',
          cancelLabel: 'Tạo mới',
        }).then((restore) => {
          if (restore) {
            methods.reset(draft);
          } else {
            clearDraft(formId, userId);
          }
        });
      }, 300);
    }
  }, [formId, userId, methods, enabled, confirm]);

  // Provide a method to clear draft when form is successfully submitted
  const clear = () => clearDraft(formId, userId);

  return {
    status,
    lastSavedAt,
    lastSavedTimeText: formatTime(lastSavedAt),
    clearDraft: clear,
  };
}
