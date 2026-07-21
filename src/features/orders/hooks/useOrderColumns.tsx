import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge, ActionBar } from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { isOrderEditable } from '@/domain/orders/OrderStateMachine';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_VARIANTS,
} from '@/schema/order.schema';
import type { Order } from '@/features/orders/types';
import {
  daysUntilDelivery,
  calculateBalanceDue,
} from '@/features/orders/utils';
import { ORDERS_LIST_LABELS } from '@/features/orders/orders.constants';

type UseOrderColumnsProps = {
  isAdmin: boolean;
  onEdit: (order: Order) => void;
  onView: (order: Order) => void;
  handleDelete: (order: Order) => Promise<void>;
};

export function useOrderColumns({
  isAdmin,
  onEdit,
  onView,
  handleDelete,
}: UseOrderColumnsProps): ColumnDef<Order>[] {
  return useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'order_number',
        header: ORDERS_LIST_LABELS.COL_ORDER_CUSTOMER,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-bold text-primary">
                {order.order_number}
              </span>
              <span className="text-sm">
                {order.customers?.name ?? '—'}
                {order.customers?.code && (
                  <span className="text-xs text-muted ml-1 italic">
                    ({order.customers.code})
                  </span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'order_date',
        header: ORDERS_LIST_LABELS.COL_ORDER_DATE,
        meta: { className: 'text-muted text-sm' },
        cell: ({ row }) => row.original.order_date,
      },
      {
        accessorKey: 'delivery_date',
        header: ORDERS_LIST_LABELS.COL_DELIVERY_DATE,
        cell: ({ row }) => {
          const order = row.original;
          const due = daysUntilDelivery(order.delivery_date);
          return (
            <div className="flex flex-col">
              <span className="text-sm">{order.delivery_date ?? '—'}</span>
              {due && (
                <span
                  className={`text-[10px] font-bold uppercase ${due.urgent ? 'text-danger animate-pulse' : 'text-muted'}`}
                >
                  {due.text}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'total_amount',
        header: ORDERS_LIST_LABELS.COL_TOTAL,
        meta: { className: 'text-right tabular-nums font-medium' },
        cell: ({ row }) => (
          <MoneyText value={row.original.total_amount} suffix="đ" />
        ),
      },
      {
        id: 'paid_amount',
        header: ORDERS_LIST_LABELS.COL_BALANCE,
        accessorFn: (order) => calculateBalanceDue(order),
        meta: { className: 'text-right tabular-nums font-bold' },
        cell: ({ row }) => {
          const order = row.original;
          const balanceDue = calculateBalanceDue(order);
          return (
            <MoneyText
              value={balanceDue}
              className={balanceDue > 0 ? 'text-danger' : 'text-success'}
              suffix="đ"
            />
          );
        },
      },
      {
        accessorKey: 'status',
        header: ORDERS_LIST_LABELS.COL_STATUS,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <Badge
              variant={ORDER_STATUS_BADGE_VARIANTS[order.status] ?? 'gray'}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: ORDERS_LIST_LABELS.COL_ACTIONS,
        meta: { className: 'text-right' },
        cell: ({ row }) => {
          const order = row.original;
          return (
            <ActionBar
              actions={
                [
                  isOrderEditable(order.status, isAdmin)
                    ? {
                        icon: 'Edit3',
                        onClick: () => onEdit(order),
                      }
                    : null,
                  order.status === 'draft'
                    ? {
                        icon: 'Trash2',
                        onClick: () => handleDelete(order),
                        variant: 'danger',
                      }
                    : null,
                  !isOrderEditable(order.status, isAdmin) ||
                  order.status !== 'draft'
                    ? {
                        icon: 'Eye',
                        onClick: () => onView(order),
                      }
                    : null,
                ].filter(Boolean) as ActionConfig[]
              }
            />
          );
        },
      },
    ],
    [isAdmin, onEdit, onView, handleDelete],
  );
}
