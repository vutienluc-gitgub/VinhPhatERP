import { useEffect, useState } from 'react';
import type { UseFormReset } from 'react-hook-form';

import { loadDraft, clearDraft } from '@/shared/hooks/useAutoSave';
import type { WeavingInvoiceFormValues } from '@/schema/weaving-invoice.schema';

export const DRAFT_KEY = 'weaving-invoice-draft';

export function useWeavingInvoiceDraft(
  isEdit: boolean,
  reset: UseFormReset<WeavingInvoiceFormValues>,
) {
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraft, setSavedDraft] = useState<WeavingInvoiceFormValues | null>(
    null,
  );

  useEffect(() => {
    if (isEdit) return;
    const draft = loadDraft<WeavingInvoiceFormValues>(DRAFT_KEY);
    if (draft && draft.invoice_number) {
      setSavedDraft(draft);
      setShowDraftBanner(true);
    }
  }, [isEdit]);

  function handleRestoreDraft() {
    if (!savedDraft) return;
    reset(savedDraft);
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  function handleDiscardDraft() {
    clearDraft(DRAFT_KEY);
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  function clearCurrentDraft() {
    clearDraft(DRAFT_KEY);
  }

  return {
    showDraftBanner,
    savedDraft,
    handleRestoreDraft,
    handleDiscardDraft,
    clearCurrentDraft,
  };
}
