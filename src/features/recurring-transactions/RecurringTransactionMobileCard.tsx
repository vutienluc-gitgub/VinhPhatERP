import { Icon, Badge } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { EXPENSE_CATEGORY_LABELS } from '@/schema/payment.schema';
import { getRecurringStatus, isDue } from '@/domain/recurring-transactions';
import type { RecurringTransaction } from '@/domain/recurring-transactions/types';

import {
  FREQUENCY_LABELS,
  RECURRING_STATUS_BADGE,
  RECURRING_LABELS,
} from './recurring-transactions.constants';

type MobileCardProps = {
  tx: RecurringTransaction;
  onToggle: (tx: RecurringTransaction) => void;
  onEdit: (tx: RecurringTransaction) => void;
  onDelete: (tx: RecurringTransaction) => void;
  togglePending: boolean;
  deletePending: boolean;
};

export function RecurringTransactionMobileCard({
  tx,
  onToggle,
  onEdit,
  onDelete,
  togglePending,
  deletePending,
}: MobileCardProps) {
  const status = getRecurringStatus(tx);
  const badge = RECURRING_STATUS_BADGE[status];
  const isOverdue = tx.is_active && isDue(tx.next_run_date);

  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col gap-1">
          <span className="mobile-card-title">{tx.name}</span>
          <div className="flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <Badge variant="info">{EXPENSE_CATEGORY_LABELS[tx.category]}</Badge>
          </div>
        </div>
        <span className="font-bold text-danger text-lg">
          <MoneyText value={tx.amount} />
        </span>
      </div>
      <div className="mobile-card-body space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {tx.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {FREQUENCY_LABELS[tx.frequency]} - {RECURRING_LABELS.dayPrefix}{' '}
            {tx.day_of_month}
          </span>
          <span className={isOverdue ? 'text-danger font-semibold' : ''}>
            {RECURRING_LABELS.nextLabel}:{' '}
            {new Date(tx.next_run_date).toLocaleDateString('vi-VN')}
          </span>
        </div>
        {(tx.suppliers?.name || tx.employees?.name) && (
          <div className="text-xs text-muted-foreground">
            {tx.suppliers?.name &&
              `${RECURRING_LABELS.supplierPrefix}: ${tx.suppliers.name}`}
            {tx.suppliers?.name && tx.employees?.name && ' | '}
            {tx.employees?.name &&
              `${RECURRING_LABELS.employeePrefix}: ${tx.employees.name}`}
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t border-border/10">
          <button
            className="btn-secondary flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(tx);
            }}
            disabled={togglePending}
          >
            <Icon name={tx.is_active ? 'Pause' : 'Play'} size={16} />{' '}
            {tx.is_active
              ? RECURRING_LABELS.actionPauseShort
              : RECURRING_LABELS.actionActivateShort}
          </button>
          <button
            className="btn-secondary flex-1 text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(tx);
            }}
          >
            <Icon name="Pencil" size={16} /> {RECURRING_LABELS.actionEdit}
          </button>
          <button
            className="btn-secondary flex-1 text-danger border-danger/20"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tx);
            }}
            disabled={deletePending}
          >
            <Icon name="Trash2" size={16} /> {RECURRING_LABELS.actionDelete}
          </button>
        </div>
      </div>
    </div>
  );
}
