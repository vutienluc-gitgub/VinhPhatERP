import { useNavigate } from 'react-router-dom';

import { KpiCard, KpiGrid, Button, LiveIndicator } from '@/shared/components';
import { formatCompactCurrency } from '@/shared/utils/format';
import {
  useDashboardStats,
  usePendingTasks,
  useRecentOrders,
  useDashboardRevenue,
  useYarnSpending,
  useUpcomingDebts,
  useRecentTransactions,
} from '@/application/analytics';
import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';

import { DASHBOARD_LABELS } from './dashboard.constants';
import { RevenueOverviewCard } from './RevenueOverviewCard';
import { SpendingOverviewCard } from './SpendingOverviewCard';
import { CashFlowCard } from './CashFlowCard';
import { UpcomingDebtsCard } from './UpcomingDebtsCard';
import { RecentTransactionsCard } from './RecentTransactionsCard';
import { PendingTasksCard } from './PendingTasksCard';
import { RecentOrdersCard } from './RecentOrdersCard';
import { NotificationBanner } from './NotificationBanner';
import { QuickAccessBar } from './QuickAccessBar';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const pendingTasks = usePendingTasks(stats);
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const { activeGuides } = useContextualGuide('Dashboard');

  // v3 hooks
  const { data: revenueResult, isLoading: revenueLoading } =
    useDashboardRevenue();
  const { data: spendingResult, isLoading: spendingLoading } =
    useYarnSpending();
  const { data: upcomingDebts, isLoading: debtsLoading } = useUpcomingDebts();
  const { data: transactions, isLoading: txLoading } = useRecentTransactions();

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <h1 className="sr-only">Dashboard</h1>
        <LiveIndicator label={DASHBOARD_LABELS.LIVE_UPDATE} />
        <Button
          id="dashboard-new-order"
          variant="primary"
          leftIcon="Plus"
          onClick={() => navigate('/orders/new')}
          className="rounded-xl px-4 ml-auto"
        >
          <span className="hidden sm:inline">
            {DASHBOARD_LABELS.BTN_NEW_ORDER}
          </span>
          <span className="sm:hidden">
            {DASHBOARD_LABELS.BTN_NEW_ORDER_SHORT}
          </span>
        </Button>
      </div>

      {/* ── Notification Banner — pending work items ── */}
      <NotificationBanner stats={stats} isLoading={statsLoading} />

      {/* ── Quick Access Toolbar — common operations ── */}
      <div className="dash-grid-row">
        <QuickAccessBar />
      </div>

      {/* ── Row 1: Revenue + Spending (2 cols) ── */}
      <div className="dash-grid dash-grid-row">
        <RevenueOverviewCard
          data={revenueResult?.data ?? []}
          total={revenueResult?.total ?? 0}
          changePercent={revenueResult?.changePercent ?? null}
          isLoading={revenueLoading}
        />
        <SpendingOverviewCard
          total={spendingResult?.total ?? 0}
          changePercent={spendingResult?.changePercent ?? null}
          breakdown={spendingResult?.breakdown ?? []}
          isLoading={spendingLoading}
        />
      </div>

      {/* ── Row 2: CashFlow + Upcoming Debts (2:1 ratio) ── */}
      <div className="dash-grid dash-grid-2-1 dash-grid-row">
        <CashFlowCard
          revenueData={revenueResult?.data ?? []}
          revenueTotal={revenueResult?.total ?? 0}
          isLoading={revenueLoading}
        />
        <UpcomingDebtsCard
          debts={upcomingDebts ?? []}
          isLoading={debtsLoading}
        />
      </div>

      {/* ── Row 3: Recent Transactions (full-width) ── */}
      <div className="dash-grid-row">
        <RecentTransactionsCard
          transactions={transactions ?? []}
          isLoading={txLoading}
        />
      </div>

      {/* ── Row 4: KPI Grid + Quick Actions (preserved from v2) ── */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <KpiGrid>
            <KpiCard
              label={DASHBOARD_LABELS.KPI_PROCESSING}
              value={stats?.activeOrders ?? 0}
              icon="Package"
              variant="primary"
              isLoading={statsLoading}
            />
            <KpiCard
              label={DASHBOARD_LABELS.KPI_OVERDUE}
              value={stats?.overdueOrders ?? 0}
              icon="TriangleAlert"
              variant={stats?.overdueOrders ? 'danger' : 'success'}
              isLoading={statsLoading}
              footer={
                stats?.overdueOrders
                  ? DASHBOARD_LABELS.KPI_OVERDUE_ACTION
                  : DASHBOARD_LABELS.KPI_ON_TIME
              }
            />
            <KpiCard
              label={DASHBOARD_LABELS.KPI_TOTAL_DEBT}
              value={stats ? formatCompactCurrency(stats.totalDebt) : '—'}
              icon="Wallet"
              variant={stats && stats.totalDebt > 0 ? 'danger' : 'success'}
              isLoading={statsLoading}
            />
            <KpiCard
              label={DASHBOARD_LABELS.KPI_RECENT_PAYMENT}
              value={stats ? formatCompactCurrency(stats.recentPayments) : '—'}
              icon="CircleCheck"
              variant="success"
              isLoading={statsLoading}
            />
          </KpiGrid>

          <KpiGrid>
            <KpiCard
              label={DASHBOARD_LABELS.KPI_DRAFT}
              value={stats?.draftOrders ?? 0}
              icon="FileText"
              variant="secondary"
              isLoading={statsLoading}
            />
            <KpiCard
              label={DASHBOARD_LABELS.KPI_PENDING_SHIP}
              value={stats?.pendingShipments ?? 0}
              icon="Truck"
              variant="warning"
              isLoading={statsLoading}
            />
            <KpiCard
              label={DASHBOARD_LABELS.KPI_CONVERSION}
              value={
                stats?.conversionRate != null ? `${stats.conversionRate}%` : '—'
              }
              icon="TrendingUp"
              variant="primary"
              isLoading={statsLoading}
            />
            <KpiCard
              label={DASHBOARD_LABELS.KPI_EXPIRING_QUOTE}
              value={stats?.expiringQuotations ?? 0}
              icon="Clock"
              variant={stats?.expiringQuotations ? 'danger' : 'secondary'}
              isLoading={statsLoading}
            />
          </KpiGrid>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <PendingTasksCard tasks={pendingTasks} />
          <RecentOrdersCard
            orders={recentOrders ?? []}
            isLoading={ordersLoading}
          />
        </div>
      </div>
      <ContextualGuide activeGuides={activeGuides} />
    </div>
  );
}
