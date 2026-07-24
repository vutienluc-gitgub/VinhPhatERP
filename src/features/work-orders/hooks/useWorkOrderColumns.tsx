import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { ActionBar, type ActionConfig, StatusBadge } from '@/shared/components';
import { formatQuantity } from '@/shared/utils/format';
import { MoneyText } from '@/shared/value';
import type { WorkOrderWithRelations } from '@/features/work-orders/types';
import { WORK_ORDER_MESSAGES as MSG } from '@/features/work-orders/work-orders.constants';

type UseWorkOrderColumnsProps = {
  onView: (id: string) => void;
  onEdit: (wo: WorkOrderWithRelations) => void;
  onStart: (id: string) => void;
  isStarting: boolean;
};

export function useWorkOrderColumns({
  onView,
  onEdit,
  onStart,
  isStarting,
}: UseWorkOrderColumnsProps) {
  return useMemo<ColumnDef<WorkOrderWithRelations>[]>(
    () => [
      {
        header: MSG.COL_CODE,
        id: 'work_order_number',
        accessorFn: (wo) => wo.work_order_number,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-primary">
              {row.original.work_order_number}
            </span>
            {row.original.order && (
              <span className="text-xs text-muted truncate max-w-[200px]">
                ĐH: {row.original.order.order_number}
              </span>
            )}
          </div>
        ),
      },
      {
        header: MSG.COL_BOM,
        id: 'bom_template',
        accessorFn: (wo) => wo.bom_template?.code,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold">{row.original.bom_template?.code}</span>
            <span className="text-xs text-muted">
              V{row.original.bom_version}
            </span>
          </div>
        ),
      },
      {
        header: MSG.COL_SUPPLIER,
        id: 'supplier',
        accessorFn: (wo) => wo.supplier?.name,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.supplier?.name}</span>
            <span className="text-xs text-muted">
              <MoneyText value={row.original.weaving_unit_price} />
              /m
            </span>
          </div>
        ),
      },
      {
        header: MSG.COL_TARGET,
        id: 'target_quantity',
        accessorFn: (wo) => wo.target_quantity,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <div className="flex flex-col text-right">
            <span className="font-bold">
              {formatQuantity(row.original.target_quantity)} m
            </span>
            {row.original.target_weight_kg && (
              <span className="text-xs text-muted">
                ~{formatQuantity(row.original.target_weight_kg)} kg
              </span>
            )}
          </div>
        ),
      },
      {
        header: MSG.COL_LOOM,
        id: 'loom',
        accessorFn: (wo) => wo.loom?.code,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">
              {row.original.loom?.code || '—'}
            </span>
          </div>
        ),
      },
      {
        header: MSG.COL_STATUS,
        id: 'status',
        accessorFn: (wo) => wo.status,
        cell: ({ row }) => {
          return (
            <StatusBadge domain="WORK_ORDER" status={row.original.status} />
          );
        },
      },
      {
        header: MSG.COL_START,
        id: 'start_date',
        accessorFn: (wo) => wo.start_date,
        cell: ({ row }) =>
          row.original.start_date
            ? new Date(row.original.start_date).toLocaleDateString('vi-VN')
            : '—',
      },
      {
        id: 'actions',
        header: MSG.COL_ACTIONS,
        meta: { align: 'right' },
        cell: ({ row }) => {
          const wo = row.original;
          return (
            <ActionBar
              actions={
                [
                  {
                    icon: 'Eye',
                    onClick: () => onView(wo.id),
                    title: MSG.BTN_VIEW,
                  },
                  wo.status === 'draft'
                    ? {
                        icon: 'Pencil',
                        onClick: () => onEdit(wo),
                        title: MSG.BTN_EDIT,
                      }
                    : null,
                  wo.status === 'draft'
                    ? {
                        icon: 'Play',
                        onClick: () => onStart(wo.id),
                        title: MSG.BTN_START,
                        disabled: isStarting,
                      }
                    : null,
                ].filter(Boolean) as ActionConfig[]
              }
            />
          );
        },
      },
    ],
    [onView, onEdit, onStart, isStarting],
  );
}
