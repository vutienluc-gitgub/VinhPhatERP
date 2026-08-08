import { useOutletContext } from 'react-router-dom';

import type { WorkOrderRow } from '@/api/supplier-work-orders.api';
import type { WorkOrderCapabilities } from '@/types/work-orders';
import { Card } from '@/shared/components/Card';
import { Icon, type IconName } from '@/shared/components/Icon';
import { formatQuantity } from '@/shared/value/core/formatter';

interface DomainContext {
  capabilities: WorkOrderCapabilities;
  workOrder: WorkOrderRow;
}

export function OverviewDomain() {
  const { workOrder } = useOutletContext<DomainContext>();

  const details = [
    {
      label: 'Mã Lệnh',
      value: `WO-${(workOrder?.id || '').split('-')[0]!.toUpperCase()}`,
      icon: 'hash',
    },
    {
      label: 'Sản lượng mục tiêu',
      value: `${formatQuantity(workOrder.target_quantity)} ${workOrder.target_unit || 'm'}`,
      icon: 'target',
    },
    {
      label: 'Khối lượng dự kiến',
      value: workOrder.target_weight_kg
        ? `${workOrder.target_weight_kg} kg`
        : 'N/A',
      icon: 'scale',
    },
    {
      label: 'Ngày bắt đầu',
      value: workOrder.start_date
        ? new Date(workOrder.start_date).toLocaleDateString('vi-VN')
        : 'Chưa xác định',
      icon: 'calendar',
    },
    {
      label: 'Ngày kết thúc (Hạn)',
      value: workOrder.end_date
        ? new Date(workOrder.end_date).toLocaleDateString('vi-VN')
        : 'Chưa xác định',
      icon: 'calendar-check',
    },
    {
      label: 'Tỷ lệ hao hụt (Định mức)',
      value: `${workOrder.standard_loss_pct}%`,
      icon: 'trending-down',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Thông tin cơ bản
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <div className="p-2 bg-surface-secondary rounded-lg text-muted-foreground">
                <Icon name={detail.icon as IconName} size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{detail.label}</p>
                <p className="font-medium text-foreground">{detail.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {workOrder.notes && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2 text-foreground">
            Ghi chú từ công ty
          </h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {workOrder.notes}
          </p>
        </Card>
      )}
    </div>
  );
}
