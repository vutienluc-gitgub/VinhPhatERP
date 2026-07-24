import type { ColumnDef } from '@tanstack/react-table';

import { MoneyText } from '@/shared/value';
import { Badge, ActionMenu } from '@/shared/components';
import { SUPPLIER_STATUS_LABELS } from '@/schema/supplier.schema';
import { SUPPLIER_LIST_LABELS } from '@/features/procurement/suppliers/suppliers.constants';
import type { Supplier } from '@/features/procurement/suppliers/types';

type UseSupplierColumnsProps = {
  onEdit: (supplier: Supplier) => void;
  onCreateContract: (supplier: Supplier) => void;
  handleDelete: (supplier: Supplier) => Promise<void>;
  isDeleting: boolean;
};

export function useSupplierColumns({
  onEdit,
  onCreateContract,
  handleDelete,
  isDeleting,
}: UseSupplierColumnsProps): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: 'code',
      header: SUPPLIER_LIST_LABELS.COL_CODE,
      cell: ({ row }) => (
        <span className="font-bold text-primary">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: SUPPLIER_LIST_LABELS.COL_NAME,
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-bold">{supplier.name}</span>
            {supplier.address && (
              <span className="text-xs text-muted truncate max-w-[250px]">
                {supplier.address}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'category_name',
      header: SUPPLIER_LIST_LABELS.COL_CATEGORY,
      cell: ({ row }) => (
        <span className="badge-outline">
          {row.original.category_name ?? row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: SUPPLIER_LIST_LABELS.COL_PHONE,
      meta: { className: 'text-muted text-sm' },
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex flex-col text-sm">
            {supplier.phone && <span>{supplier.phone}</span>}
            {supplier.contact_person && (
              <span className="text-xs">
                {SUPPLIER_LIST_LABELS.CONTACT_PERSON_PREFIX}{' '}
                {supplier.contact_person}
              </span>
            )}
            {!supplier.phone &&
              !supplier.contact_person &&
              SUPPLIER_LIST_LABELS.NOT_AVAILABLE}
          </div>
        );
      },
    },
    {
      accessorKey: 'performance',
      header: SUPPLIER_LIST_LABELS.COL_PERFORMANCE,
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-emerald-600">
              {SUPPLIER_LIST_LABELS.LBL_OTD} {supplier.on_time_rate ?? 0}%
            </span>
            <span className="text-xs text-muted">
              {SUPPLIER_LIST_LABELS.LBL_RATING} {supplier.rating ?? 0}/5.0
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'credit_limit',
      header: SUPPLIER_LIST_LABELS.COL_LIMIT,
      cell: ({ row }) => {
        const limit = row.original.credit_limit;
        if (!limit || limit === 0)
          return (
            <span className="text-muted">
              {SUPPLIER_LIST_LABELS.NOT_AVAILABLE}
            </span>
          );
        // We can format it roughly
        return (
          <span className="font-semibold text-primary">
            <MoneyText value={limit} />
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: SUPPLIER_LIST_LABELS.COL_STATUS,
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <Badge variant={supplier.status === 'active' ? 'success' : 'gray'}>
            {SUPPLIER_STATUS_LABELS[supplier.status]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: () => (
        <div className="text-right">{SUPPLIER_LIST_LABELS.COL_ACTIONS}</div>
      ),
      meta: { className: 'text-right' },
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex justify-end">
            <ActionMenu
              items={[
                {
                  icon: 'FileText',
                  onClick: () => onCreateContract(supplier),
                  label: SUPPLIER_LIST_LABELS.ACTION_CREATE_CONTRACT,
                },
                {
                  icon: 'Pencil',
                  onClick: () => onEdit(supplier),
                  label: SUPPLIER_LIST_LABELS.ACTION_EDIT,
                },
                {
                  icon: 'Trash2',
                  onClick: () => handleDelete(supplier),
                  label: SUPPLIER_LIST_LABELS.ACTION_DELETE,
                  danger: true,
                  disabled: isDeleting,
                  separated: true,
                },
              ]}
            />
          </div>
        );
      },
    },
  ];
}
