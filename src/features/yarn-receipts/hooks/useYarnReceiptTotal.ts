import { useWatch, type Control } from 'react-hook-form';

import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';
import { sumBy } from '@/shared/utils/array.util';

export function useYarnReceiptTotal(control: Control<YarnReceiptsFormValues>) {
  const items = useWatch({
    control,
    name: 'items',
  });

  return sumBy(
    items ?? [],
    (it) => (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
  );
}
