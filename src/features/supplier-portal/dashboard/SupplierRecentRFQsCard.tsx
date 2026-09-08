import { Link } from 'react-router-dom';

import { Icon } from '@/shared/components';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

const TEXT = SUPPLIER_PORTAL_LABELS;

export interface RecentRFQItem {
  id: string;
  rfq_code: string;
  title: string;
  deadline_date: string;
}

export interface SupplierRecentRFQsCardProps {
  recentRfqs?: RecentRFQItem[];
}

export function SupplierRecentRFQsCard({
  recentRfqs,
}: SupplierRecentRFQsCardProps) {
  return (
    <div className="portal-card">
      <div className="portal-card-header">
        <span>{TEXT.DASHBOARD_RECENT_RFQ}</span>
        <Link to="/portal/supplier/quotations" className="portal-stat-link">
          {TEXT.DASHBOARD_VIEW_ALL} &rarr;
        </Link>
      </div>
      <div className="portal-card-body p-0">
        {!recentRfqs || recentRfqs.length === 0 ? (
          <div className="portal-empty">
            <div className="portal-empty-icon">
              <Icon name="FileSearch" size={40} />
            </div>
            <p className="font-semibold mb-1">
              {TEXT.DASHBOARD_RECENT_RFQ_EMPTY}
            </p>
            <p className="text-xs text-muted-foreground m-0">
              {TEXT.DASHBOARD_RECENT_RFQ_EMPTY_DESC}
            </p>
          </div>
        ) : (
          recentRfqs.map((rfq) => (
            <Link
              key={rfq.id}
              to={`/portal/supplier/quotations/${rfq.id}`}
              className="flex items-center justify-between gap-2 px-5 py-3 border-b border-dashed border-border last:border-none no-underline text-foreground hover:bg-surface-subtle transition-colors"
            >
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <span className="font-semibold text-sm text-foreground">
                  {rfq.rfq_code}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {rfq.title}
                </span>
              </div>
              <span className="portal-badge portal-badge--info">
                {TEXT.DASHBOARD_STATUS_NEW}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
