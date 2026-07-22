import { useMemo } from 'react';

import type { Column } from '@/shared/components/DataTable';
import { Badge, ActionBar } from '@/shared/components';
import type { IconName } from '@/shared/components/Icon';
import { MoneyText } from '@/shared/value';
import { EXPENSE_CATEGORY_LABELS } from '@/schema/payment.schema';
import {
  getRecurringStatus,
  getRelativeDays,
  getRelativeDateColor,
} from '@/domain/recurring-transactions';
import type { RecurringTransaction } from '@/domain/recurring-transactions/types';
import {
  RECURRING_LABELS,
  RECURRING_STATUS_BADGE,
  FREQUENCY_LABELS,
} from '@/features/recurring-transactions/recurring-transactions.constants';

interface UseRecurringTransactionColumnsProps {
  handleToggle: (tx: RecurringTransaction) => void;
  handleOpenForm: (tx: RecurringTransaction) => void;
  handleDelete: (tx: RecurringTransaction) => void;
  togglePending: boolean;
  deletePending: boolean;
}

export function useRecurringTransactionColumns({
  handleToggle,
  handleOpenForm,
  handleDelete,
  togglePending,
  deletePending,
}: UseRecurringTransactionColumnsProps) {
  return useMemo<Column<RecurringTransaction>[]>(
    () => [
      {
        header: RECURRING_LABELS.headerName,
        id: 'name',
        sortable: true,
        cell: (tx: RecurringTransaction) => {
          const status = getRecurringStatus(tx);
          const badge = RECURRING_STATUS_BADGE[status];
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">{tx.name}</span>
                <Badge variant={badge.variant} icon={badge.icon as IconName}>
                  {badge.label}
                </Badge>
              </div>
              <span className="text-xs text-muted line-clamp-1">
                {tx.description}
              </span>
            </div>
          );
        },
      },
      {
        header: RECURRING_LABELS.headerCategory,
        id: 'category',
        sortable: true,
        cell: (tx: RecurringTransaction) => (
          <Badge variant="info">{EXPENSE_CATEGORY_LABELS[tx.category]}</Badge>
        ),
      },
      {
        header: RECURRING_LABELS.headerAmount,
        id: 'amount',
        sortable: true,
        className: 'text-right',
        cell: (tx: RecurringTransaction) => (
          <span className="font-bold text-text">
            <MoneyText value={tx.amount} />
          </span>
        ),
      },
      {
        header: RECURRING_LABELS.headerFrequency,
        id: 'frequency',
        sortable: true,
        cell: (tx: RecurringTransaction) => (
          <div className="flex flex-col">
            <span>{FREQUENCY_LABELS[tx.frequency]}</span>
            <span className="text-xs text-muted">
              {RECURRING_LABELS.dayPrefix} {tx.day_of_month}
            </span>
          </div>
        ),
      },
      {
        header: RECURRING_LABELS.headerNextDate,
        id: 'next_run_date',
        sortable: true,
        cell: (tx: RecurringTransaction) => {
          if (!tx.is_active) {
            return (
              <span className="text-muted italic">
                {new Date(tx.next_run_date).toLocaleDateString('vi-VN')}
              </span>
            );
          }
          const days = getRelativeDays(tx.next_run_date);
          const colorVariant = getRelativeDateColor(days);
          let relativeText = '';
          if (days < 0) relativeText = RECURRING_LABELS.daysOverdue(days);
          else if (days === 0) relativeText = RECURRING_LABELS.daysToday;
          else relativeText = RECURRING_LABELS.daysRemaining(days);

          const colorClass =
            colorVariant === 'danger'
              ? 'text-danger font-bold'
              : colorVariant === 'warning'
                ? 'text-[var(--warning)] font-semibold'
                : colorVariant === 'info'
                  ? 'text-[var(--primary)] font-semibold'
                  : 'text-[var(--success)]';

          return (
            <div className="flex flex-col gap-0.5">
              <span className={colorClass}>{relativeText}</span>
              <span className="text-xs text-muted">
                {new Date(tx.next_run_date).toLocaleDateString('vi-VN')}
              </span>
            </div>
          );
        },
      },
      {
        header: RECURRING_LABELS.headerTarget,
        id: 'supplier',
        cell: (tx: RecurringTransaction) => (
          <div className="flex flex-col text-sm">
            {tx.suppliers?.name && (
              <span className="text-muted">
                {RECURRING_LABELS.supplierPrefix}: {tx.suppliers.name}
              </span>
            )}
            {tx.employees?.name && (
              <span className="text-muted">
                {RECURRING_LABELS.employeePrefix}: {tx.employees.name}
              </span>
            )}
            {!tx.suppliers?.name && !tx.employees?.name && (
              <span className="text-muted">—</span>
            )}
          </div>
        ),
      },
      {
        header: RECURRING_LABELS.headerActions,
        className: 'text-right',
        onCellClick: () => {},
        cell: (tx: RecurringTransaction) => (
          <ActionBar
            actions={[
              {
                icon: tx.is_active ? 'Pause' : 'Play',
                onClick: () => handleToggle(tx),
                title: tx.is_active
                  ? RECURRING_LABELS.actionPause
                  : RECURRING_LABELS.actionActivate,
                disabled: togglePending,
              },
              {
                icon: 'Pencil',
                onClick: () => handleOpenForm(tx),
                title: RECURRING_LABELS.actionEdit,
              },
              {
                icon: 'Trash2',
                onClick: () => handleDelete(tx),
                title: RECURRING_LABELS.actionDelete,
                variant: 'danger',
                disabled: deletePending,
              },
            ]}
          />
        ),
      },
    ],
    [handleToggle, handleOpenForm, handleDelete, togglePending, deletePending],
  );
}
