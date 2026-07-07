import { useCustomerLeads } from '@/application/crm/useCrm';
import { Icon } from '@/shared/components/Icon';

const TYPE_META = {
  RFQ: { label: 'Yêu cầu Báo giá', colorClass: 'bg-amber-100 text-amber-800' },
  SAMPLE: {
    label: 'Yêu cầu Gửi mẫu',
    colorClass: 'bg-purple-100 text-purple-800',
  },
  CONTACT: { label: 'Liên hệ chung', colorClass: 'bg-blue-100 text-blue-800' },
};

interface CustomerTimelineProps {
  customerId: string;
}

export function CustomerTimeline({ customerId }: CustomerTimelineProps) {
  const { data: leads, isLoading } = useCustomerLeads(customerId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <Icon name="History" className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">
          Khách hàng chưa có lịch sử tương tác nào
        </p>
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-200 ml-3 md:ml-4 space-y-6 pb-4">
      {leads.map((lead) => {
        const meta = TYPE_META[lead.type as keyof typeof TYPE_META] || {
          label: 'Khác',
          colorClass: 'bg-slate-100 text-slate-800',
        };
        return (
          <div key={lead.id} className="relative pl-6 sm:pl-8">
            <div
              className={`absolute -left-3 sm:-left-3.5 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 border-white ${
                lead.type === 'RFQ'
                  ? 'bg-amber-100 text-amber-600'
                  : lead.type === 'SAMPLE'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-blue-100 text-blue-600'
              }`}
            >
              {lead.type === 'RFQ' && <Icon name="FileText" size={12} />}
              {lead.type === 'SAMPLE' && <Icon name="Package" size={12} />}
              {lead.type === 'CONTACT' && (
                <Icon name="MessageSquare" size={12} />
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${meta.colorClass}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {lead.type === 'RFQ' &&
                      lead.rfq_detail &&
                      `Báo giá ${lead.rfq_detail.quantity}kg`}
                    {lead.type === 'SAMPLE' &&
                      lead.sample_detail &&
                      `Xin mẫu ${lead.sample_detail.fabric_catalog?.name || ''}`}
                    {lead.type === 'CONTACT' && 'Liên hệ chung'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Icon name="Calendar" size={12} />
                  {new Intl.DateTimeFormat('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(lead.created_at))}
                </div>
              </div>

              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                Khách hàng từ nguồn: {lead.source || 'Trực tiếp'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
