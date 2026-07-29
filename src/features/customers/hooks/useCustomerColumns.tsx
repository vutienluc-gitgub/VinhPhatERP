import type { ColumnDef } from '@tanstack/react-table';

import {
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_SOURCE_ICONS,
  CUSTOMER_STATUS_LABELS,
  CRM_STATUS_LABELS,
  CRM_STATUS_ICONS,
  type LeadStatus,
} from '@/schema/customer.schema';
import {
  Icon,
  Badge,
  ActionMenu,
  type IconName,
  type BadgeVariant,
  PhoneContact,
} from '@/shared/components';
import { formatCurrencyFull } from '@/shared/utils/format';
import {
  DEPOSIT_FORM_LABELS,
  CUSTOMER_COLUMNS_LABELS,
} from '@/features/customers/customers.constants';
import type { Customer } from '@/features/customers/types';

export const SOURCE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  referral: 'success',
  exhibition: 'warning',
  zalo: 'info',
  facebook: 'info',
  online: 'info',
  direct: 'gray',
  cold_call: 'warning',
  other: 'gray',
};

export const CRM_STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  lead: 'info',
  opportunity: 'warning',
  customer: 'success',
  lost: 'danger',
};

type UseCustomerColumnsProps = {
  onEdit: (customer: Customer) => void;
  onCreateContract: (customer: Customer) => void;
  handleDelete: (customer: Customer) => void;
  isDeleting: boolean;
  isSale: boolean;
  onDeposit?: (customer: Customer) => void;
  onChat?: (customer: Customer) => void;
};

export function useCustomerColumns({
  onEdit,
  onCreateContract,
  handleDelete,
  isDeleting,
  isSale,
  onDeposit,
  onChat,
}: UseCustomerColumnsProps): ColumnDef<Customer>[] {
  return [
    {
      header: CUSTOMER_COLUMNS_LABELS.code,
      id: 'code',
      accessorKey: 'code',
      enableSorting: true,
      cell: (info) => (
        <span className="font-bold text-primary">{info.row.original.code}</span>
      ),
    },
    {
      header: CUSTOMER_COLUMNS_LABELS.nameAndAddress,
      id: 'name',
      accessorKey: 'name',
      enableSorting: true,
      cell: (info) => {
        const c = info.row.original;
        return (
          <div className="flex flex-col">
            <span className="font-bold">{c.name}</span>
            <span className="text-xs text-muted truncate max-w-[300px]">
              {c.address || '—'}
            </span>
          </div>
        );
      },
    },
    {
      header: CUSTOMER_COLUMNS_LABELS.contact,
      id: 'phone',
      accessorKey: 'phone',
      enableSorting: true,
      meta: { className: 'text-sm font-medium' },
      cell: (info) => {
        return <PhoneContact phone={info.row.original.phone} />;
      },
    },
    {
      header: DEPOSIT_FORM_LABELS.balanceColumnHeader,
      id: 'account_balance',
      accessorKey: 'account_balance',
      enableSorting: true,
      meta: { className: 'text-right font-bold text-success' },
      cell: (info) => formatCurrencyFull(info.row.original.account_balance),
    },
    {
      header: CUSTOMER_COLUMNS_LABELS.source,
      id: 'source',
      accessorKey: 'source',
      enableSorting: true,
      cell: (info) => {
        const sourceKey = info.row.original.source || 'other';
        return (
          <Badge
            variant={SOURCE_BADGE_VARIANT[sourceKey] ?? 'gray'}
            icon={CUSTOMER_SOURCE_ICONS[sourceKey] as IconName}
          >
            {CUSTOMER_SOURCE_LABELS[sourceKey]}
          </Badge>
        );
      },
    },
    {
      header: CUSTOMER_COLUMNS_LABELS.leadStatus,
      id: 'lead_status',
      accessorKey: 'lead_status',
      enableSorting: true,
      cell: (info) => {
        const leadStatus =
          (info.row.original.lead_status as LeadStatus) || 'lead';
        return (
          <Badge
            variant={CRM_STATUS_BADGE_VARIANTS[leadStatus] ?? 'gray'}
            icon={CRM_STATUS_ICONS[leadStatus] as IconName}
          >
            {CRM_STATUS_LABELS[leadStatus]}
          </Badge>
        );
      },
    },
    {
      header: CUSTOMER_COLUMNS_LABELS.status,
      id: 'status',
      accessorKey: 'status',
      enableSorting: true,
      cell: (info) => {
        const c = info.row.original;
        return (
          <Badge
            variant={c.status === 'active' ? 'success' : 'gray'}
            icon={c.status === 'active' ? 'CheckCircle2' : 'XCircle'}
          >
            {CUSTOMER_STATUS_LABELS[c.status]}
          </Badge>
        );
      },
    },
    {
      header: CUSTOMER_COLUMNS_LABELS.salesperson,
      id: 'salesperson',
      accessorKey: 'salesperson_id',
      enableSorting: false,
      cell: (info) => {
        const salesperson = info.row.original.salesperson;
        return salesperson ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Icon name="User" size={14} className="text-muted" />
            <span>{salesperson.name}</span>
          </div>
        ) : (
          <span className="text-muted text-sm">—</span>
        );
      },
    },
    {
      header: CUSTOMER_COLUMNS_LABELS.actions,
      id: 'actions',
      meta: { className: 'text-right' },
      cell: (info) => {
        const c = info.row.original;
        return (
          <ActionMenu
            items={[
              {
                icon: 'MessageSquare',
                onClick: () => onChat?.(c),
                label: CUSTOMER_COLUMNS_LABELS.actionMessage,
              },
              ...(!isSale
                ? [
                    {
                      icon: 'Wallet' as const,
                      onClick: () => {
                        if (onDeposit) onDeposit(c);
                      },
                      label: CUSTOMER_COLUMNS_LABELS.actionDeposit,
                    },
                  ]
                : []),
              {
                icon: 'FileText',
                onClick: () => onCreateContract(c),
                label: CUSTOMER_COLUMNS_LABELS.actionContract,
              },
              {
                icon: 'Pencil',
                onClick: () => onEdit(c),
                label: CUSTOMER_COLUMNS_LABELS.actionEdit,
              },
              ...(!isSale
                ? [
                    {
                      icon: 'Trash2' as const,
                      onClick: () => handleDelete(c),
                      label: CUSTOMER_COLUMNS_LABELS.actionDelete,
                      danger: true,
                      separated: true,
                      disabled: isDeleting,
                    },
                  ]
                : []),
            ]}
          />
        );
      },
    },
  ];
}
