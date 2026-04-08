import { KpiCard, KpiGrid } from '@/shared/components/KpiCard';
import { formatCurrency } from '@/shared/utils/format';

import { CustomerSourceChart } from './CustomerSourceChart';
import { PendingTasksCard } from './PendingTasksCard';
import { RecentOrdersCard } from './RecentOrdersCard';
import {
  useDashboardStats,
  usePendingTasks,
  useRecentOrders,
  useCustomerSources,
} from './useDashboardData';

function DashboardSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <KpiGrid>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </KpiGrid>
      <KpiGrid>
        {[5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </KpiGrid>
    </div>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const pendingTasks = usePendingTasks(stats);
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const { data: customerSources, isLoading: sourcesLoading } =
    useCustomerSources();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%',
        padding: '0 0.5rem',
      }}
    >
      <h1 className="sr-only">Dashboard</h1>
      {/* ── KPI Cards ── */}
      {statsLoading ? (
        <DashboardSkeleton />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Primary row */}
          <KpiGrid>
            <KpiCard
              icon="📊"
              label="Đang xử lý"
              value={String(stats?.activeOrders ?? 0)}
              color="#0b6bcb"
            />
            <KpiCard
              icon="⚠️"
              label="Trễ hạn"
              value={String(stats?.overdueOrders ?? 0)}
              color={stats?.overdueOrders ? '#c0392b' : '#0c8f68'}
            />
            <KpiCard
              icon="💰"
              label="Tổng công nợ"
              value={stats ? `${formatCurrency(stats.totalDebt)} đ` : '—'}
              color={stats && stats.totalDebt > 0 ? '#c0392b' : '#0c8f68'}
            />
            <KpiCard
              icon="✅"
              label="Thu 7 ngày qua"
              value={stats ? `${formatCurrency(stats.recentPayments)} đ` : '—'}
              color="#0c8f68"
            />
          </KpiGrid>

          {/* Secondary row */}
          <KpiGrid>
            <KpiCard
              icon="📝"
              label="Đơn nháp"
              value={String(stats?.draftOrders ?? 0)}
              color="#6b7280"
            />
            <KpiCard
              icon="🚚"
              label="Chờ giao"
              value={String(stats?.pendingShipments ?? 0)}
              color="#d97706"
            />
            <KpiCard
              icon="📊"
              label="Tỷ lệ chốt đơn"
              value={
                stats?.conversionRate !== null &&
                stats?.conversionRate !== undefined
                  ? `${stats.conversionRate}%`
                  : '—'
              }
              color="#0b6bcb"
            />
            <KpiCard
              icon="📋"
              label="BG sắp hết hạn"
              value={String(stats?.expiringQuotations ?? 0)}
              color={stats?.expiringQuotations ? '#c0392b' : '#6b7280'}
            />
          </KpiGrid>
        </div>
      )}

      {/* ── Two-column widgets ── */}
      <div
        className="dashboard-grid dashboard-grid--2col"
        style={{ gap: '1.5rem' }}
      >
        <PendingTasksCard tasks={pendingTasks} />
        <RecentOrdersCard
          orders={recentOrders ?? []}
          isLoading={ordersLoading}
        />
      </div>

      {/* ── Customer Sources ── */}
      <div style={{ marginTop: '0.5rem' }}>
        <CustomerSourceChart
          sources={customerSources ?? []}
          isLoading={sourcesLoading}
        />
      </div>
    </div>
  );
}
