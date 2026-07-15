import type { UseFormWatch } from 'react-hook-form';

import { useAutoSave } from '@/shared/hooks/useAutoSave';
import SaveStatus from '@/shared/components/SaveStatus';
import type { WeavingInvoiceFormValues } from '@/schema/weaving-invoice.schema';
import { DRAFT_KEY } from '@/features/weaving-invoices/hooks/useWeavingInvoiceDraft';

/**
 * Isolated sub-component that subscribes to ALL form values for auto-save.
 * By extracting this, the re-renders caused by watch() are confined here
 * and do NOT propagate to the main WeavingInvoiceForm tree.
 */
export function AutoSaveSubscriber({
  watch,
}: {
  watch: UseFormWatch<WeavingInvoiceFormValues>;
}) {
  const formValues = watch();
  const { status: saveStatus, lastSavedAt } = useAutoSave({
    key: DRAFT_KEY,
    data: formValues,
    delay: 800,
  });
  return <SaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />;
}
