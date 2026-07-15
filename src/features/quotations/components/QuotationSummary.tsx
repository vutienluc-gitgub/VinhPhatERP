import { useWatch } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { MoneyText } from '@/shared/value';
import {
  calculateQuotationTotals,
  type QuotationsFormValues,
} from '@/schema/quotation.schema';
import type { DiscountType } from '@/features/quotations/types';
import { QUOTATION_LABELS } from '@/features/quotations/quotations.constants';

type TotalsSummaryProps = {
  control: ReturnType<typeof useForm<QuotationsFormValues>>['control'];
};

export function QuotationSummary({ control }: TotalsSummaryProps) {
  const items = useWatch({
    control,
    name: 'items',
  });
  const discountType = useWatch({
    control,
    name: 'discountType',
  }) as DiscountType;
  const discountValue =
    useWatch({
      control,
      name: 'discountValue',
    }) ?? 0;
  const vatRate =
    useWatch({
      control,
      name: 'vatRate',
    }) ?? 10;

  const totals = calculateQuotationTotals(
    items ?? [],
    discountType,
    Number(discountValue),
    Number(vatRate),
  );

  return (
    <div className="border-t-2 border-border py-3 flex flex-col gap-1.5 text-[0.92rem]">
      <div className="flex justify-between">
        <span>{QUOTATION_LABELS.SUBTOTAL}:</span>
        <span>
          <MoneyText value={totals.subtotal} />
        </span>
      </div>
      {totals.discountAmount > 0 && (
        <div className="flex justify-between text-danger">
          <span>{QUOTATION_LABELS.DISCOUNT}:</span>
          <span>
            -<MoneyText value={totals.discountAmount} />
          </span>
        </div>
      )}
      <div className="flex justify-between">
        <span>{QUOTATION_LABELS.BEFORE_VAT}:</span>
        <span>
          <MoneyText value={totals.totalBeforeVat} />
        </span>
      </div>
      {totals.vatAmount > 0 && (
        <div className="flex justify-between">
          <span>
            {QUOTATION_LABELS.VAT_AMOUNT} ({vatRate}%):
          </span>
          <span>
            +<MoneyText value={totals.vatAmount} />
          </span>
        </div>
      )}
      <div className="flex justify-between font-bold text-[1.05rem] border-t border-border pt-2">
        <span>{QUOTATION_LABELS.TOTAL}:</span>
        <span>
          <MoneyText value={totals.totalAmount} />
        </span>
      </div>
    </div>
  );
}
