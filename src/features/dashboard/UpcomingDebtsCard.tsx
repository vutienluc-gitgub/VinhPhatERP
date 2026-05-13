import { Link } from 'react-router-dom';

import { Icon } from '@/shared/components';
import { formatCompactCurrency } from '@/shared/utils/format';
import type { UpcomingDebt } from '@/application/analytics';

import { DashCardHeader } from './DashCardHeader';
import {
  DASHBOARD_LABELS,
  DEBT_TYPE_ICONS,
  DEFAULT_DEBT_STYLE,
} from './dashboard.constants';

type UpcomingDebtsCardProps = {
  debts: UpcomingDebt[];
  isLoading: boolean;
};

function formatDebtDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function UpcomingDebtsCard({
  debts,
  isLoading,
}: UpcomingDebtsCardProps) {
  if (isLoading) {
    return (
      <div className="dash-debts-card">
        <div className="dash-card-header">
          <div className="skeleton-block h-4 w-36" />
          <div className="skeleton-block h-6 w-6 rounded-full" />
        </div>
        <div className="flex flex-col gap-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block h-[64px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const viewAllAction = (
    <Link
      to="/payments"
      className="dash-add-btn"
      title={DASHBOARD_LABELS.VIEW_ALL}
    >
      <Icon name="ChevronRight" size={16} />
    </Link>
  );

  return (
    <div className="dash-debts-card">
      <DashCardHeader
        title={DASHBOARD_LABELS.DEBTS_TITLE}
        action={viewAllAction}
        showInfo={false}
      />

      {debts.length === 0 ? (
        <p className="task-empty">{DASHBOARD_LABELS.NO_DEBTS}</p>
      ) : (
        <div className="dash-debts-list">
          {debts.map((debt) => {
            const style = DEBT_TYPE_ICONS[debt.type] ?? DEFAULT_DEBT_STYLE;
            return (
              <div key={debt.id} className="dash-debt-item">
                <div
                  className="dash-debt-icon"
                  style={{ background: style.bg, color: style.color }}
                >
                  <Icon name={style.icon} size={18} />
                </div>
                <div className="dash-debt-info">
                  <span className="dash-debt-name">{debt.name}</span>
                  <span className="dash-debt-date">
                    {formatDebtDate(debt.due_date)}
                  </span>
                </div>
                <div className="dash-debt-amount-col">
                  <span className="dash-debt-amount">
                    {formatCompactCurrency(debt.amount)}
                  </span>
                  <span className="dash-debt-status">
                    {debt.type === 'supplier'
                      ? DASHBOARD_LABELS.PAYABLE
                      : DASHBOARD_LABELS.RECEIVABLE}
                  </span>
                </div>
              </div>
            );
          })}

          <Link to="/payments" className="dash-view-all-link">
            {DASHBOARD_LABELS.VIEW_ALL}
          </Link>
        </div>
      )}
    </div>
  );
}
