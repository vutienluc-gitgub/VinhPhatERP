import { useWatch } from 'react-hook-form';
import type { UseFormWatch, Control } from 'react-hook-form';

import type { OrdersFormValues } from '@/schema/order.schema';
import { useAutoSave } from '@/shared/hooks/useAutoSave';
import SaveStatus from '@/shared/components/SaveStatus';
import { MoneyText } from '@/shared/value';
import { calculateOrderTotal } from '@/domain/orders';
import { ORDER_MESSAGES as MSG } from '@/features/orders/orders.constants';

export const DRAFT_KEY = 'order-draft';

export function AutoSaveSubscriber({
  watch,
}: {
  watch: UseFormWatch<OrdersFormValues>;
}) {
  const formValues = watch();
  const { status: saveStatus, lastSavedAt } = useAutoSave({
    key: DRAFT_KEY,
    data: formValues,
    delay: 800,
  });
  return <SaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />;
}

export function LineTotals({
  control,
}: {
  control: Control<OrdersFormValues>;
}) {
  const items = useWatch({
    control,
    name: 'items',
  });
  const total = calculateOrderTotal(items);
  return (
    <div className="text-right font-semibold text-base py-2 border-t-2 border-border mt-3 flex items-center justify-end gap-1">
      {MSG.TXT_TOTAL} <MoneyText value={total} suffix="đ" />
    </div>
  );
}
