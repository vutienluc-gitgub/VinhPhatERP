/**
 * OrderProgressDashboard — Trang tổng hợp tiến độ hoàn thành đơn hàng.
 *
 * Hiển thị KPI cards + bảng chi tiết với progress bar và stage timeline.
 */
import { useOrderFulfillment } from '@/application/crm/useOrderFulfillment';

import { FulfillmentKpiCards } from './components/FulfillmentKpiCards';
import { OrderFulfillmentTable } from './components/OrderFulfillmentTable';

const EMPTY_SUMMARY = {
  totalOrders: 0,
  fulfilledOrders: 0,
  overdueOrders: 0,
  avgFulfillmentPct: 0,
  totalProducedM: 0,
  totalTargetM: 0,
};

export function OrderProgressDashboard() {
  const { data, isLoading } = useOrderFulfillment();

  const summary = data?.summary ?? EMPTY_SUMMARY;
  const rows = data?.data ?? [];

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-zinc-900">Tiến Độ Đơn Hàng</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Tổng hợp tỉ lệ hoàn thành sản xuất và tiến độ giao hàng
        </p>
      </div>

      {/* KPI Cards */}
      <FulfillmentKpiCards summary={summary} isLoading={isLoading} />

      {/* Fulfillment Table */}
      <OrderFulfillmentTable data={rows} isLoading={isLoading} />
    </div>
  );
}
