import { useNavigate } from 'react-router-dom';

import type { QuotationsFormValues } from '@/schema/quotation.schema';
import { useLead, useUpdateLeadStatus } from '@/application/crm/useCrm';
import type { LeadStatus } from '@/domain/crm/crm.types';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';
import { LEAD_STATUS_MAP, LEAD_TYPE_MAP } from '@/features/crm/crm.constants';

import { ActivityTimeline } from './ActivityTimeline';

interface LeadDetailDrawerProps {
  leadId: string;
  onClose: () => void;
}

export function LeadDetailDrawer({ leadId, onClose }: LeadDetailDrawerProps) {
  const navigate = useNavigate();
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
      <div className="p-6 text-center text-muted">
        Không tìm thấy thông tin Lead.
      </div>
    );
  }

  const typeMeta = LEAD_TYPE_MAP[lead.type];
  const statusMeta = LEAD_STATUS_MAP[lead.status];

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateStatus({ id: lead.id, status: newStatus });
  };

  const handleConvertToQuote = () => {
    const initialData: Partial<QuotationsFormValues> = {
      notes: `Báo giá cho Lead: ${lead.customer_name} - ${lead.phone}`,
    };

    if (lead.type === 'RFQ' && lead.rfq_detail) {
      initialData.items = [
        {
          fabricType: lead.rfq_detail.fabric_catalog?.name || '',
          colorName: lead.rfq_detail.variant?.color_name || '',
          quantity: lead.rfq_detail.quantity || 0,
          unit: lead.rfq_detail.unit === 'kg' ? 'kg' : 'm',
          unitPrice: lead.rfq_detail.target_price || 0,
          widthCm: 0,
          leadTimeDays: 0,
          notes: '',
        },
      ];
    }

    navigate('/sales/quotations', {
      state: {
        createFromLead: true,
        initialData,
      },
    });

    // Đóng drawer sau khi chuyển hướng
    onClose();
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
              <div className="flex items-center gap-1.5 text-sm text-muted">
                <Icon name="Building2" size={14} />
                <span>{lead.company_name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surface-subtle p-1 rounded-lg border border-border">
              <span className="text-xs font-medium text-muted pl-2">
                Trạng thái:
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
            <section>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Icon name="User" size={16} className="text-primary" />
                Thông tin liên hệ
              </h3>
              <div className="bg-surface border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted mb-1">Số điện thoại</div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {lead.phone}
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-primary hover:underline text-xs"
                    >
                      Gọi ngay
                    </a>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Email</div>
                  <div className="font-medium text-sm">
                    {lead.email || (
                      <span className="text-muted-subtle">Chưa có</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {lead.type === 'RFQ' && lead.rfq_detail && (
              <section>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Icon name="FileText" size={16} className="text-indigo-600" />
                  Chi tiết Yêu cầu Báo giá
                </h3>
                <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-border border-dashed pb-2">
                    <span className="text-sm text-muted">Sản phẩm</span>
                    <span className="text-sm font-semibold">
                      {lead.rfq_detail.fabric_catalog?.name}
                    </span>
                  </div>
                  {lead.rfq_detail.variant && (
                    <div className="flex justify-between items-center border-b border-border border-dashed pb-2">
                      <span className="text-sm text-muted">
                        Màu sắc/Biến thể
                      </span>
                      <span className="text-sm font-medium">
                        {lead.rfq_detail.variant.color_name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-b border-border border-dashed pb-2">
                    <span className="text-sm text-muted">Số lượng</span>
                    <span className="text-sm font-bold text-primary">
                      {lead.rfq_detail.quantity} {lead.rfq_detail.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border border-dashed pb-2">
                    <span className="text-sm text-muted">Giá kỳ vọng</span>
                    <span className="text-sm font-medium text-amber-600">
                      {lead.rfq_detail.target_price
                        ? `${lead.rfq_detail.target_price.toLocaleString()} đ`
                        : 'Chưa có'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="primary"
                    rightIcon="ArrowRight"
                    onClick={handleConvertToQuote}
                  >
                    Tạo Báo giá chính thức
                  </Button>
                </div>
              </section>
            )}

            {lead.type === 'SAMPLE' && lead.sample_detail && (
              <section>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Icon name="Package" size={16} className="text-emerald-600" />
                  Chi tiết Gửi mẫu
                </h3>
                <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-border border-dashed pb-2">
                    <span className="text-sm text-muted">Mẫu vải yêu cầu</span>
                    <span className="text-sm font-semibold">
                      {lead.sample_detail.fabric_catalog?.name}
                    </span>
                  </div>
                  <div className="flex flex-col border-b border-border border-dashed pb-2">
                    <span className="text-sm text-muted mb-1">
                      Các màu yêu cầu
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.sample_detail.selected_variants.map(
                        (v: { color_name: string }, i: number) => (
                          <Badge key={i} variant="gray">
                            {v.color_name}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col pb-2">
                    <span className="text-sm text-muted mb-1">
                      Địa chỉ nhận mẫu
                    </span>
                    <span className="text-sm font-medium leading-relaxed">
                      {lead.sample_detail.delivery_address}
                    </span>
                  </div>
                </div>
              </section>
            )}
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
