import {
  useProgressDashboard,
  useUpdateStageStatus,
} from '@/application/orders';

import { STAGE_LABELS, STAGE_STATUS_LABELS } from './order-progress.module';
import type { OrderProgressWithOrder } from './types';

type DashboardOrder = {
  orderId: string;
  orderNumber: string;
  customerName: string;
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
        <p
          style={{
            color: '#c0392b',
            padding: '1rem',
          }}
        >
          Lỗi: {(error as Error).message}
        </p>
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
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
        <div
          className="dashboard-stat-card"
          style={{
            borderColor: '#9ca3af44',
            background: 'rgba(156,163,175,0.05)',
          }}
        >
          <span className="dashboard-stat-number">{waitingToStart.length}</span>
          <span className="dashboard-stat-label">Chờ sản xuất</span>
        </div>
      </div>

      {/* Overdue section */}
      {overdue.length > 0 && (
        <DashboardSection
          title="Đơn trễ hạn"
          eyebrow="Cần xử lý"
          orders={overdue}
          variant="danger"
          updateMutation={updateMutation}
        />
      )}

      {/* Ready to ship section */}
      {readyToShip.length > 0 && (
        <DashboardSection
          title="Sẵn sàng giao hàng"
          eyebrow="Hoàn thành sản xuất"
          orders={readyToShip}
          variant="success"
          updateMutation={updateMutation}
        />
      )}

      {/* In progress section */}
      {inProgress.length > 0 && (
        <DashboardSection
          title="Đang sản xuất"
          eyebrow="Đang xử lý"
          orders={inProgress}
          variant="primary"
          updateMutation={updateMutation}
        />
      )}

      {/* Waiting to start section */}
      {waitingToStart.length > 0 && (
        <DashboardSection
          title="Chờ bắt đầu sản xuất"
          eyebrow="Chưa khởi động"
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
  eyebrow,
  orders,
  variant,
  updateMutation,
}: {
  title: string;
  eyebrow: string;
  orders: DashboardOrder[];
  variant: 'danger' | 'success' | 'primary' | 'muted';

  updateMutation: ReturnType<typeof useUpdateStageStatus>;
}) {
  const borderColor =
    variant === 'danger'
      ? '#e74c3c44'
      : variant === 'success'
        ? '#0c8f6844'
        : variant === 'primary'
          ? '#0b6bcb44'
          : '#9ca3af33';

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h3>
              {title} ({orders.length})
            </h3>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '0 1.25rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {orders.map((order) => {
          const doneCount = order.stages.filter(
            (s) => s.status === 'done',
          ).length;
          const totalCount = order.stages.filter(
            (s) => s.status !== 'skipped',
          ).length;
          const pct =
            totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
          const daysOverdue = order.deliveryDate
            ? getDaysOverdue(order.deliveryDate)
            : 0;

          return (
            <div
              key={order.orderId}
              style={{
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
              }}
            >
              {/* Order header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                  marginBottom: '0.4rem',
                }}
              >
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span className="td-muted" style={{ marginLeft: '0.5rem' }}>
                    {order.customerName}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {pct}%
                  </span>
                  {order.deliveryDate && (
                    <span
                      style={{
                        color: daysOverdue > 0 ? '#c0392b' : 'var(--muted)',
                      }}
                    >
                      {order.deliveryDate}
                      {daysOverdue > 0 && ` (trễ ${daysOverdue} ngày)`}
                    </span>
                  )}
                </div>
              </div>

              {/* Mini progress bar */}
              <div
                style={{
                  height: 4,
                  background: 'var(--border)',
                  borderRadius: 2,
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: pct === 100 ? '#0c8f68' : '#0b6bcb',
                    borderRadius: 2,
                    transition: 'width 300ms ease',
                  }}
                />
              </div>

              {/* Stage chips */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.3rem',
                }}
              >
                {order.stages.map((row) => {
                  const clickable =
                    row.status !== 'done' && row.status !== 'skipped';
                  const statusCls =
                    row.status === 'done'
                      ? 'in_stock'
                      : row.status === 'in_progress'
                        ? 'in_process'
                        : row.status === 'skipped'
                          ? 'damaged'
                          : 'shipped';

                  return (
                    <button
                      key={row.id}
                      type="button"
                      className={`roll-status ${statusCls}`}
                      disabled={updateMutation.isPending || !clickable}
                      onClick={() => {
                        if (!clickable) return;
                        const nextStatus =
                          row.status === 'pending' ? 'in_progress' : 'done';
                        updateMutation.mutate({
                          progressId: row.id,
                          status: nextStatus,
                        });
                      }}
                      style={{
                        cursor: clickable ? 'pointer' : 'default',
                        fontSize: '0.72rem',
                        border: 'none',
                      }}
                      title={`${STAGE_LABELS[row.stage]}: ${STAGE_STATUS_LABELS[row.status]}${clickable ? ' — Nhấn để chuyển' : ''}`}
                    >
                      {STAGE_LABELS[row.stage]}
                    </button>
                  );
                })}
              </div>
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
