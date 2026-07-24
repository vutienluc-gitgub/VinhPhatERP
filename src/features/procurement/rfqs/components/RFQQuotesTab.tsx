import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

import { Button, StatusBadge, Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value/money/MoneyText';
import { getErrorMessage } from '@/shared/utils/error';
import {
  useRFQQuotes,
  useAwardRFQQuote,
} from '@/application/procurement/useRFQs';
import type { SourcingRfq, SupplierQuoteItem } from '@/api/rfqs.api';
import { RFQ_LABELS } from '@/features/procurement/rfqs/rfqs.constants';

interface RFQQuotesTabProps {
  rfq: SourcingRfq;
}

function calculateTotalAmount(items: SupplierQuoteItem[] | undefined) {
  if (!items) return 0;
  let total = 0;
  for (const item of items) {
    total += item.unit_price * item.qty_offered;
  }
  return total;
}

export function RFQQuotesTab({ rfq }: RFQQuotesTabProps) {
  const navigate = useNavigate();
  const { data: quotes = [], isLoading, error } = useRFQQuotes(rfq.id);
  const awardMutation = useAwardRFQQuote();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg">
        {RFQ_LABELS.QUOTE_ERR_LOAD}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
        <Icon name="Inbox" size={48} className="text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">
          {RFQ_LABELS.QUOTE_EMPTY_TITLE}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          {RFQ_LABELS.QUOTE_EMPTY_DESC}
        </p>
      </div>
    );
  }

  const handleAward = async (quoteId: string) => {
    if (!window.confirm(RFQ_LABELS.CONFIRM_AWARD)) {
      return;
    }

    try {
      await awardMutation.mutateAsync(quoteId);
      toast.success(RFQ_LABELS.SUCCESS_AWARD);

      if (window.confirm(RFQ_LABELS.CONFIRM_CREATE_PO)) {
        navigate('/mua-hang/don-hang/tao-moi', {
          state: { rfq_id: rfq.id, quote_id: quoteId },
        });
      }
    } catch (err) {
      console.error('[AwardQuoteError]', err);
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {quotes.map((quote) => {
        const totalAmount = calculateTotalAmount(quote.items);

        return (
          <div
            key={quote.id}
            className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${
              quote.status === 'awarded'
                ? 'border-emerald-500 ring-1 ring-emerald-500'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-slate-800">
                    {quote.supplier_name}
                  </h3>
                  <StatusBadge domain="RFQ_QUOTE" status={quote.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Icon name="Phone" size={14} className="text-slate-400" />
                    {quote.supplier_phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="Clock" size={14} className="text-slate-400" />
                    {dayjs(quote.created_at).format('DD/MM/YYYY HH:mm')}
                  </span>
                </div>
                {quote.notes && (
                  <div className="mt-3 text-sm text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                    <span className="font-semibold text-amber-800">
                      {RFQ_LABELS.LBL_NOTES}
                    </span>
                    {quote.notes}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end md:min-w-[200px]">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                  {RFQ_LABELS.LBL_TOTAL_TEMP}
                </p>
                <p className="text-xl font-bold text-primary">
                  <MoneyText value={totalAmount} />
                </p>

                {/* Award Button */}
                {rfq.status !== 'awarded' &&
                  rfq.status !== 'cancelled' &&
                  quote.status === 'pending' && (
                    <Button
                      variant="primary"
                      className="mt-4 w-full"
                      onClick={() => handleAward(quote.id)}
                      isLoading={awardMutation.isPending}
                      disabled={awardMutation.isPending}
                    >
                      <Icon name="CheckCircle" size={16} className="mr-2" />
                      {RFQ_LABELS.BTN_AWARD_THIS}
                    </Button>
                  )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">{RFQ_LABELS.COL_MATERIAL}</th>
                    <th className="px-5 py-3 text-right">
                      {RFQ_LABELS.COL_QTY_OFFERED}
                    </th>
                    <th className="px-5 py-3 text-right">
                      {RFQ_LABELS.COL_PRICE_VND}
                    </th>
                    <th className="px-5 py-3 text-right">
                      {RFQ_LABELS.COL_TOTAL}
                    </th>
                    <th className="px-5 py-3">{RFQ_LABELS.COL_NOTES}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quote.items?.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-700">
                          {idx + 1}.{' '}
                          {item.material_name ||
                            RFQ_LABELS.TXT_UNKNOWN_MATERIAL}
                        </p>
                        {item.qty_required &&
                          item.qty_required !== item.qty_offered && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              {RFQ_LABELS.TXT_ORIGINAL_REQ} {item.qty_required}{' '}
                              {item.uom}
                            </p>
                          )}
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {item.qty_offered} {item.uom}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <MoneyText value={item.unit_price} />
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800">
                        <MoneyText value={item.unit_price * item.qty_offered} />
                      </td>
                      <td
                        className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate"
                        title={item.notes || ''}
                      >
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
