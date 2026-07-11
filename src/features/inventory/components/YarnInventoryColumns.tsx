/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from '@tanstack/react-table';

import type { YarnAvailability } from '@/api/yarn-reservation.api';
import { Badge } from '@/shared/components';
import type { BadgeVariant } from '@/shared/components';
import { WeightText } from '@/shared/value';

type StockHealth = {
  label: string;
  variant: BadgeVariant;
  barColor: string;
};

function getStockHealth(row: YarnAvailability): StockHealth {
  if (row.total_stock_qty === 0) {
    return { label: 'Empty', variant: 'gray', barColor: 'bg-slate-300' };
  }

  const pct = (row.available_qty / (row.total_stock_qty || 1)) * 100;

  if (pct >= 50)
    return { label: 'OK', variant: 'success', barColor: 'bg-emerald-500' };
  if (pct >= 10)
    return { label: 'Low', variant: 'warning', barColor: 'bg-amber-500' };
  return { label: 'Risk', variant: 'danger', barColor: 'bg-red-500' };
}

function getAvailablePct(row: YarnAvailability): number {
  const total = row.total_stock_qty || 1;
  return Math.max(0, Math.min(100, (row.available_qty / total) * 100));
}

export const YARN_INVENTORY_COLUMNS: ColumnDef<YarnAvailability, unknown>[] = [
  {
    header: 'Mã sợi',
    id: 'code',
    accessorKey: 'code',
    cell: ({ row }) => (
      <span className="font-bold text-primary">{row.original.code}</span>
    ),
  },
  {
    header: 'Tên sợi',
    id: 'name',
    accessorKey: 'name',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    header: 'Màu sắc',
    id: 'color_name',
    accessorKey: 'color_name',
    cell: ({ row }) => row.original.color_name || '—',
    meta: { className: 'max-sm:hidden' },
  },
  {
    header: 'Tổng tồn (kg)',
    id: 'total_stock_qty',
    accessorKey: 'total_stock_qty',
    cell: ({ row }) => <WeightText value={row.original.total_stock_qty} />,
    meta: { className: 'text-right max-sm:hidden text-slate-600' },
  },
  {
    header: 'Đã giữ (kg)',
    id: 'reserved_qty',
    accessorKey: 'reserved_qty',
    cell: ({ row }) => (
      <span className="text-red-600 font-medium">
        {row.original.reserved_qty > 0 ? (
          <>
            -
            <WeightText value={row.original.reserved_qty} />
          </>
        ) : (
          0
        )}
      </span>
    ),
    meta: { className: 'text-right max-sm:hidden' },
  },
  {
    header: 'Khả dụng (Available)',
    id: 'available_qty',
    accessorKey: 'available_qty',
    meta: { className: 'w-[180px]' },
    cell: ({ row }) => {
      const originalRow = row.original;
      const health = getStockHealth(originalRow);
      const pct = getAvailablePct(originalRow);

      return (
        <div className="flex flex-col gap-1.5 w-full min-w-[140px]">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold">
              <WeightText value={originalRow.available_qty} suffix="kg" />
            </span>
            <Badge variant={health.variant} className="text-[10px]">
              {health.label}
            </Badge>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${health.barColor} transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    },
  },
];

export function YarnInventoryMobileCard({ row }: { row: YarnAvailability }) {
  const health = getStockHealth(row);
  const pct = getAvailablePct(row);

  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{row.code}</span>
          <span className="text-[10px] text-muted font-bold uppercase">
            {row.name}
          </span>
        </div>
        <Badge variant={health.variant} className="text-[10px]">
          {health.label}
        </Badge>
      </div>
      <div className="mobile-card-body space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Màu:</span>
          <span className="text-xs font-medium">{row.color_name || '—'}</span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
          <div
            className={`h-full ${health.barColor} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center bg-surface-subtle/50 p-2 rounded-lg border border-border/30">
          <div>
            <p className="text-[9px] uppercase text-muted font-bold mb-0.5">
              Tổng
            </p>
            <WeightText
              value={row.total_stock_qty}
              className="text-sm font-black text-slate-700"
              suffix=""
            />
            <span className="text-[10px] ml-0.5 font-black text-slate-700">
              kg
            </span>
          </div>
          <div>
            <p className="text-[9px] uppercase text-red-400 font-bold mb-0.5">
              Giữ chỗ
            </p>
            <WeightText
              value={row.reserved_qty}
              className="text-sm font-black text-red-600"
              suffix=""
            />
            <span className="text-[10px] ml-0.5 font-black text-red-600">
              kg
            </span>
          </div>
          <div>
            <p className="text-[9px] uppercase text-emerald-600 font-bold mb-0.5">
              Khả dụng
            </p>
            <WeightText
              value={row.available_qty}
              className="text-sm font-black text-emerald-700"
              suffix=""
            />
            <span className="text-[10px] ml-0.5 font-black text-emerald-700">
              kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
