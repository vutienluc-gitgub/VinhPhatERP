import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { ActionBar } from '@/shared/components';
import { MoneyCell } from '@/shared/value';
import { PAYMENT_METHOD_LABELS } from '@/features/payments/payments.module';
import { PAYMENT_LIST_MESSAGES as MSG } from '@/features/payments/payments.constants';
import type { Payment } from '@/features/payments/types';

type UsePaymentColumnsProps = {
  handleDelete: (id: string) => void;
  isDeleting: boolean;
};

export function usePaymentColumns({
  handleDelete,
  isDeleting,
}: UsePaymentColumnsProps): ColumnDef<Payment>[] {
  return useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: 'payment_number',
        header: MSG.COL_PAYMENT_NO,
        cell: ({ row }) => (
          <span className="font-bold text-primary">
            {row.original.payment_number}
          </span>
        ),
      },
      {
        id: 'orders',
        header: MSG.COL_ORDER,
        accessorFn: (p) => p.orders?.order_number,
        cell: ({ row }) => (
          <span className="text-muted">
            {row.original.orders?.order_number ?? '—'}
          </span>
        ),
      },
      {
        id: 'customers',
        header: MSG.COL_CUSTOMER,
        accessorFn: (p) => p.customers?.name,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.customers?.name ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'payment_date',
        header: MSG.COL_DATE,
        meta: { className: 'text-muted text-sm' },
        cell: ({ row }) => row.original.payment_date,
      },
      {
        accessorKey: 'amount',
        header: MSG.COL_AMOUNT,
        meta: { className: 'text-right' },
        cell: ({ row }) => (
          <MoneyCell value={row.original.amount} bold tone="success" />
        ),
      },
      {
        accessorKey: 'payment_method',
        header: MSG.COL_METHOD,
        meta: { className: 'text-muted text-sm' },
        cell: ({ row }) => PAYMENT_METHOD_LABELS[row.original.payment_method],
      },
      {
        id: 'actions',
        header: '',
        meta: { className: 'text-right' },
        cell: ({ row }) => (
          <ActionBar
            actions={[
              {
                icon: 'Trash2',
                onClick: () => handleDelete(row.original.id),
                title: MSG.BTN_DELETE_TITLE,
                variant: 'danger',
                disabled: isDeleting,
              },
            ]}
          />
        ),
      },
    ],
    [handleDelete, isDeleting],
  );
}
