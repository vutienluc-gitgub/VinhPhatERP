import { Link } from 'react-router-dom'

import { KpiCard, KpiGrid } from '@/shared/components/KpiCard'
import { useDashboardStats, usePendingTasks, useRecentOrders, useCustomerSources } from './useDashboardData'
import { PendingTasksCard } from './PendingTasksCard'
import { RecentOrdersCard } from './RecentOrdersCard'
import { CustomerSourceChart } from './CustomerSourceChart'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <KpiGrid>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card" />
        ))}
      </KpiGrid>
      <KpiGrid>
        {[5, 6, 7, 8].map(i => (
          <div key={i} className="skeleton-card" />
        ))}
      </KpiGrid>
    </div>
  )
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const pendingTasks = usePendingTasks(stats)
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders()
  const { data: customerSources, isLoading: sourcesLoading } = useCustomerSources()

  return (
    <div className="flex flex-col gap-4 w-full max-w-full">
      {/* ── Header ── */}
      <div className="w-full max-w-full p-5 rounded-xl bg-white shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-primary">Tổng quan</p>
            <h3 className="m-0 text-lg font-semibold">Dashboard</h3>
          </div>
          <Link to="/reports" className="text-primary underline">Báo cáo chi tiết →</Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {statsLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
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
              label="Đơn nháp"
              value={String(stats?.draftOrders ?? 0)}
              color="#6b7280"
            />
            <KpiCard
              label="Chờ giao"
              value={String(stats?.pendingShipments ?? 0)}
              color="#d97706"
            />
            <KpiCard
              label="Tỷ lệ chốt đơn"
              value={stats?.conversionRate !== null && stats?.conversionRate !== undefined ? `${stats.conversionRate}%` : '—'}
              color="#0b6bcb"
            />
            <KpiCard
              label="BG sắp hết hạn"
              value={String(stats?.expiringQuotations ?? 0)}
              color={stats?.expiringQuotations ? '#c0392b' : '#6b7280'}
            />
          </KpiGrid>
        </>
      )}

      {/* ── Two-column widgets ── */}
      <div className="dashboard-grid dashboard-grid--2col">
        <PendingTasksCard tasks={pendingTasks} />
        <RecentOrdersCard orders={recentOrders ?? []} isLoading={ordersLoading} />
      </div>

      {/* ── Customer Sources ── */}
      <CustomerSourceChart sources={customerSources ?? []} isLoading={sourcesLoading} />
    </div>
  )
}