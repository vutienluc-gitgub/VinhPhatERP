import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import dayjs from 'dayjs';

import {
  Badge,
  DataTableAdvanced,
  AddButton,
  Icon,
  ActionMenu,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import type { PurchaseOrder } from '@/domain/purchase-orders';

import { PO_CONSTANTS } from './purchase-orders.constants';

export function POListTable({
  data,
  isLoading,
}: {
  data: PurchaseOrder[];
  isLoading: boolean;
}) {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      {
        accessorKey: 'po_code',
        header: PO_CONSTANTS.COL_PO_CODE,
        cell: ({ row }) => (
          <span className="font-bold text-primary">{row.original.po_code}</span>
        ),
      },
      {
        accessorKey: 'order_date',
        header: PO_CONSTANTS.COL_ORDER_DATE,
        cell: ({ row }) => dayjs(row.original.order_date).format('DD/MM/YYYY'),
      },
      {
        accessorKey: 'supplier_name_snapshot',
        header: PO_CONSTANTS.COL_SUPPLIER,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.supplier_name_snapshot}
          </span>
        ),
      },
      {
        accessorKey: 'total_amount',
        header: PO_CONSTANTS.COL_TOTAL_AMOUNT,
        meta: { className: 'text-right font-medium text-success' },
        cell: ({ row }) => formatCurrency(row.original.total_amount) + ' đ',
      },
      {
        accessorKey: 'status',
        header: PO_CONSTANTS.COL_STATUS,
        cell: ({ row }) => {
          const s = row.original.status;
          if (s === 'draft')
            return <Badge variant="gray">{PO_CONSTANTS.STATUS_DRAFT}</Badge>;
          if (s === 'approved')
            return <Badge variant="info">{PO_CONSTANTS.STATUS_APPROVED}</Badge>;
          if (s === 'partial_received')
            return (
              <Badge variant="warning">{PO_CONSTANTS.STATUS_PARTIAL}</Badge>
            );
          if (s === 'completed')
            return (
              <Badge variant="success">{PO_CONSTANTS.STATUS_COMPLETED}</Badge>
            );
          if (s === 'rejected')
            return (
              <Badge variant="danger">{PO_CONSTANTS.STATUS_REJECTED}</Badge>
            );
          if (s === 'cancelled')
            return (
              <Badge variant="danger">{PO_CONSTANTS.STATUS_CANCELLED}</Badge>
            );
          return <Badge variant="gray">{s}</Badge>;
        },
      },
      {
        accessorKey: 'progress_percentage',
        header: PO_CONSTANTS.COL_PROGRESS,
        cell: ({ row }) => {
          const p = row.original.progress_percentage ?? 0;
          return (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className={`h-full ${p >= 100 ? 'bg-green-500' : p > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
                  style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
                />
              </div>
              <span className="text-xs font-medium">{p}%</span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Thao tác</div>,
        meta: { className: 'text-right' },
        cell: ({ row }) => {
          const po = row.original;
          return (
            <div className="flex justify-end">
              <ActionMenu
                items={[
                  {
                    icon: 'Eye',
                    onClick: () => navigate(`/purchase-orders/${po.id}`),
                    label: PO_CONSTANTS.ACTION_VIEW_DETAIL,
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [navigate],
  );

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area flex justify-between items-center px-4 py-3">
        <div>
          <h1 className="text-lg font-bold m-0 text-foreground">
            {PO_CONSTANTS.PAGE_TITLE}
          </h1>
          <p className="text-sm text-muted">{PO_CONSTANTS.PAGE_SUBTITLE}</p>
        </div>
        <AddButton
          label={PO_CONSTANTS.BTN_CREATE_NEW}
          icon="Plus"
          onClick={() => navigate('/purchase-orders/create')}
        />
      </div>
      <DataTableAdvanced
        data={data}
        columns={columns}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/purchase-orders/${row.id}`)}
        renderMobileCard={(po) => {
          const p = po.progress_percentage ?? 0;
          const s = po.status;

          let StatusBadge = <Badge variant="gray">{s}</Badge>;
          if (s === 'draft')
            StatusBadge = (
              <Badge variant="gray">{PO_CONSTANTS.STATUS_DRAFT}</Badge>
            );
          if (s === 'approved')
            StatusBadge = (
              <Badge variant="info">{PO_CONSTANTS.STATUS_APPROVED}</Badge>
            );
          if (s === 'partial_received')
            StatusBadge = (
              <Badge variant="warning">{PO_CONSTANTS.STATUS_PARTIAL}</Badge>
            );
          if (s === 'completed')
            StatusBadge = (
              <Badge variant="success">{PO_CONSTANTS.STATUS_COMPLETED}</Badge>
            );
          if (s === 'rejected')
            StatusBadge = (
              <Badge variant="danger">{PO_CONSTANTS.STATUS_REJECTED}</Badge>
            );
          if (s === 'cancelled')
            StatusBadge = (
              <Badge variant="danger">{PO_CONSTANTS.STATUS_CANCELLED}</Badge>
            );

          return (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <span className="mobile-card-title">{po.po_code}</span>
                {StatusBadge}
              </div>
              <div className="mobile-card-body space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-lg text-success">
                    {formatCurrency(po.total_amount)} đ
                  </div>
                  <div className="text-sm text-muted flex items-center gap-1">
                    <Icon name="Calendar" size={14} />
                    {dayjs(po.order_date).format('DD/MM/YYYY')}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Truck" size={16} className="text-muted" />
                  <span className="font-medium">
                    {po.supplier_name_snapshot}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                  <span className="text-xs text-muted w-14">Tiến độ:</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${p >= 100 ? 'bg-green-500' : p > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
                      style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8 text-right">{p}%</span>
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
