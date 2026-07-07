import { Icon } from '@/shared/components/Icon';
import type { CrmLead } from '@/domain/crm/crm.types';
import { LEAD_DETAIL_MESSAGES } from '@/features/crm/crm.constants';

interface LeadContactInfoProps {
  lead: CrmLead;
}

export function LeadContactInfo({ lead }: LeadContactInfoProps) {
  return (
    <section>
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon name="User" size={16} className="text-primary" />
        {LEAD_DETAIL_MESSAGES.CONTACT_INFO}
      </h3>
      <div className="bg-surface border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted mb-1">
            {LEAD_DETAIL_MESSAGES.PHONE}
          </div>
          <div className="font-medium text-sm flex items-center gap-2">
            {lead.phone ?? LEAD_DETAIL_MESSAGES.NOT_AVAILABLE}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="text-primary hover:underline text-xs"
              >
                {LEAD_DETAIL_MESSAGES.CALL_NOW}
              </a>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">
            {LEAD_DETAIL_MESSAGES.EMAIL}
          </div>
          <div className="font-medium text-sm">
            {lead.email || (
              <span className="text-muted-subtle">
                {LEAD_DETAIL_MESSAGES.NOT_AVAILABLE}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
