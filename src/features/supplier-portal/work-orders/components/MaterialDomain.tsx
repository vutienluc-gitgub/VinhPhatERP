import { useOutletContext } from 'react-router-dom';

import type { WorkOrderRow } from '@/api/supplier-work-orders.api';
import type { WorkOrderCapabilities } from '@/types/work-orders';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';

interface DomainContext {
  capabilities: WorkOrderCapabilities;
  workOrder: WorkOrderRow;
}

export function MaterialDomain() {
  const { capabilities } = useOutletContext<DomainContext>();

  // Mocking Material Ledger Data
  const materials = [
    {
      name: 'Sợi Cotton 30s',
      need: 500,
      issued: 510,
      received: 510,
      consumed: 482,
      remaining: 28,
      unit: 'kg',
    },
    {
      name: 'Sợi Poly 150D',
      need: 200,
      issued: 200,
      received: 0,
      consumed: 0,
      remaining: 0,
      unit: 'kg',
      pendingReceive: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Material Ledger
        </h2>
        {capabilities.canConfirmMaterials && (
          <Button variant="primary">Xác nhận nhận tất cả</Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {materials.map((mat, idx) => (
          <Card
            key={idx}
            className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-semibold text-foreground text-lg mb-1">
                {mat.name}
              </h3>
              {mat.pendingReceive ? (
                <Badge variant="warning">
                  Đang giao {mat.issued} {mat.unit}
                </Badge>
              ) : (
                <Badge variant="success">Đã nhận đủ</Badge>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 md:gap-6 text-center">
              <div>
                <p className="text-xs text-muted mb-1">CẦN</p>
                <p className="font-medium text-foreground">{mat.need}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">XUẤT</p>
                <p className="font-medium text-foreground">{mat.issued}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">ĐÃ NHẬN</p>
                <p className="font-medium text-success">{mat.received}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">TIÊU HAO</p>
                <p className="font-medium text-warning">{mat.consumed}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">CÒN LẠI</p>
                <p className="font-medium text-primary">{mat.remaining}</p>
              </div>
            </div>

            <div className="mt-2 md:mt-0 md:min-w-[140px] text-right">
              {mat.pendingReceive && capabilities.canConfirmMaterials ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  Xác nhận nhận
                </Button>
              ) : (
                <span className="text-xs text-muted">Đã khớp sổ</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
