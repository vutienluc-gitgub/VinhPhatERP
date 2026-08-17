import { Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { formatQuantity } from '@/shared/value/core/formatter';
import type { Quotation } from '@/domain/crm/quotations.types';
import {
  QUOTATION_LABELS,
  QUOTATION_MESSAGES,
} from '@/features/quotations/quotations.constants';

type QuotationDetailItemsProps = {
  quotation: Quotation;
};

export function QuotationDetailItems({ quotation }: QuotationDetailItemsProps) {
  const items = quotation.quotation_items ?? [];

  return (
    <div className="px-5 pb-5">
      <h4 className="mb-3 text-base flex items-center gap-2">
        <Icon name="List" size={20} className="text-muted-foreground" />
        {QUOTATION_LABELS.LINE_ITEMS} ({items.length})
      </h4>
      <div className="data-table-wrap">
        {items.length === 0 ? (
          <p className="table-empty">{QUOTATION_MESSAGES.EMPTY_ITEMS}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>{QUOTATION_LABELS.FABRIC_TYPE}</th>
                <th>{QUOTATION_LABELS.COLOR}</th>
                <th className="max-sm:hidden">{QUOTATION_LABELS.WIDTH}</th>
                <th className="text-right">{QUOTATION_LABELS.QUANTITY}</th>
                <th className="text-right">{QUOTATION_LABELS.UNIT_PRICE}</th>
                <th className="text-right">{QUOTATION_LABELS.AMOUNT}</th>
                <th className="max-sm:hidden">
                  {QUOTATION_LABELS.LEAD_TIME_SHORT}
                </th>
              </tr>
            </thead>
            <tbody>
              {items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item, idx) => (
                  <tr key={item.id}>
                    <td className="text-muted-foreground">{idx + 1}</td>
                    <td>
                      <span className="font-bold">{item.fabric_type}</span>
                    </td>
                    <td className="text-muted-foreground">
                      {item.color_name ?? '—'}
                    </td>
                    <td className="text-muted-foreground max-sm:hidden">
                      {item.width_cm ?? '—'}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatQuantity(item.quantity)} {item.unit}
                    </td>
                    <td className="text-right tabular-nums">
                      <MoneyText value={item.unit_price} />
                    </td>
                    <td className="text-right font-bold tabular-nums">
                      <MoneyText value={item.amount} />
                    </td>
                    <td className="text-muted-foreground max-sm:hidden">
                      {item.lead_time_days ?? '—'}
                    </td>
                  </tr>
                ))}
              <tr className="font-bold bg-surface/30">
                <td colSpan={6} className="text-right">
                  {QUOTATION_LABELS.SUBTOTAL}
                </td>
                <td className="text-right tabular-nums">
                  <MoneyText value={quotation.subtotal} />
                </td>
                <td className="max-sm:hidden"></td>
              </tr>
              {quotation.discount_amount > 0 && (
                <tr className="text-danger">
                  <td colSpan={6} className="text-right">
                    {QUOTATION_LABELS.DISCOUNT} (
                    {quotation.discount_type === 'percent'
                      ? `${quotation.discount_value}%`
                      : QUOTATION_LABELS.FIXED_DISCOUNT}
                    )
                  </td>
                  <td className="text-right tabular-nums">
                    -<MoneyText value={quotation.discount_amount} />
                  </td>
                  <td className="max-sm:hidden"></td>
                </tr>
              )}
              {quotation.vat_amount > 0 && (
                <tr>
                  <td colSpan={6} className="text-right">
                    {QUOTATION_LABELS.VAT_RATE} ({quotation.vat_rate}%)
                  </td>
                  <td className="text-right tabular-nums">
                    +<MoneyText value={quotation.vat_amount} />
                  </td>
                  <td className="max-sm:hidden"></td>
                </tr>
              )}
              <tr className="font-extrabold text-foreground bg-surface/50">
                <td colSpan={6} className="text-right">
                  {QUOTATION_LABELS.TOTAL}
                </td>
                <td className="text-right text-lg tabular-nums">
                  <MoneyText value={quotation.total_amount} />
                </td>
                <td className="max-sm:hidden"></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
