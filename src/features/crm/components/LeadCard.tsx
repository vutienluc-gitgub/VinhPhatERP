import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

import type { CrmLead } from '@/domain/crm/crm.types';
import { Icon } from '@/shared/components/Icon';
import { PhoneContact } from '@/shared/components/PhoneContact';
import { LEAD_TYPE_MAP } from '@/features/crm/crm.constants';

interface LeadCardProps {
  lead: CrmLead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const typeMeta = LEAD_TYPE_MAP[lead.type];
  const timeAgo = dayjs().to(dayjs(lead.created_at));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="bg-surface border border-border rounded-lg p-3 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">
          {lead.customer_name}
        </h3>
        {typeMeta && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${typeMeta.colorClass}`}
          >
            {typeMeta.label}
          </span>
        )}
      </div>

      {lead.company_name && (
        <div className="flex items-center gap-1.5 text-xs text-muted mb-1.5">
          <Icon name="Building2" size={12} className="shrink-0" />
          <span className="line-clamp-1">{lead.company_name}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs mb-3">
        <PhoneContact phone={lead.phone} className="text-xs" />
      </div>

      {lead.type === 'RFQ' && lead.rfq_detail?.fabric_catalog && (
        <div className="text-xs bg-surface-subtle border border-border p-1.5 rounded mb-3 flex items-center gap-1.5">
          <Icon
            name="PackageSearch"
            size={12}
            className="text-primary shrink-0"
          />
          <span className="line-clamp-1">
            {lead.rfq_detail.quantity} {lead.rfq_detail.unit} -{' '}
            {lead.rfq_detail.fabric_catalog.name}
          </span>
        </div>
      )}

      {lead.type === 'SAMPLE' && lead.sample_detail?.fabric_catalog && (
        <div className="text-xs bg-surface-subtle border border-border p-1.5 rounded mb-3 flex items-center gap-1.5">
          <Icon name="Layers" size={12} className="text-purple-600 shrink-0" />
          <span className="line-clamp-1">
            Xin mẫu: {lead.sample_detail.fabric_catalog.name}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border border-dashed text-[11px] text-muted-subtle">
        <span>{timeAgo}</span>
        {lead.score > 0 && (
          <span className="flex items-center gap-1 text-warning font-medium">
            <Icon name="Flame" size={12} />
            {lead.score} điểm
          </span>
        )}
      </div>
    </div>
  );
}
