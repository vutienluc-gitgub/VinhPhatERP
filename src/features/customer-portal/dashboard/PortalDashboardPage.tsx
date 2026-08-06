import { Link } from 'react-router-dom';

import { usePortalOrders } from '@/application/crm/portal';
import { usePortalDebt } from '@/application/crm/portal';
import { usePortalShipments } from '@/application/crm/portal';
import { useAuth } from '@/features/auth/AuthProvider';
import { MoneyText } from '@/shared/value';
import { Icon, StatCard } from '@/shared/components';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE,
} from '@/features/customer-portal/constants';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng,';
  if (hour < 18) return 'Chào buổi chiều,';
  return 'Chào buổi tối,';
}

export function PortalDashboardPage() {
  const { profile } = useAuth();
  const { orders, loading: ordersLoading } = usePortalOrders();
  const { remainingDebt, loading: debtLoading } = usePortalDebt();
  const { shipments, loading: shipmentsLoading } = usePortalShipments();

  const latestShipment = shipments[0];

  return (
    <div className="portal-section">
      {/* ── Welcome Banner ── */}
      <div className="bg-gradient-to-br from-[#0f1f3d] to-[#1a3a6e] rounded-[14px] px-6 py-5 text-white flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="m-0 text-[0.78rem] text-white/55 uppercase tracking-[0.06em] font-semibold">
            {getGreeting()}
          </p>
          <p className="mt-1 mb-0 text-[1.15rem] font-bold tracking-[-0.01em]">
            {profile?.full_name ?? 'Khách hàng'}
          </p>
        </div>
        <div className="text-[0.78rem] text-white/50 text-right">
          <p className="m-0">Cổng khách hàng</p>
          <p className="mt-1 mb-0 text-white/30">Vĩnh Phát ERP</p>
        </div>
      </div>

      {/* ── Stat Cards (StatCard Component) ── */}
      <div className="portal-summary-grid">
        {/* Don hang */}
        <StatCard
          label="Đơn hàng"
          value={orders.length}
          icon="ShoppingBag"
          tone="default"
          isLoading={ordersLoading}
          linkTo="/portal/orders"
          linkLabel="Xem tất cả"
        />

        {/* Cong no */}
        <StatCard
          label="Công nợ còn lại"
          value={<MoneyText value={remainingDebt} suffix=" đ" />}
          icon="Receipt"
          tone="danger"
          isLoading={debtLoading}
          linkTo="/portal/debt"
          linkLabel="Chi tiết"
        />

        {/* Giao hang */}
        <StatCard
          label="Giao hàng gần nhất"
          value={
            latestShipment ? (
              <span className="text-base font-semibold">
                {latestShipment.shipment_number}
              </span>
            ) : (
              'Chưa có'
            )
          }
          subtext={latestShipment?.shipment_date ?? undefined}
          icon="Truck"
          tone={latestShipment ? 'success' : 'default'}
          isLoading={shipmentsLoading}
          linkTo="/portal/shipments"
          linkLabel="Xem tất cả"
        />
      </div>

      {/* ── Don hang gan day ── */}
      {!ordersLoading && orders.length > 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">
            <span>Đơn hàng gần đây</span>
            <Link to="/portal/orders" className="portal-stat-link">
              Xem tất cả
            </Link>
          </div>

          {/* Desktop table */}
          <div className="portal-table-desktop overflow-x-auto">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Số đơn</th>
                  <th>Ngày đặt</th>
                  <th className="right">Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        to={`/portal/orders/${o.id}`}
                        className="portal-link"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="text-[#647284] text-[0.82rem]">
                      {o.order_date}
                    </td>
                    <td className="right font-semibold">
                      <MoneyText value={o.total_amount} suffix=" đ" />
                    </td>
                    <td>
                      <span
                        className={
                          ORDER_STATUS_BADGE[o.status] ?? 'portal-badge'
                        }
                      >
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="portal-order-cards p-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="portal-order-card">
                <div className="portal-order-card-row">
                  <Link
                    to={`/portal/orders/${o.id}`}
                    className="portal-link text-[0.9rem]"
                  >
                    {o.order_number}
                  </Link>
                  <span
                    className={ORDER_STATUS_BADGE[o.status] ?? 'portal-badge'}
                  >
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </div>
                <div className="portal-order-card-row">
                  <span className="portal-order-card-meta">{o.order_date}</span>
                  <span className="portal-order-card-amount">
                    <MoneyText value={o.total_amount} suffix=" đ" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!ordersLoading && orders.length === 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">
            <span>Đơn hàng gần đây</span>
          </div>
          <div className="portal-empty">
            <div className="portal-empty-icon">
              <Icon name="Inbox" size={40} />
            </div>
            <p>Chưa có đơn hàng nào.</p>
          </div>
        </div>
      )}
    </div>
  );
}
