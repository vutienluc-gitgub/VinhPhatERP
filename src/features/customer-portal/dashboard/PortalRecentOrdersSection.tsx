import { Link } from 'react-router-dom';

import type { PortalOrder } from '@/domain/portal/types';
import { MoneyText } from '@/shared/value';
import { Icon } from '@/shared/components';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE,
  PORTAL_DASHBOARD_LABELS,
} from '@/features/customer-portal/constants';

interface PortalRecentOrdersSectionProps {
  orders: PortalOrder[];
  ordersLoading: boolean;
}

export function PortalRecentOrdersSection({
  orders,
  ordersLoading,
}: PortalRecentOrdersSectionProps) {
  if (ordersLoading) {
    return (
      <div className="portal-table-wrap p-5 space-y-3">
        <div className="h-5 w-36 bg-surface-secondary rounded animate-pulse" />
        <div className="h-10 bg-surface-secondary/70 rounded-lg animate-pulse" />
        <div className="h-10 bg-surface-secondary/50 rounded-lg animate-pulse" />
        <div className="h-10 bg-surface-secondary/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="portal-table-wrap">
        <div className="portal-card-header">
          <span className="font-semibold text-foreground">
            {PORTAL_DASHBOARD_LABELS.RECENT_ORDERS_TITLE}
          </span>
        </div>
        <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-secondary text-muted flex items-center justify-center mb-3.5 ring-8 ring-surface-secondary/40">
            <Icon name="PackageOpen" size={28} />
          </div>
          <h3 className="text-sm font-semibold text-foreground m-0">
            {PORTAL_DASHBOARD_LABELS.EMPTY_ORDERS_TITLE}
          </h3>
          <p className="text-xs text-muted mt-1.5 mb-5 max-w-sm leading-relaxed">
            {PORTAL_DASHBOARD_LABELS.EMPTY_ORDERS_DESC}
          </p>
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            <Link
              to="/portal/customer/fabric-catalog"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <Icon name="Layers" size={14} />
              <span>{PORTAL_DASHBOARD_LABELS.BTN_CATALOG}</span>
            </Link>
            <Link
              to="/portal/customer/quotations"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-border bg-surface hover:bg-surface-secondary text-foreground transition-all shadow-xs"
            >
              <Icon name="FilePlus2" size={14} />
              <span>{PORTAL_DASHBOARD_LABELS.BTN_QUOTATION}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-table-wrap">
      <div className="portal-card-header">
        <span className="font-semibold text-foreground">
          {PORTAL_DASHBOARD_LABELS.RECENT_ORDERS_TITLE}
        </span>
        <Link to="/portal/customer/orders" className="portal-stat-link">
          {PORTAL_DASHBOARD_LABELS.VIEW_ALL}
        </Link>
      </div>

      {/* Desktop Table */}
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
                    to={`/portal/customer/orders/${o.id}`}
                    className="portal-link font-medium"
                  >
                    {o.order_number}
                  </Link>
                </td>
                <td className="text-muted text-[0.82rem]">{o.order_date}</td>
                <td className="right font-semibold text-foreground">
                  <MoneyText value={o.total_amount} />
                </td>
                <td>
                  <span
                    className={ORDER_STATUS_BADGE[o.status] ?? 'portal-badge'}
                  >
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="p-3 flex flex-col gap-3 md:hidden">
        {orders.slice(0, 5).map((o) => (
          <div
            key={o.id}
            className="p-3 rounded-xl border border-border bg-surface flex flex-col gap-2 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <Link
                to={`/portal/customer/orders/${o.id}`}
                className="portal-link text-[0.9rem]"
              >
                {o.order_number}
              </Link>
              <span className={ORDER_STATUS_BADGE[o.status] ?? 'portal-badge'}>
                {ORDER_STATUS_LABELS[o.status] ?? o.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{o.order_date}</span>
              <span className="font-semibold text-foreground">
                <MoneyText value={o.total_amount} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
