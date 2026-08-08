import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge, ActionBar } from '@/shared/components';
import type { BadgeVariant } from '@/shared/components/Badge';
import { MoneyCell } from '@/shared/value';
import { ACCOUNT_TYPE_LABELS } from '@/features/payments/payments.module';
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_MESSAGES as MSG,
} from '@/features/payments/payments.constants';
import type { PaymentAccount } from '@/features/payments/types';

type UseAccountColumnsProps = {
  onEdit: (account: PaymentAccount) => void;
  handleDelete: (account: PaymentAccount) => void;
  isDeleting: boolean;
};

export function getAccountStatusVariant(status: string): BadgeVariant {
  return status === 'active' ? 'success' : 'gray';
}

export function useAccountColumns({
  onEdit,
  handleDelete,
  isDeleting,
}: UseAccountColumnsProps): ColumnDef<PaymentAccount>[] {
  return useMemo<ColumnDef<PaymentAccount>[]>(
    () => [
      {
        accessorKey: 'name',
        header: MSG.COL_ACCOUNT,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-foreground">
              {row.original.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {ACCOUNT_TYPE_LABELS[row.original.type]}
            </span>
          </div>
        ),
      },
      {
        id: 'bank_info',
        header: MSG.COL_BANK_INFO,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.bank_name ?? '—'}</span>
            {row.original.account_number && (
              <span className="text-xs text-muted-foreground">
                {row.original.account_number}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'initial_balance',
        header: MSG.COL_INITIAL_BALANCE,
        meta: { className: 'text-right' },
        cell: ({ getValue }) => <MoneyCell value={getValue<number>()} bold />,
      },
      {
        accessorKey: 'current_balance',
        header: MSG.COL_BALANCE,
        meta: { className: 'text-right' },
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <MoneyCell value={v} tone={v >= 0 ? 'success' : 'danger'} bold />
          );
        },
      },
      {
        accessorKey: 'status',
        header: MSG.COL_STATUS,
        cell: ({ getValue }) => {
          const s = getValue<string>() as 'active' | 'inactive';
          return (
            <Badge variant={getAccountStatusVariant(s)}>
              {ACCOUNT_STATUS_LABELS[s]}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
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
