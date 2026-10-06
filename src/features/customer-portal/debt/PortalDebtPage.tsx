import { Link } from 'react-router-dom';

import { usePortalDebt } from '@/application/crm/portal';
import { MoneyText } from '@/shared/value';
import {
  StatCard,
  EmptyState,
  TableSkeleton,
  ErrorInline,
} from '@/shared/components';

export function PortalDebtPage() {
  const {
    totalAmount,
    paidAmount,
    remainingDebt,
    overdueOrders,
    loading,
    error,
  } = usePortalDebt();

  if (loading) {
    return (
      <div className="portal-section space-y-6">
        <div className="portal-summary-grid">
          {[1, 2, 3].map((i) => (
            <div
              key={`debt-stat-skel-${i}`}
              className="h-28 bg-surface animate-pulse rounded-xl border border-default"
            />
          ))}
        </div>
        <TableSkeleton rows={4} columns={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-section">
        <ErrorInline>{error}</ErrorInline>
      </div>
    );
  }

  return (
    <div className="portal-section">
      <h1 className="portal-page-title">Công nợ</h1>

      {/* ── Stat Cards ── */}
      <div className="portal-summary-grid">
        <StatCard
          label="Tổng tiền đơn hàng"
          value={<MoneyText value={totalAmount} />}
          icon="TrendingUp"
          tone="default"
        />
        <StatCard
          label="Đã thanh toán"
          value={<MoneyText value={paidAmount} />}
          icon="CheckCircle"
          tone="success"
        />
        <StatCard
          label="Còn nợ"
          value={<MoneyText value={remainingDebt} />}
          icon="Receipt"
          tone="danger"
        />
      </div>

      {overdueOrders.length > 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">Đơn hàng còn nợ</div>
          <table className="portal-table">
            <tbody>
              {overdueOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/portal/orders/${o.id}`} className="portal-link">
                      {o.order_number}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      Giao: {o.due_date ?? '—'}
                    </div>
                  </td>
                  <td className="right">
                    <div className="font-medium text-danger">
                      <MoneyText value={o.total_amount - o.paid_amount} />
                    </div>
                    <div className="text-xs text-muted-foreground">còn nợ</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overdueOrders.length === 0 && remainingDebt === 0 && (
        <EmptyState
          icon="CheckCircle2"
          description="Bạn không có công nợ nào cần thanh toán."
        />
      )}
    </div>
  );
}
