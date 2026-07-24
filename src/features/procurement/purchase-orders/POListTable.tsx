import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import dayjs from 'dayjs';

import {
  DataTableAdvanced,
  AddButton,
  Icon,
  ActionMenu,
  StatusBadge,
} from '@/shared/components';
import { MoneyText } from '@/shared/value';
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
        cell: ({ row }) => <MoneyText value={row.original.total_amount} />,
      },
      {
        accessorKey: 'status',
        header: PO_CONSTANTS.COL_STATUS,
        cell: ({ row }) => (
          <StatusBadge
            domain="PO"
            status={row.original.status}
            progress={row.original.progress_percentage}
          />
        ),
      },
      {
        id: 'actions',
        header: () => (
          <div className="text-right">{PO_CONSTANTS.COL_ACTIONS}</div>
        ),
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
          return (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <span className="mobile-card-title">{po.po_code}</span>
                <StatusBadge
                  domain="PO"
                  status={po.status}
                  progress={po.progress_percentage}
                />
              </div>
              <div className="mobile-card-body space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-lg text-success">
                    <MoneyText value={po.total_amount} />
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
                  <span className="text-xs text-muted w-14">
                    {PO_CONSTANTS.COL_PROGRESS}:
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${(po.progress_percentage ?? 0) >= 100 ? 'bg-green-500' : (po.progress_percentage ?? 0) > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
                      style={{
                        width: `${Math.min(100, Math.max(0, po.progress_percentage ?? 0))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8 text-right">
                    {po.progress_percentage ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
