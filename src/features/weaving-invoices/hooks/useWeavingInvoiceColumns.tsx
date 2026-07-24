import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { ActionBar, Badge, type ActionConfig } from '@/shared/components';
import { formatQuantity } from '@/shared/utils/format';
import { MoneyText } from '@/shared/value';
import { WEAVING_STATUS_LABELS } from '@/schema/weaving-invoice.schema';
import type { WeavingInvoice } from '@/features/weaving-invoices/types';
import {
  getStatusVariant,
  WEAVING_INVOICE_MESSAGES as MSG,
} from '@/features/weaving-invoices/weaving-invoices.constants';

type UseWeavingInvoiceColumnsProps = {
  onEdit: (invoice: WeavingInvoice) => void;
  onConfirm: (invoice: WeavingInvoice) => void;
  onDelete: (invoice: WeavingInvoice) => void;
  isConfirming: boolean;
  isDeleting: boolean;
};

export function useWeavingInvoiceColumns({
  onEdit,
  onConfirm,
  onDelete,
  isConfirming,
  isDeleting,
}: UseWeavingInvoiceColumnsProps) {
  return useMemo<ColumnDef<WeavingInvoice>[]>(
    () => [
      {
        id: 'invoice_number',
        accessorFn: (inv) => inv.invoice_number,
        header: MSG.COL_INVOICE,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-primary">
              {row.original.invoice_number}
            </span>
            <span className="text-xs text-muted mt-0.5">
              {row.original.invoice_date}
            </span>
          </div>
        ),
      },
      {
        id: 'supplier',
        accessorFn: (inv) => inv.suppliers?.name || '',
        header: MSG.COL_SUPPLIER,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">
              {row.original.suppliers?.name ?? '—'}
            </span>
            {row.original.suppliers?.code && (
              <span className="text-xs font-semibold text-primary/80 mt-0.5">
                {row.original.suppliers.code}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'fabric_type',
        accessorFn: (inv) => inv.fabric_type,
        header: MSG.COL_FABRIC,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.fabric_type}</span>
        ),
      },
      {
        id: 'total_weight_kg',
        accessorFn: (inv) => inv.total_weight_kg,
        header: MSG.COL_WEIGHT,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-bold">
            {formatQuantity(row.original.total_weight_kg)} kg
          </span>
        ),
      },
      {
        id: 'total_amount',
        accessorFn: (inv) => inv.total_amount,
        header: MSG.COL_AMOUNT,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-bold">
            <MoneyText value={row.original.total_amount} />
          </span>
        ),
      },
      {
        id: 'paid_amount',
        accessorFn: (inv) => inv.paid_amount,
        header: MSG.COL_PAID,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span
            className={`font-medium ${row.original.paid_amount > 0 ? 'text-success' : 'text-muted'}`}
          >
            <MoneyText value={row.original.paid_amount} />
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (inv) => inv.status,
        header: MSG.COL_STATUS,
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.status)}>
            {WEAVING_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: MSG.COL_ACTIONS,
        meta: { align: 'right' },
        cell: ({ row }) => {
          const inv = row.original;
          return (
            <ActionBar
              actions={
                [
                  inv.status === 'draft'
                    ? {
                        icon: 'Pencil',
                        onClick: () => onEdit(inv),
                        title: MSG.BTN_EDIT,
                      }
                    : null,
                  inv.status === 'draft'
                    ? {
                        icon: 'CheckCircle',
                        onClick: () => onConfirm(inv),
                        title: MSG.BTN_CONFIRM,
                        disabled: isConfirming,
                      }
                    : null,
                  inv.status === 'draft'
                    ? {
                        icon: 'Trash2',
                        onClick: () => onDelete(inv),
                        title: MSG.BTN_DELETE,
                        variant: 'danger',
                        disabled: isDeleting,
                      }
                    : null,
                  inv.lookup_code
                    ? {
                        icon: 'ExternalLink',
                        onClick: () => {
                          window.open(`/tra-cuu/${inv.lookup_code}`, '_blank');
                        },
                        title: MSG.BTN_LOOKUP,
                      }
                    : null,
                ].filter(Boolean) as ActionConfig[]
              }
            />
          );
        },
      },
    ],
    [onEdit, onConfirm, onDelete, isConfirming, isDeleting],
  );
}
