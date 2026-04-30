import { useNavigate } from 'react-router-dom';

import {
  KpiCardPremium,
  KpiGridPremium,
  Button,
  LiveIndicator,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import {
  useDashboardStats,
  usePendingTasks,
  useRecentOrders,
  useCustomerSources,
} from '@/application/analytics';
import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';

import { CustomerSourceChart } from './CustomerSourceChart';
import { PendingTasksCard } from './PendingTasksCard';
import { RecentOrdersCard } from './RecentOrdersCard';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const pendingTasks = usePendingTasks(stats);
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const { data: customerSources, isLoading: sourcesLoading } =
    useCustomerSources();
  const { activeGuides } = useContextualGuide('Dashboard');

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <h1 className="sr-only">Dashboard</h1>
        <LiveIndicator label="Đang cập nhật" />
        <Button
          id="dashboard-new-order"
          variant="primary"
          leftIcon="Plus"
          onClick={() => navigate('/orders/new')}
          className="rounded-xl px-4 ml-auto"
        >
          <span className="hidden sm:inline">Tạo đơn mới</span>
          <span className="sm:hidden">Thêm</span>
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ── Cột chính (Main Content) - Chiếm 8/12 màn hình lớn ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* ── Top Level KPIs ── */}
          <KpiGridPremium>
            <KpiCardPremium
              label="Đang xử lý"
              value={stats?.activeOrders ?? 0}
              icon="Package"
              variant="primary"
              isLoading={statsLoading}
            />
            <KpiCardPremium
              label="Trễ hạn"
              value={stats?.overdueOrders ?? 0}
              icon="TriangleAlert"
              variant={stats?.overdueOrders ? 'danger' : 'success'}
              isLoading={statsLoading}
              footer={stats?.overdueOrders ? 'Cần xử lý ngay' : 'Đúng tiến độ'}
            />
            <KpiCardPremium
              label="Tổng công nợ"
              value={stats ? `${formatCurrency(stats.totalDebt)} đ` : '—'}
              icon="Wallet"
              variant={stats && stats.totalDebt > 0 ? 'danger' : 'success'}
              isLoading={statsLoading}
            />
            <KpiCardPremium
              label="Thu 7 ngày qua"
              value={stats ? `${formatCurrency(stats.recentPayments)} đ` : '—'}
              icon="CircleCheck"
              variant="success"
              isLoading={statsLoading}
            />
          </KpiGridPremium>

          {/* ── Operational KPIs ── */}
          <KpiGridPremium>
            <KpiCardPremium
              label="Đơn nháp"
              value={stats?.draftOrders ?? 0}
              icon="FileText"
              variant="secondary"
              isLoading={statsLoading}
            />
            <KpiCardPremium
              label="Chờ giao"
              value={stats?.pendingShipments ?? 0}
              icon="Truck"
              variant="warning"
              isLoading={statsLoading}
            />
            <KpiCardPremium
              label="Tỷ lệ chốt"
              value={
                stats?.conversionRate != null ? `${stats.conversionRate}%` : '—'
              }
              icon="TrendingUp"
              variant="primary"
              isLoading={statsLoading}
            />
            <KpiCardPremium
              label="BG sắp hết hạn"
              value={stats?.expiringQuotations ?? 0}
              icon="Clock"
              variant={stats?.expiringQuotations ? 'danger' : 'secondary'}
              isLoading={statsLoading}
            />
          </KpiGridPremium>

          {/* ── Analytics ── */}
          <div className="h-full">
            <CustomerSourceChart
              sources={customerSources ?? []}
              isLoading={sourcesLoading}
            />
          </div>
        </div>

        {/* ── Cột phụ (Widgets) - Chiếm 4/12 màn hình lớn ── */}
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
