import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';
import type { CrmLead } from '@/domain/crm/crm.types';
import { LEAD_DETAIL_MESSAGES } from '@/features/crm/crm.constants';

interface LeadSampleDetailProps {
  lead: CrmLead;
}

export function LeadSampleDetail({ lead }: LeadSampleDetailProps) {
  const detail = lead.sample_detail;

  if (!detail) return null;

  // Normalize items to array
  const items =
    detail.sample_items && detail.sample_items.length > 0
      ? detail.sample_items
      : detail.selected_variants?.map((v) => ({
          code: detail.fabric_catalog?.name || '',
          color_name: v.color_name,
        })) || [];

  return (
    <section>
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon name="Package" size={16} className="text-success" />
        {LEAD_DETAIL_MESSAGES.SAMPLE_DETAIL_TITLE}
      </h3>
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
        {items.length > 0 && (
          <div className="space-y-3 border-b border-border border-dashed pb-2">
            <span className="text-sm text-muted-foreground block">
              {LEAD_DETAIL_MESSAGES.BULK_SAMPLE_REQ}
            </span>
            {items.map((item, idx) => (
              <div
                key={`${item.code}-${item.color_name}-${idx}`}
                className="flex justify-between items-center"
              >
                <span className="text-sm font-semibold">{item.code}</span>
                <Badge variant="gray">
                  {item.color_name || LEAD_DETAIL_MESSAGES.ALL_COLORS}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col pb-2">
          <span className="text-sm text-muted-foreground mb-1">
            {LEAD_DETAIL_MESSAGES.DELIVERY_ADDRESS}
          </span>
          <span className="text-sm font-medium leading-relaxed">
            {detail.delivery_address}
          </span>
        </div>
      </div>
    </section>
  );
}
