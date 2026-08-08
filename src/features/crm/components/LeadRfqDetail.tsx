import { Icon } from '@/shared/components/Icon';
import { Button } from '@/shared/components/Button';
import { MoneyText } from '@/shared/value';
import type { CrmLead } from '@/domain/crm/crm.types';
import { LEAD_DETAIL_MESSAGES } from '@/features/crm/crm.constants';
import { useConvertToQuote } from '@/features/crm/hooks/useConvertToQuote';

interface LeadRfqDetailProps {
  lead: CrmLead;
  onClose: () => void;
}

export function LeadRfqDetail({ lead, onClose }: LeadRfqDetailProps) {
  const { convertToQuote } = useConvertToQuote();
  const detail = lead.rfq_detail;

  if (!detail) return null;

  // Normalize items to array
  const items =
    detail.rfq_items && detail.rfq_items.length > 0
      ? detail.rfq_items
      : [
          {
            code: detail.fabric_catalog?.name || '',
            color_name: detail.variant?.color_name || '',
            quantity: detail.quantity || 0,
            unit: detail.unit,
            target_price: detail.target_price,
          },
        ];

  return (
    <section>
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon name="FileText" size={16} className="text-info" />
        {LEAD_DETAIL_MESSAGES.RFQ_DETAIL_TITLE}
      </h3>
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={`${item.code}-${item.color_name}-${idx}`}
              className="border-b border-border border-dashed pb-3 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-foreground">
                  {item.code} {item.color_name && `- ${item.color_name}`}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {item.quantity} {item.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {LEAD_DETAIL_MESSAGES.EXPECTED_PRICE}
                </span>
                <span className="text-xs font-medium text-warning">
                  {item.target_price ? (
                    <>
                      <MoneyText value={Number(item.target_price)} />
                    </>
                  ) : (
                    LEAD_DETAIL_MESSAGES.NOT_AVAILABLE
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          variant="primary"
          rightIcon="ArrowRight"
          onClick={() => convertToQuote(lead, onClose)}
        >
          {LEAD_DETAIL_MESSAGES.CREATE_QUOTE_BTN}
        </Button>
      </div>
    </section>
  );
}
