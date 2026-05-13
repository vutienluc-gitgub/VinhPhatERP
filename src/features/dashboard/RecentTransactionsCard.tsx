import { Icon } from '@/shared/components';
import { formatCompactCurrency } from '@/shared/utils/format';
import type { RecentTransaction } from '@/application/analytics';

import { DashCardHeader } from './DashCardHeader';
import { DASHBOARD_LABELS, TX_STATUS_MAP } from './dashboard.constants';

type RecentTransactionsCardProps = {
  transactions: RecentTransaction[];
  isLoading: boolean;
};

function formatTxDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'short' });
  return `${weekday} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

export function RecentTransactionsCard({
  transactions,
  isLoading,
}: RecentTransactionsCardProps) {
  if (isLoading) {
    return (
      <div className="dash-transactions-card">
        <div className="dash-card-header">
          <div className="skeleton-block h-4 w-32" />
          <div className="skeleton-block h-4 w-16" />
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block h-[48px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const filterAction = (
    <span className="dash-filter-label">
      <Icon name="SlidersHorizontal" size={14} />
      {DASHBOARD_LABELS.FILTER_LABEL}
    </span>
  );

  return (
    <div className="dash-transactions-card">
      <DashCardHeader
        title={DASHBOARD_LABELS.TRANSACTIONS_TITLE}
        action={filterAction}
        showInfo={false}
      />

      {transactions.length === 0 ? (
        <p className="task-empty">{DASHBOARD_LABELS.NO_TRANSACTIONS}</p>
      ) : (
        <div className="dash-tx-table">
          <div className="dash-tx-header">
            <span className="dash-tx-col-activity">
              {DASHBOARD_LABELS.TX_ACTIVITY}
            </span>
            <span className="dash-tx-col-date">{DASHBOARD_LABELS.TX_DATE}</span>
            <span className="dash-tx-col-amount">
              {DASHBOARD_LABELS.TX_AMOUNT}
            </span>
            <span className="dash-tx-col-status">
              {DASHBOARD_LABELS.TX_STATUS}
            </span>
          </div>
          {transactions.map((tx) => {
            const statusInfo = TX_STATUS_MAP[tx.status] ?? {
              label: 'N/A',
              cssClass: 'is-pending',
            };
            return (
              <div key={tx.id} className="dash-tx-row">
                <span className="dash-tx-col-activity">
                  <span className="dash-tx-desc">{tx.description}</span>
                </span>
                <span className="dash-tx-col-date">
                  {formatTxDate(tx.date)}
                </span>
                <span className="dash-tx-col-amount">
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCompactCurrency(tx.amount)}
                </span>
                <span className={`dash-tx-status ${statusInfo.cssClass}`}>
                  {statusInfo.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
