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
import type { Customer } from '@/domain/crm/customers.types';

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
  onFilterSource?: (source: string) => void;
};

export function useCustomerColumns({
  onEdit,
  onCreateContract,
  handleDelete,
  isDeleting,
  isSale,
  onDeposit,
  onChat,
  onFilterSource,
}: UseCustomerColumnsProps): ColumnDef<Customer>[] {
  return [
    {
      header: CUSTOMER_COLUMNS_LABELS.code,
      id: 'code',
      accessorKey: 'code',
      enableSorting: true,
      cell: (info) => (
        <span className="font-bold text-foreground">
          {info.row.original.code}
        </span>
      ),
    },
    {
      header: CUSTOMER_COLUMNS_LABELS.nameAndAddress,
      id: 'name',
      accessorKey: 'name',
      enableSorting: true,
      cell: (info) => {
        const customer = info.row.original;
        return (
          <div className="flex flex-col">
            <span className="font-bold">{customer.name}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
              {customer.address || '—'}
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
        const customer = info.row.original;
        return (
          <div className="flex flex-col gap-1">
            <PhoneContact phone={customer.phone} />
            {customer.contact_person ? (
              <div className="flex items-center gap-1.5">
                <Icon
                  name="User"
                  className="w-3.5 h-3.5 text-muted-foreground"
                />
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {customer.contact_person}
                </span>
              </div>
            ) : null}
          </div>
        );
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
          <button
            type="button"
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md inline-block cursor-pointer hover:scale-105 transition-transform"
            title="Nhấn để lọc các khách hàng từ nguồn này"
            onClick={(e) => {
              e.stopPropagation();
              onFilterSource?.(sourceKey);
            }}
          >
            <Badge
              variant={SOURCE_BADGE_VARIANT[sourceKey] ?? 'gray'}
              icon={CUSTOMER_SOURCE_ICONS[sourceKey] as IconName}
            >
              {CUSTOMER_SOURCE_LABELS[sourceKey]}
            </Badge>
          </button>
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
        const customer = info.row.original;
        return (
          <Badge
            variant={customer.status === 'active' ? 'success' : 'gray'}
            icon={customer.status === 'active' ? 'CheckCircle2' : 'XCircle'}
          >
            {CUSTOMER_STATUS_LABELS[customer.status]}
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
            <Icon name="User" size={14} className="text-muted-foreground" />
            <span>{salesperson.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      header: CUSTOMER_COLUMNS_LABELS.actions,
      id: 'actions',
      meta: { className: 'text-right' },
      cell: (info) => {
        const customer = info.row.original;
        return (
          <ActionMenu
            items={[
              {
                icon: 'MessageSquare',
                onClick: () => onChat?.(customer),
                label: CUSTOMER_COLUMNS_LABELS.actionMessage,
              },
              ...(!isSale
                ? [
                    {
                      icon: 'Wallet' as const,
                      onClick: () => {
                        if (onDeposit) onDeposit(customer);
                      },
                      label: CUSTOMER_COLUMNS_LABELS.actionDeposit,
                    },
                  ]
                : []),
              {
                icon: 'FileText',
                onClick: () => onCreateContract(customer),
                label: CUSTOMER_COLUMNS_LABELS.actionContract,
              },
              {
                icon: 'Pencil',
                onClick: () => onEdit(customer),
                label: CUSTOMER_COLUMNS_LABELS.actionEdit,
              },
              ...(!isSale
                ? [
                    {
                      icon: 'Trash2' as const,
                      onClick: () => handleDelete(customer),
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
