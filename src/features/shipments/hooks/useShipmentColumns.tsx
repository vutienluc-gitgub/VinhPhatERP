import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import {
  Icon,
  EntityLink,
  ActionBar,
  type ActionConfig,
} from '@/shared/components';
import { MoneyText } from '@/shared/value';
import type { Shipment } from '@/features/shipments/types';
import { SHIPMENT_LIST_MESSAGES as MSG } from '@/features/shipments/shipments.constants';
import { ShipmentSaaSBadge } from '@/features/shipments/components/ShipmentMobileCard';
import { calcShipmentCost } from '@/features/shipments/shipments.constants';

type UseShipmentColumnsProps = {
  onConfirm: (shipment: Shipment) => void;
  onDelete: (id: string) => void;
  onExportPdf: (shipment: Shipment, format: 'A4' | 'A5_DOT_MATRIX') => void;
  onDeliveryConfirm: (shipment: Shipment) => void;
  onChat: (shipment: Shipment) => void;
  isConfirming: boolean;
  isDeleting: boolean;
  isExporting: boolean;
};

export function useShipmentColumns({
  onConfirm,
  onDelete,
  onExportPdf,
  onDeliveryConfirm,
  onChat,
  isConfirming,
  isDeleting,
  isExporting,
}: UseShipmentColumnsProps): ColumnDef<Shipment>[] {
  return useMemo<ColumnDef<Shipment>[]>(
    () => [
      {
        header: MSG.COL_SHIPMENT,
        id: 'shipment_number',
        cell: ({ row: { original: s } }) => (
          <div className="flex flex-col gap-1.5 items-start">
            <span className="text-foreground text-[0.9rem] font-bold tracking-tight">
              {s.shipment_number}
            </span>
            <ShipmentSaaSBadge status={s.status} />
            <span className="text-muted-foreground text-[0.75rem] mt-0.5 line-clamp-1">
              {MSG.LBL_CUSTOMER}:{' '}
              <span className="font-medium text-foreground">
                {s.customers?.name ? (
                  <EntityLink
                    entityType="customer"
                    entityId={s.customer_id}
                    label={s.customers.name}
                    showIcon={false}
                  />
                ) : (
                  '—'
                )}
              </span>
              {s.orders?.order_number ? (
                <>
                  {' '}
                  • {MSG.LBL_ORDER}: {s.orders.order_number}
                </>
              ) : (
                <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-warning bg-amber-50 px-1.5 py-0.5 rounded-full">
                  {MSG.LBL_MANUAL}
                </span>
              )}
            </span>
          </div>
        ),
      },
      {
        header: () => (
          <div className="text-right w-full">{MSG.COL_DATE_COST}</div>
        ),
        id: 'shipment_date',
        cell: ({ row: { original: s } }) => {
          const totalCost = calcShipmentCost(s);
          const dateParts = s.shipment_date.split('-');
          const displayDate =
            dateParts.length === 3
              ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
              : s.shipment_date;

          return (
            <div className="flex flex-col gap-1.5 items-end text-right w-full">
              <span className="font-medium text-foreground text-[0.85rem]">
                {displayDate}
              </span>
              <span className="text-muted-foreground text-[0.75rem]">
                {MSG.LBL_COST}:{' '}
                <span className="font-medium text-foreground">
                  {totalCost ? (
                    <>
                      <MoneyText value={totalCost} />
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </span>
            </div>
          );
        },
      },
      {
        header: MSG.COL_ROUTE,
        id: 'destination',
        accessorFn: (s) =>
          s.delivery_address ||
          s.customers?.address ||
          s.customers?.name ||
          'Z',
        meta: { className: 'w-[280px]' },
        cell: ({ row: { original: s } }) => {
          const origin = MSG.LBL_ORIGIN;
          const isCompleted = s.status === 'delivered';
          const destination =
            s.delivery_address ||
            s.customers?.address ||
            s.customers?.name ||
            MSG.LBL_UNKNOWN_DEST;

          return (
            <div className="flex bg-transparent w-full group cursor-default">
              <div className="flex flex-col items-center mr-3 mt-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-surface-strong ring-2 ring-slate-100 dark:ring-slate-800" />
                <div className="w-[1.5px] h-[22px] bg-surface-secondary border-l border-dashed border-muted dark:border-focus my-0.5" />
                <div
                  className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${isCompleted ? 'bg-success' : s.status === 'preparing' ? 'bg-surface-strong' : 'bg-warning-soft animate-pulse'}`}
                />
              </div>
              <div className="flex w-[220px] flex-col justify-between py-[1px]">
                <span
                  className="text-[0.85rem] font-medium text-foreground truncate"
                  title={origin}
                >
                  {origin}
                </span>
                <span
                  className="text-[0.85rem] text-muted-foreground truncate mt-1.5 transition-colors group-hover:text-foreground"
                  title={destination}
                >
                  {destination}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: MSG.COL_DRIVER,
        id: 'delivery_staff',
        accessorFn: (s) => s.delivery_staff?.full_name || 'Z',
        cell: ({ row: { original: s } }) => {
          if (!s.delivery_staff) {
            return (
              <span className="text-warning text-[0.82rem] font-medium">
                {MSG.LBL_UNASSIGNED}
              </span>
            );
          }
          return (
            <div className="flex flex-col gap-1 items-start">
              <span className="font-semibold text-foreground text-[0.85rem]">
                {s.delivery_staff.full_name}
              </span>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <Icon name="Phone" size={12} />
                <span className="text-[0.75rem]">
                  {s.delivery_staff.phone || MSG.LBL_NO_PHONE}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: '',
        id: 'actions',
        meta: { className: 'whitespace-nowrap text-right' },
        cell: ({ row: { original: s } }) => (
          <div
            className="flex justify-end gap-1 items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionBar
              actions={
                [
                  s.status === 'preparing'
                    ? {
                        icon: 'CheckCircle',
                        onClick: () => onConfirm(s),
                        title: MSG.BTN_CONFIRM,
                        disabled: isConfirming,
                      }
                    : null,
                  s.status === 'preparing'
                    ? {
                        icon: 'Trash2',
                        onClick: () => onDelete(s.id),
                        title: MSG.BTN_DELETE,
                        variant: 'danger',
                        disabled: isDeleting,
                      }
                    : null,
                  s.status !== 'preparing'
                    ? {
                        icon: 'Printer',
                        onClick: () => onExportPdf(s, 'A4'),
                        title: MSG.BTN_PRINT_A4,
                        disabled: isExporting,
                      }
                    : null,
                  s.status !== 'preparing'
                    ? {
                        icon: 'Printer',
                        onClick: () => onExportPdf(s, 'A5_DOT_MATRIX'),
                        title: MSG.BTN_PRINT_A5,
                        disabled: isExporting,
                      }
                    : null,
                ].filter(Boolean) as ActionConfig[]
              }
            />
            {s.status === 'shipped' && (
              <button
                className="btn-primary h-8 px-2 text-[0.75rem] flex items-center gap-1"
                type="button"
                onClick={() => onDeliveryConfirm(s)}
              >
                <Icon name="Check" size={16} /> {MSG.BTN_RECEIVE}
              </button>
            )}
            {s.status !== 'preparing' && (
              <button
                className="btn-icon"
                type="button"
                title="Chat"
                onClick={() => onChat(s)}
              >
                <Icon name="MessageCircle" size={16} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [
      onConfirm,
      onDelete,
      onExportPdf,
      onDeliveryConfirm,
      onChat,
      isConfirming,
      isDeleting,
      isExporting,
    ],
  );
}
