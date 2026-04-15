import dayjs from 'dayjs';

import {
  DataTablePremium,
  Icon,
  Badge,
  type BadgeVariant,
  type DataTableColumn,
  ActionBar,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { DYEING_ORDER_STATUSES } from '@/schema/dyeing-order.schema';

import type { DyeingOrder } from './types';

type DyeingOrderListProps = {
  data: DyeingOrder[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit: (order: DyeingOrder) => void;
};

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'sent':
      return 'info';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'gray';
  }
}

export function DyeingOrderList({
  data,
  isLoading,
  onView,
  onEdit,
}: DyeingOrderListProps) {
  const columns: DataTableColumn<DyeingOrder>[] = [
    {
      header: 'Mã lệnh',
      cell: (row: DyeingOrder) => (
        <div className="flex flex-col">
          <span className="font-bold text-primary">
            {row.dyeing_order_number}
          </span>
          <span className="text-[0.7rem] text-muted">
            {row.order_date ? dayjs(row.order_date).format('DD/MM/YYYY') : '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Nhà nhuộm',
      cell: (row: DyeingOrder) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.suppliers?.name ?? '—'}</span>
          <span className="text-[0.7rem] text-muted uppercase tracking-wider">
            {row.suppliers?.code ?? '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      cell: (row: DyeingOrder) => (
        <Badge variant={getStatusVariant(row.status)}>
          {DYEING_ORDER_STATUSES[row.status]?.label ?? row.status}
        </Badge>
      ),
    },
    {
      header: 'Đơn giá (kg)',
      className: 'text-right',
      cell: (row: DyeingOrder) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.unit_price_per_kg)}đ
        </span>
      ),
    },
    {
      header: 'Trả hàng (DK)',
      className: 'hide-mobile',
      cell: (row: DyeingOrder) => (
        <div className="flex items-center gap-1.5 text-muted">
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
      className: 'w-10 text-right',
      cell: (row: DyeingOrder) => (
        <ActionBar
          actions={
            [
              row.status === 'draft'
                ? {
                    icon: 'Pencil',
                    onClick: () => onEdit(row),
                    title: 'Sửa',
                  }
                : {
                    icon: 'Eye',
                    onClick: () => onView(row.id),
                    title: 'Xem',
                  },
            ] as ActionConfig[]
          }
        />
      ),
    },
  ];

  return (
    <DataTablePremium
      data={data}
      columns={columns}
      isLoading={isLoading}
      rowKey={(row) => row.id}
      onRowClick={(row) => onView(row.id)}
      emptyStateTitle="Chưa có lệnh nhuộm nào."
      renderMobileCard={(row: DyeingOrder) => (
        <div className="mobile-card">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-bold text-primary">
                {row.dyeing_order_number}
              </div>
              <div className="text-xs text-muted">{row.suppliers?.name}</div>
            </div>
            <Badge variant={getStatusVariant(row.status)}>
              {DYEING_ORDER_STATUSES[row.status]?.label}
            </Badge>
          </div>
          <div className="flex justify-between items-end mt-3 border-t border-border pt-2">
            <div className="text-[0.7rem] text-muted flex items-center gap-1">
              <Icon name="Calendar" size={16} />
              {row.order_date
                ? dayjs(row.order_date).format('DD/MM/YYYY')
                : '—'}
            </div>
            <div className="font-bold text-sm">
              {formatCurrency(row.unit_price_per_kg)}đ/kg
            </div>
          </div>
        </div>
      )}
    />
  );
}
