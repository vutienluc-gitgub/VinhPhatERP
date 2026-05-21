import { useState } from 'react';

import {
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_SOURCE_ICONS,
  CUSTOMER_STATUS_LABELS,
} from '@/schema/customer.schema';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  DataTableAdvanced,
  AddButton,
  ActionMenu,
  FilterBar,
  type FilterFieldConfig,
  type IconName,
  type BadgeVariant,
  KpiCard,
  KpiGrid,
} from '@/shared/components';
import {
  useCustomerList,
  useDeleteCustomer,
  useEmployees,
} from '@/application/crm';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useCustomerVisibilityScope } from '@/shared/hooks';
import { formatCurrencyFull } from '@/shared/utils/format';

import { DEPOSIT_FORM_LABELS } from './customers.constants';
import type { Customer, CustomersFilter } from './types';

const SOURCE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  referral: 'success',
  exhibition: 'warning',
  zalo: 'info',
  facebook: 'info',
  online: 'info',
  direct: 'gray',
  cold_call: 'warning',
  other: 'gray',
};

type CustomerListProps = {
  onEdit: (customer: Customer) => void;
  onNew: () => void;
  onCreateContract: (customer: Customer) => void;
  onDeposit?: (customer: Customer) => void;
  onChat?: (customer: Customer) => void;
};

export function CustomerList({
  onEdit,
  onNew,
  onCreateContract,
  onDeposit,
  onChat,
}: CustomerListProps) {
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(['query', 'status', 'salesperson_id']);
  const [page, setPage] = useState(1);

  const { canSelectSalesperson, forcedSalespersonId } =
    useCustomerVisibilityScope();

  const { data: salesEmployees } = useEmployees({
    role: 'sales',
    status: 'active',
  });

  const effectiveFilters = {
    ...filters,
    salesperson_id: forcedSalespersonId || filters.salesperson_id,
  } as CustomersFilter;

  const { data: result, isLoading } = useCustomerList(effectiveFilters, page);
  const customers = result?.data ?? [];
  const deleteMutation = useDeleteCustomer();
  const { confirm } = useConfirm();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'query',
      type: 'search',
      label: 'Tìm kiếm khách hàng',
      placeholder: 'Tìm theo tên, mã KH, sđt...',
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Trạng thái',
      options: [
        {
          value: 'active',
          label: CUSTOMER_STATUS_LABELS.active,
        },
        {
          value: 'inactive',
          label: CUSTOMER_STATUS_LABELS.inactive,
        },
      ],
    },
    ...(canSelectSalesperson
      ? [
          {
            key: 'salesperson_id',
            type: 'combobox' as const,
            label: 'Phụ trách',
            options:
              salesEmployees?.map((emp) => ({
                value: emp.id,
                label: emp.name,
              })) ?? [],
          },
        ]
      : []),
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  async function handleDelete(customer: Customer) {
    const ok = await confirm({
      message: `Xóa khách hàng "${customer.name}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(customer.id);
  }

  const hasFilter = hasActiveFilter;

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton onClick={onNew} label="Thêm khách hàng" icon="UserPlus" />
      </div>

      {/* 📊 KPI Dashboard area */}
      <KpiGrid>
        <KpiCard
          label="Tổng khách hàng"
          value={result?.total ?? 0}
          icon="Users"
          variant="primary"
          footer="Cơ sở dữ liệu khách hàng"
        />

        <KpiCard
          label="Đang hoạt động"
          value={customers.filter((c) => c.status === 'active').length}
          icon="Activity"
          variant="success"
          footer="Khách hàng có giao dịch"
        />

        <KpiCard
          label="Khách hàng mới"
          value={`+${customers.length}`}
          icon="Star"
          variant="warning"
          footer="Đã thêm trong kỳ"
        />
      </KpiGrid>

      {/* Filter Area (Config-Driven) */}
      <FilterBar
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          clearFilters();
          setPage(1);
        }}
      />

      {/* 📑 Data Section */}
      <DataTableAdvanced
        data={customers}
        isLoading={isLoading}
        rowKey={(c) => c.id}
        onRowClick={onEdit}
        emptyStateTitle={
          hasFilter
            ? 'Không tìm thấy khách hàng'
            : 'Chưa có thông tin khách hàng'
        }
        emptyStateDescription={
          hasFilter
            ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
            : 'Hãy thêm khách hàng mới để quản lý thông tin.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Users'}
        emptyStateActionLabel={!hasFilter ? '+ Thêm khách hàng' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Mã KH',
            id: 'code',
            accessorKey: 'code',
            enableSorting: true,
            cell: (info) => (
              <span className="font-bold text-primary">
                {info.row.original.code}
              </span>
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
            cell: (info) => info.row.original.phone ?? '—',
          },
          {
            header: DEPOSIT_FORM_LABELS.balanceColumnHeader,
            id: 'account_balance',
            accessorKey: 'account_balance',
            enableSorting: true,
            meta: { className: 'text-right font-bold text-success' },
            cell: (info) =>
              formatCurrencyFull(info.row.original.account_balance),
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
                    {
                      icon: 'Wallet',
                      onClick: () => {
                        if (onDeposit) onDeposit(c);
                      },
                      label: 'Nạp tiền',
                    },
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
                    {
                      icon: 'Trash2',
                      onClick: () => handleDelete(c),
                      label: 'Xóa khách hàng',
                      danger: true,
                      separated: true,
                      disabled: deleteMutation.isPending,
                    },
                  ]}
                />
              );
            },
          },
        ]}
        renderMobileCard={(customer) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{customer.code}</span>
              <Badge
                variant={customer.status === 'active' ? 'success' : 'gray'}
                icon={customer.status === 'active' ? 'CheckCircle2' : 'XCircle'}
              >
                {CUSTOMER_STATUS_LABELS[customer.status]}
              </Badge>
            </div>
            <div className="mobile-card-body">
              <p className="font-bold text-lg">{customer.name}</p>
              <div className="mobile-card-row">
                <span className="label">Liên hệ:</span>
                <span className="value">{customer.phone || '—'}</span>
              </div>
              {customer.address && (
                <div className="mobile-card-row">
                  <span className="label">Địa chỉ:</span>
                  <span className="value truncate ml-4 italic">
                    {customer.address}
                  </span>
                </div>
              )}
              {customer.salesperson && (
                <div className="mobile-card-row">
                  <span className="label">Phụ trách:</span>
                  <span className="value flex items-center gap-1">
                    <Icon name="User" size={12} className="text-muted" />
                    {customer.salesperson.name}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/10">
                <Badge
                  variant={
                    SOURCE_BADGE_VARIANT[customer.source || 'other'] ?? 'gray'
                  }
                  icon={
                    CUSTOMER_SOURCE_ICONS[
                      customer.source || 'other'
                    ] as IconName
                  }
                  iconSize={12}
                >
                  {CUSTOMER_SOURCE_LABELS[customer.source || 'other']}
                </Badge>
                <Icon name="ChevronRight" size={16} className="text-muted" />
              </div>
            </div>
          </div>
        )}
        pagination={{
          result,
          onPageChange: setPage,
          itemLabel: 'khách hàng',
        }}
      />
    </div>
  );
}
