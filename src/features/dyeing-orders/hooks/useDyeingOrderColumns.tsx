import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';

import { Badge, Icon, ActionBar, type ActionConfig } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { DYEING_ORDER_STATUSES } from '@/schema/dyeing-order.schema';
import type { DyeingOrder } from '@/domain/production/dyeing-orders.types';
import { DYEING_ORDER_MESSAGES as MSG } from '@/features/dyeing-orders/dyeing-orders.constants';
import { getStatusVariant } from '@/features/dyeing-orders/dyeing-orders.constants';

type UseDyeingOrderColumnsProps = {
  onView: (id: string) => void;
  onEdit: (order: DyeingOrder) => void;
};

export function useDyeingOrderColumns({
  onView,
  onEdit,
}: UseDyeingOrderColumnsProps): ColumnDef<DyeingOrder>[] {
  return useMemo<ColumnDef<DyeingOrder>[]>(
    () => [
      {
        header: MSG.COL_ORDER_NUMBER,
        id: 'dyeing_order_number',
        sortable: true,
        cell: ({ row: { original: row } }) => (
          <div className="flex flex-col">
            <span className="font-bold text-foreground">
              {row.dyeing_order_number}
            </span>
            <span className="text-[0.7rem] text-muted-foreground">
              {row.order_date
                ? dayjs(row.order_date).format('DD/MM/YYYY')
                : '—'}
            </span>
          </div>
        ),
      },
      {
        header: MSG.COL_SUPPLIER,
        id: 'suppliers',
        sortable: true,
        accessorFn: (row) => row.suppliers?.name,
        cell: ({ row: { original: row } }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.suppliers?.name ?? '—'}</span>
            <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
              {row.suppliers?.code ?? '—'}
            </span>
          </div>
        ),
      },
      {
        header: MSG.COL_STATUS,
        id: 'status',
        sortable: true,
        cell: ({ row: { original: row } }) => (
          <Badge variant={getStatusVariant(row.status)}>
            {DYEING_ORDER_STATUSES[row.status]?.label ?? row.status}
          </Badge>
        ),
      },
      {
        header: MSG.COL_PRICE,
        id: 'unit_price_per_kg',
        sortable: true,
        meta: { className: 'text-right' },
        cell: ({ row: { original: row } }) => (
          <span className="tabular-nums font-medium">
            <MoneyText value={row.unit_price_per_kg} />
          </span>
        ),
      },
      {
        header: MSG.COL_RETURN_DATE,
        id: 'expected_return_date',
        sortable: true,
        meta: { className: 'max-sm:hidden' },
        cell: ({ row: { original: row } }) => (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon name="Calendar" size={16} />
            <span>
              {row.expected_return_date
                ? dayjs(row.expected_return_date).format('DD/MM/YYYY')
                : '—'}
            </span>
          </div>
        ),
      },
      {
        header: '',
        id: 'actions',
        meta: { className: 'w-10 text-right' },
        cell: ({ row: { original: row } }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionBar
              actions={
                [
                  row.status === 'draft'
                    ? {
                        icon: 'Pencil',
                        onClick: () => onEdit(row),
                        title: MSG.BTN_EDIT,
                      }
                    : {
                        icon: 'Eye',
                        onClick: () => onView(row.id),
                        title: MSG.BTN_VIEW,
                      },
                ] as ActionConfig[]
              }
            />
          </div>
        ),
      },
    ],
    [onView, onEdit],
  );
}
