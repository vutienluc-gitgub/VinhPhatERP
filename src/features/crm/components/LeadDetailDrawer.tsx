import { useLead, useUpdateLeadStatus } from '@/application/crm/useCrm';
import type { LeadStatus } from '@/domain/crm/crm.types';
import { Icon } from '@/shared/components/Icon';
import {
  LEAD_STATUS_MAP,
  LEAD_TYPE_MAP,
  LEAD_DETAIL_MESSAGES,
} from '@/features/crm/crm.constants';

import { ActivityTimeline } from './ActivityTimeline';
import { LeadContactInfo } from './LeadContactInfo';
import { LeadContextualActions } from './LeadContextualActions';
import { LeadRfqDetail } from './LeadRfqDetail';
import { LeadSampleDetail } from './LeadSampleDetail';

interface LeadDetailDrawerProps {
  leadId: string;
  onClose: () => void;
}

export function LeadDetailDrawer({ leadId, onClose }: LeadDetailDrawerProps) {
  const { data: lead, isLoading } = useLead(leadId);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateLeadStatus();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-surface-subtle rounded w-1/3" />
        <div className="h-32 bg-surface-subtle rounded" />
        <div className="h-64 bg-surface-subtle rounded" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {LEAD_DETAIL_MESSAGES.NOT_FOUND}
      </div>
    );
  }

  const typeMeta = LEAD_TYPE_MAP[lead.type];
  const statusMeta = LEAD_STATUS_MAP[lead.status];

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateStatus({ id: lead.id, status: newStatus });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border bg-surface shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">
                {lead.customer_name}
              </h2>
              {typeMeta && (
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${typeMeta.colorClass}`}
                >
                  {typeMeta.label}
                </span>
              )}
            </div>
            {lead.company_name && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon name="Building2" size={14} />
                <span>{lead.company_name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surface-subtle p-1 rounded-lg border border-border">
              <span className="text-xs font-medium text-muted-foreground pl-2">
                {LEAD_DETAIL_MESSAGES.STATUS_LABEL}
              </span>
              <select
                value={lead.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as LeadStatus)
                }
                disabled={isUpdating}
                className={`text-sm border-0 bg-transparent py-1 pr-8 pl-2 font-medium focus:ring-0 ${statusMeta?.colorClass}`}
              >
                {Object.entries(LEAD_STATUS_MAP).map(([status, meta]) => (
                  <option key={status} value={status}>
                    {meta.dot} {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Cột trái: Thông tin chi tiết */}
          <div className="space-y-6">
            <LeadContextualActions lead={lead} />

            <LeadContactInfo lead={lead} />

            {lead.type === 'RFQ' && (
              <LeadRfqDetail lead={lead} onClose={onClose} />
            )}

            {lead.type === 'SAMPLE' && <LeadSampleDetail lead={lead} />}
          </div>

          {/* Cột phải: Timeline */}
          <div className="h-full border-l-0 lg:border-l border-border lg:pl-8">
            <ActivityTimeline leadId={lead.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
