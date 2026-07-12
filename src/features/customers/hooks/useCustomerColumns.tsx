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
} from '@/shared/components';
import { formatCurrencyFull, formatPhoneNumber } from '@/shared/utils/format';
import { DEPOSIT_FORM_LABELS } from '@/features/customers/customers.constants';
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
      header: 'Mã KH',
      id: 'code',
      accessorKey: 'code',
      enableSorting: true,
      cell: (info) => (
        <span className="font-bold text-primary">{info.row.original.code}</span>
      ),
    },
    {
      header: 'Tên & Địa chỉ',
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
      header: 'Liên hệ',
      id: 'phone',
      accessorKey: 'phone',
      enableSorting: true,
      meta: { className: 'text-sm font-medium' },
      cell: (info) => {
        const phone = info.row.original.phone;
        if (!phone) return <span className="text-muted">—</span>;

        const cleanPhone = phone.replace(/\D/g, '');
        const isVietnamZalo =
          cleanPhone.startsWith('0') && cleanPhone.length === 10;

        return (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="hover:text-primary hover:underline transition-colors font-semibold"
              title="Gọi điện thoại"
            >
              {formatPhoneNumber(phone)}
            </a>
            {isVietnamZalo && (
              <a
                href={`https://zalo.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0068FF] hover:opacity-80 transition-opacity flex items-center justify-center bg-[#0068FF]/10 rounded-full w-5 h-5"
                title="Nhắn tin Zalo"
              >
                <Icon name="MessageCircle" size={12} />
              </a>
            )}
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
      header: 'Nguồn',
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
      header: 'Phễu CRM',
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
      header: 'Trạng thái',
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
      header: 'Phụ trách',
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
      header: 'Thao tác',
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
                label: 'Nhắn tin',
              },
              ...(!isSale
                ? [
                    {
                      icon: 'Wallet' as const,
                      onClick: () => {
                        if (onDeposit) onDeposit(c);
                      },
                      label: 'Nạp tiền',
                    },
                  ]
                : []),
              {
                icon: 'FileText',
                onClick: () => onCreateContract(c),
                label: 'Tạo hợp đồng',
              },
              {
                icon: 'Pencil',
                onClick: () => onEdit(c),
                label: 'Chỉnh sửa',
              },
              ...(!isSale
                ? [
                    {
                      icon: 'Trash2' as const,
                      onClick: () => handleDelete(c),
                      label: 'Xóa khách hàng',
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
