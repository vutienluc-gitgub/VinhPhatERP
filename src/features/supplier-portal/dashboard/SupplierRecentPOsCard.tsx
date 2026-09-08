import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

import { Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

const TEXT = SUPPLIER_PORTAL_LABELS;

export interface RecentPOItem {
  id: string;
  po_code: string;
  order_date: string;
  total_amount: number;
  status: string;
}

export interface SupplierRecentPOsCardProps {
  recentPos?: RecentPOItem[];
  getPoStatusBadge: (status: string) => React.ReactNode;
}

export function SupplierRecentPOsCard({
  recentPos,
  getPoStatusBadge,
}: SupplierRecentPOsCardProps) {
  return (
    <div className="portal-card">
      <div className="portal-card-header">
        <span>{TEXT.DASHBOARD_RECENT_PO}</span>
        <Link to="/portal/supplier/orders" className="portal-stat-link">
          {TEXT.DASHBOARD_VIEW_ALL} &rarr;
        </Link>
      </div>
      <div className="portal-card-body p-0">
        {!recentPos || recentPos.length === 0 ? (
          <div className="portal-empty">
            <div className="portal-empty-icon">
              <Icon name="Inbox" size={40} />
            </div>
            <p className="font-semibold mb-1">
              {TEXT.DASHBOARD_RECENT_PO_EMPTY}
            </p>
            <p className="text-xs text-muted-foreground m-0">
              {TEXT.DASHBOARD_RECENT_PO_EMPTY_DESC}
            </p>
          </div>
        ) : (
          recentPos.map((po) => (
            <div
              key={po.id}
              className="flex items-center justify-between gap-2 px-5 py-3 border-b border-dashed border-border last:border-none"
            >
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <span className="font-semibold text-sm text-foreground">
                  {po.po_code}
                </span>
                <span className="text-xs text-muted-foreground">
                  {dayjs(po.order_date).format('DD/MM/YYYY')} —{' '}
                  <MoneyText value={po.total_amount ?? 0} />
                </span>
              </div>
              {getPoStatusBadge(po.status)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
