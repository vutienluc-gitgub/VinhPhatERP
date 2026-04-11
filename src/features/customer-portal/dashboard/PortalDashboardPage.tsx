import { Link } from 'react-router-dom';

import { formatCurrency } from '@/shared/utils/format';
import { usePortalOrders } from '@/features/customer-portal/hooks/usePortalOrders';
import { usePortalDebt } from '@/features/customer-portal/hooks/usePortalDebt';
import { usePortalShipments } from '@/features/customer-portal/hooks/usePortalShipments';

export function PortalDashboardPage() {
  const { orders, loading: ordersLoading } = usePortalOrders();
  const { remainingDebt, loading: debtLoading } = usePortalDebt();
  const { shipments, loading: shipmentsLoading } = usePortalShipments();

  const latestShipment = shipments[0];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Tổng quan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tổng đơn hàng */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Đơn hàng</p>
          <p className="text-2xl font-semibold text-gray-900">
            {ordersLoading ? '…' : orders.length}
          </p>
          <Link
            to="/portal/orders"
            className="text-xs text-blue-600 mt-2 inline-block"
          >
            Xem tất cả →
          </Link>
        </div>

        {/* Công nợ còn lại */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Công nợ còn lại</p>
          <p className="text-2xl font-semibold text-red-600">
            {debtLoading ? '…' : formatCurrency(remainingDebt)}
          </p>
          <Link
            to="/portal/debt"
            className="text-xs text-blue-600 mt-2 inline-block"
          >
            Chi tiết →
          </Link>
        </div>

        {/* Giao hàng gần nhất */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Giao hàng gần nhất</p>
          {shipmentsLoading ? (
            <p className="text-sm text-gray-400">…</p>
          ) : latestShipment ? (
            <>
              <p className="text-sm font-medium text-gray-900">
                {latestShipment.shipment_number}
              </p>
              <p className="text-xs text-gray-500">
                {latestShipment.shipment_date}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Chưa có</p>
          )}
          <Link
            to="/portal/shipments"
            className="text-xs text-blue-600 mt-2 inline-block"
          >
            Xem tất cả →
          </Link>
        </div>
      </div>

      {/* Recent orders */}
      {!ordersLoading && orders.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              Đơn hàng gần đây
            </p>
            <Link to="/portal/orders" className="text-xs text-blue-600">
              Xem tất cả
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link
                  to={`/portal/orders/${o.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {o.order_number}
                    </p>
                    <p className="text-xs text-gray-500">{o.order_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {formatCurrency(o.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500">{o.status}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
