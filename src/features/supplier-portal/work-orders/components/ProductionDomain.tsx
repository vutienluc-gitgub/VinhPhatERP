import { useOutletContext } from 'react-router-dom';

import type { WorkOrderRow } from '@/api/supplier-work-orders.api';
import type { WorkOrderCapabilities } from '@/types/work-orders';
import { Card } from '@/shared/components/Card';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { formatQuantity } from '@/shared/value/core/formatter';

interface DomainContext {
  capabilities: WorkOrderCapabilities;
  workOrder: WorkOrderRow;
}

export function ProductionDomain() {
  const { workOrder, capabilities } = useOutletContext<DomainContext>();

  const actual = workOrder.actual_yield_m || 0;
  const target = workOrder.target_quantity || 1;
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round((actual / target) * 100)),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Tiến độ sản xuất
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Đã hoàn thành</span>
                <span className="font-medium text-foreground">
                  {progressPct}%
                </span>
              </div>
              <ProgressBar value={progressPct} />
              <div className="flex justify-between text-xs mt-2 text-muted">
                <span>{formatQuantity(actual)} m</span>
                <span>{formatQuantity(target)} m</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-default">
              <div>
                <p className="text-xs text-muted mb-1 uppercase">Thực tế</p>
                <p className="text-xl font-bold text-success">
                  {formatQuantity(actual)}{' '}
                  <span className="text-sm font-normal">m</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1 uppercase">Mục tiêu</p>
                <p className="text-xl font-bold text-foreground">
                  {formatQuantity(target)}{' '}
                  <span className="text-sm font-normal">m</span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Máy móc (IoT Ready)
          </h2>
          <div className="p-4 bg-surface-secondary rounded text-center border border-dashed border-default">
            <p className="text-sm text-muted">Chưa gán máy dệt/nhuộm.</p>
            {capabilities.canUpdateProduction && (
              <button className="text-primary text-sm font-medium mt-2 hover:underline">
                Gán máy & Ca làm việc
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
