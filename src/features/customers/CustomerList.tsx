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
  ActionBar,
  FilterBar,
  type FilterFieldConfig,
  type IconName,
  type BadgeVariant,
} from '@/shared/components';
import { useCustomerList, useDeleteCustomer } from '@/application/crm';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
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
};

export function CustomerList({
  onEdit,
  onNew,
  onCreateContract,
  onDeposit,
}: CustomerListProps) {
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'query',
    'status',
  ]);
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useCustomerList(
    filters as CustomersFilter,
    page,
  );
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
          label: 'Hoat dong',
        },
        {
          value: 'inactive',
          label: 'Ngung hoat dong',
        },
      ],
    },
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

  const hasFilter = !!(filters.query || filters.status);

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton onClick={onNew} label="Thêm khách hàng" icon="UserPlus" />
      </div>

      {/* 📊 KPI Dashboard area */}
      <div className="kpi-section kpi-grid">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng khách hàng</p>
              <p className="kpi-value">{result?.total ?? 0}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Users" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Cơ sở dữ liệu khách hàng
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang hoạt động</p>
              <p className="kpi-value">
                {customers.filter((c) => c.status === 'active').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Activity" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Khách hàng có giao dịch
          </div>
        </div>

        <div className="kpi-card-premium kpi-warning">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Khách hàng mới</p>
              <p className="kpi-value">+{customers.length}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Star" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Da them trong ky
          </div>
        </div>
      </div>

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
            header: 'Thao tác',
            id: 'actions',
            meta: { className: 'text-right' },
            cell: (info) => {
              const c = info.row.original;
              return (
                <ActionBar
                  actions={[
                    {
                      icon: 'Wallet',
                      onClick: () => onDeposit?.(c),
                      title: 'Nạp tiền',
                    },
                    {
                      icon: 'FileText',
                      onClick: () => onCreateContract(c),
                      title: 'Tạo hợp đồng',
                    },
                    {
                      icon: 'Pencil',
                      onClick: () => onEdit(c),
                      title: 'Sửa',
                    },
                    {
                      icon: 'Trash2',
                      onClick: () => handleDelete(c),
                      title: 'Xóa',
                      variant: 'danger',
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
