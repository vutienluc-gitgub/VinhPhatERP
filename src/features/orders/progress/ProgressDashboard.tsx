import {
  useProgressDashboard,
  useUpdateStageStatus,
} from '@/application/orders';

import { OpsLevelPath } from './OpsLevelPath';
import { ProgressExpBar } from './ProgressExpBar';
import { calculateOrderProgress } from './utils';
import type { OrderProgressWithOrder } from './types';

type DashboardOrder = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  fabricInfo: string;
  deliveryDate: string | null;
  orderStatus: string;
  stages: OrderProgressWithOrder[];
};

export function ProgressDashboard() {
  const { data, isLoading, error } = useProgressDashboard();
  const updateMutation = useUpdateStageStatus();

  if (error) {
    return (
      <div className="panel-card">
        <p className="text-[#c0392b] p-4">Lỗi: {(error as Error).message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="panel-card">
        <p className="table-empty">Đang tải...</p>
      </div>
    );
  }

  const {
    overdue = [],
    readyToShip = [],
    inProgress = [],
    waitingToStart = [],
  } = data ?? {};

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="dashboard-summary-row">
        <div className="dashboard-stat-card dashboard-stat-danger">
          <span className="dashboard-stat-number">{overdue.length}</span>
          <span className="dashboard-stat-label">Trễ hạn</span>
        </div>
        <div className="dashboard-stat-card dashboard-stat-success">
          <span className="dashboard-stat-number">{readyToShip.length}</span>
          <span className="dashboard-stat-label">Sẵn sàng giao</span>
        </div>
        <div className="dashboard-stat-card dashboard-stat-primary">
          <span className="dashboard-stat-number">{inProgress.length}</span>
          <span className="dashboard-stat-label">Đang sản xuất</span>
        </div>
        <div className="dashboard-stat-card border-[#9ca3af44] bg-[rgba(156,163,175,0.05)]">
          <span className="dashboard-stat-number">{waitingToStart.length}</span>
          <span className="dashboard-stat-label">Chờ sản xuất</span>
        </div>
      </div>

      {/* Overdue section */}
      {overdue.length > 0 && (
        <DashboardSection
          title="Đơn trễ hạn"
          orders={overdue}
          variant="danger"
          updateMutation={updateMutation}
        />
      )}

      {/* Ready to ship section */}
      {readyToShip.length > 0 && (
        <DashboardSection
          title="Sẵn sàng giao hàng"
          orders={readyToShip}
          variant="success"
          updateMutation={updateMutation}
        />
      )}

      {/* In progress section */}
      {inProgress.length > 0 && (
        <DashboardSection
          title="Đang sản xuất"
          orders={inProgress}
          variant="primary"
          updateMutation={updateMutation}
        />
      )}

      {/* Waiting to start section */}
      {waitingToStart.length > 0 && (
        <DashboardSection
          title="Chờ bắt đầu sản xuất"
          orders={waitingToStart}
          variant="muted"
          updateMutation={updateMutation}
        />
      )}

      {overdue.length === 0 &&
        readyToShip.length === 0 &&
        inProgress.length === 0 &&
        waitingToStart.length === 0 && (
          <div className="panel-card">
            <p className="table-empty">Không có đơn hàng nào đang hoạt động.</p>
          </div>
        )}
    </div>
  );
}

function DashboardSection({
  title,
  orders,
  variant,
  updateMutation,
}: {
  title: string;
  orders: DashboardOrder[];
  variant: 'danger' | 'success' | 'primary' | 'muted';

  updateMutation: ReturnType<typeof useUpdateStageStatus>;
}) {
  const borderColorMap = {
    danger: 'border-[#e74c3c44]',
    success: 'border-[#0c8f6844]',
    primary: 'border-[#0b6bcb44]',
    muted: 'border-[#9ca3af33]',
  };

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">
          {title} ({orders.length})
        </span>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-3">
        {orders.map((order) => {
          const pct = calculateOrderProgress(order.stages);
          const daysOverdue = order.deliveryDate
            ? getDaysOverdue(order.deliveryDate)
            : 0;

          return (
            <div
              key={order.orderId}
              className={`border ${borderColorMap[variant]} rounded-sm p-3`}
            >
              {/* Order header */}
              <div className="flex justify-between items-center flex-wrap gap-[0.4rem] mb-[0.4rem]">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span className="td-muted ml-2">{order.customerName}</span>
                  {order.fabricInfo && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground ml-2">
                      {order.fabricInfo}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[0.82rem]">
                  <span className="tabular-nums">{pct}%</span>
                  {order.deliveryDate && (
                    <span
                      className={
                        daysOverdue > 0
                          ? 'text-[#c0392b]'
                          : 'text-muted-foreground'
                      }
                    >
                      {order.deliveryDate}
                      {daysOverdue > 0 && ` (trễ ${daysOverdue} ngày)`}
                    </span>
                  )}
                </div>
              </div>

              <ProgressExpBar percentage={pct} />

              {/* Level Path Game Nodes */}
              <OpsLevelPath
                stages={order.stages}
                isPendingUpdate={updateMutation.isPending}
                onAdvance={(row) => {
                  const nextStatus =
                    row.status === 'pending' ? 'in_progress' : 'done';
                  updateMutation.mutate({
                    progressId: row.id,
                    status: nextStatus,
                  });
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getDaysOverdue(deliveryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  const diff = today.getTime() - delivery.getTime();
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
}
