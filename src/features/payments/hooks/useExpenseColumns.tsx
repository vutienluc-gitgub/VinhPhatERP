import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge, type BadgeVariant, ActionBar } from '@/shared/components';
import { MoneyCell } from '@/shared/value';
import { EXPENSE_CATEGORY_LABELS } from '@/features/payments/payments.module';
import { EXPENSE_MESSAGES as MSG } from '@/features/payments/payments.constants';
import type { Expense, ExpenseCategory } from '@/features/payments/types';

export function getCategoryVariant(category: ExpenseCategory): BadgeVariant {
  switch (category) {
    case 'salary':
      return 'info';
    case 'yarn_purchase':
    case 'weaving_cost':
    case 'dyeing_cost':
      return 'warning';
    case 'logistics':
      return 'purple';
    case 'supplier_payment':
    case 'equipment':
      return 'danger';
    default:
      return 'gray';
  }
}

type UseExpenseColumnsProps = {
  onEdit: (expense: Expense) => void;
  handleDelete: (expense: Expense) => void;
  isDeleting: boolean;
};

export function useExpenseColumns({
  onEdit,
  handleDelete,
  isDeleting,
}: UseExpenseColumnsProps): ColumnDef<Expense>[] {
  return useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: 'expense_number',
        header: MSG.COL_EXPENSE_NO,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-primary">
              {row.original.expense_number}
            </span>
            <span className="text-xs text-muted">
              {row.original.expense_date}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: MSG.COL_CATEGORY,
        cell: ({ row }) => (
          <Badge variant={getCategoryVariant(row.original.category)}>
            {EXPENSE_CATEGORY_LABELS[row.original.category]}
          </Badge>
        ),
      },
      {
        accessorKey: 'description',
        header: MSG.COL_DESC,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.description}</span>
            {row.original.suppliers?.name && (
              <span className="text-xs text-muted">
                {MSG.LBL_SUPPLIER_PREFIX}
                {row.original.suppliers.name}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: MSG.COL_AMOUNT,
        meta: { className: 'text-right' },
        cell: ({ row }) => (
          <MoneyCell value={row.original.amount} bold tone="danger" />
        ),
      },
      {
        id: 'payment_accounts',
        header: MSG.COL_ACCOUNT,
        accessorFn: (exp) => exp.payment_accounts?.name,
        meta: { className: 'text-muted text-sm' },
        cell: ({ row }) => row.original.payment_accounts?.name ?? '—',
      },
      {
        id: 'actions',
        header: MSG.COL_ACTIONS,
        meta: { className: 'text-right' },
        cell: ({ row }) => (
          <ActionBar
            actions={[
              {
                icon: 'Pencil',
                onClick: () => onEdit(row.original),
                title: MSG.BTN_EDIT_TITLE,
              },
              {
                icon: 'Trash2',
                onClick: () => handleDelete(row.original),
                title: MSG.BTN_DELETE_TITLE,
                variant: 'danger',
                disabled: isDeleting,
              },
            ]}
          />
        ),
      },
    ],
    [onEdit, handleDelete, isDeleting],
  );
}
