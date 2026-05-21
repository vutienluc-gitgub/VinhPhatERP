import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

import {
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_SOURCE_ICONS,
  CUSTOMER_STATUS_LABELS,
  CRM_STATUS_LABELS,
  CRM_STATUS_ICONS,
  type LeadStatus,
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
  TabSwitcher,
  type TabItem,
  AdaptiveSheet,
  Combobox,
  Button,
} from '@/shared/components';
import type { BulkActionConfig } from '@/shared/components/DataTableAdvanced';
import {
  useCustomerList,
  useDeleteCustomer,
  useEmployees,
  useBulkUpdateCustomers,
} from '@/application/crm';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useCustomerVisibilityScope } from '@/shared/hooks';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatCurrencyFull, formatPhoneNumber } from '@/shared/utils/format';

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

const CRM_STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  lead: 'info',
  opportunity: 'warning',
  customer: 'success',
  lost: 'danger',
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
    useUrlFilterState([
      'query',
      'status',
      'salesperson_id',
      'created_from',
      'created_to',
    ]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const { profile } = useAuth();

  const { canSelectSalesperson, forcedSalespersonId, isSale } =
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
  const bulkUpdateMutation = useBulkUpdateCustomers();
  const { confirm } = useConfirm();

  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [selectedBulkCustomers, setSelectedBulkCustomers] = useState<
    Customer[]
  >([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

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

  function handleTabChange(key: string) {
    const next = new URLSearchParams(searchParams);
    const filterKeys = [
      'query',
      'status',
      'salesperson_id',
      'created_from',
      'created_to',
    ];
    filterKeys.forEach((k) => next.delete(k));

    if (key === 'mine' && profile?.employee_id) {
      next.set('salesperson_id', profile.employee_id);
    } else if (key === 'new') {
      next.set('created_from', dayjs().startOf('week').toISOString());
    }

    setSearchParams(next, { replace: true });
    setPage(1);
  }

  let activeTab = 'all';
  if (
    filters.salesperson_id === profile?.employee_id &&
    Object.keys(filters).length === 1
  ) {
    activeTab = 'mine';
  } else if (filters.created_from && Object.keys(filters).length === 1) {
    activeTab = 'new';
  } else if (Object.keys(filters).length === 0) {
    activeTab = 'all';
  } else {
    activeTab = 'custom';
  }

  const tabs: TabItem<string>[] = [
    {
      key: 'all',
      label: 'Tất cả khách hàng',
      icon: <Icon name="Users" size={16} />,
    },
    {
      key: 'mine',
      label: 'Khách của tôi',
      icon: <Icon name="User" size={16} />,
    },
    {
      key: 'new',
      label: 'Khách mới tuần này',
      icon: <Icon name="Star" size={16} />,
    },
  ];

  async function handleDelete(customer: Customer) {
    const ok = await confirm({
      message: `Xóa khách hàng "${customer.name}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(customer.id);
  }

  const bulkActions: BulkActionConfig<Customer>[] = [
    ...(canSelectSalesperson
      ? [
          {
            label: 'Đổi người phụ trách',
            icon: 'UserPlus' as IconName,
            onClick: (rows: Customer[]) => {
              setSelectedBulkCustomers(rows);
              setSelectedSalesperson('');
              setBulkAssignOpen(true);
            },
          },
        ]
      : []),
    {
      label: 'Cập nhật trạng thái',
      icon: 'Activity' as IconName,
      onClick: (rows: Customer[]) => {
        setSelectedBulkCustomers(rows);
        setSelectedStatus('');
        setBulkStatusOpen(true);
      },
    },
    {
      label: 'Gửi SMS/Email',
      icon: 'Mail' as IconName,
      onClick: (rows: Customer[]) => {
        alert(
          `Tính năng gửi SMS/Email cho ${rows.length} khách hàng đang được phát triển.`,
        );
      },
    },
  ];

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

      {/* Tabs / Saved Views */}
      <div className="px-4 pt-2">
        <TabSwitcher
          tabs={tabs}
          active={activeTab === 'custom' ? 'all' : activeTab}
          onChange={handleTabChange}
          variant="pill"
        />
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
        exportFileName="DanhSachKhachHang"
        bulkActions={bulkActions}
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
                            disabled: deleteMutation.isPending,
                          },
                        ]
                      : []),
                  ]}
                />
              );
            },
          },
        ]}
        renderMobileCard={(customer) => {
          const leadStatus = (customer.lead_status as LeadStatus) || 'lead';
          return (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <span className="mobile-card-title">{customer.code}</span>
                <Badge
                  variant={customer.status === 'active' ? 'success' : 'gray'}
                  icon={
                    customer.status === 'active' ? 'CheckCircle2' : 'XCircle'
                  }
                >
                  {CUSTOMER_STATUS_LABELS[customer.status]}
                </Badge>
              </div>
              <div className="mobile-card-body">
                <p className="font-bold text-lg">{customer.name}</p>
                <div className="mobile-card-row">
                  <span className="label">Liên hệ:</span>
                  <span className="value flex items-center gap-2">
                    {(() => {
                      if (!customer.phone) return '—';
                      const cleanPhone = customer.phone.replace(/\D/g, '');
                      const isVietnamZalo =
                        cleanPhone.startsWith('0') && cleanPhone.length === 10;
                      return (
                        <>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="hover:text-primary hover:underline font-semibold"
                          >
                            {formatPhoneNumber(customer.phone)}
                          </a>
                          {isVietnamZalo && (
                            <a
                              href={`https://zalo.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0068FF] bg-[#0068FF]/10 rounded-full w-5 h-5 flex items-center justify-center"
                            >
                              <Icon name="MessageCircle" size={12} />
                            </a>
                          )}
                        </>
                      );
                    })()}
                  </span>
                </div>
                {customer.address && (
                  <div className="mobile-card-row">
                    <span className="label">Địa chỉ:</span>
                    <span className="value truncate ml-4 italic">
                      {customer.address}
                    </span>
                  </div>
                )}
                <div className="mobile-card-row">
                  <span className="label">Phễu CRM:</span>
                  <span className="value">
                    <Badge
                      variant={CRM_STATUS_BADGE_VARIANTS[leadStatus] ?? 'gray'}
                      icon={CRM_STATUS_ICONS[leadStatus] as IconName}
                      iconSize={12}
                    >
                      {CRM_STATUS_LABELS[leadStatus]}
                    </Badge>
                  </span>
                </div>
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
          );
        }}
        pagination={{
          result,
          onPageChange: setPage,
          itemLabel: 'khách hàng',
        }}
      />

      {/* Bulk Action Dialogs */}
      <AdaptiveSheet
        open={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        title="Đổi người phụ trách"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!selectedSalesperson || bulkUpdateMutation.isPending}
              isLoading={bulkUpdateMutation.isPending}
              onClick={() => {
                bulkUpdateMutation.mutate(
                  {
                    ids: selectedBulkCustomers.map((c) => c.id),
                    values: { salesperson_id: selectedSalesperson },
                  },
                  {
                    onSuccess: () => {
                      setBulkAssignOpen(false);
                    },
                  },
                );
              }}
            >
              Xác nhận
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted">
            Bạn đang chọn {selectedBulkCustomers.length} khách hàng để chuyển
            người phụ trách.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Nhân viên phụ trách mới
            </label>
            <Combobox
              options={
                salesEmployees?.map((e) => ({ value: e.id, label: e.name })) ||
                []
              }
              value={selectedSalesperson}
              onChange={setSelectedSalesperson}
              placeholder="Chọn nhân viên..."
            />
          </div>
        </div>
      </AdaptiveSheet>

      <AdaptiveSheet
        open={bulkStatusOpen}
        onClose={() => setBulkStatusOpen(false)}
        title="Cập nhật trạng thái"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBulkStatusOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!selectedStatus || bulkUpdateMutation.isPending}
              isLoading={bulkUpdateMutation.isPending}
              onClick={() => {
                bulkUpdateMutation.mutate(
                  {
                    ids: selectedBulkCustomers.map((c) => c.id),
                    values: { status: selectedStatus as 'active' | 'inactive' },
                  },
                  {
                    onSuccess: () => {
                      setBulkStatusOpen(false);
                    },
                  },
                );
              }}
            >
              Cập nhật
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted">
            Bạn đang chọn {selectedBulkCustomers.length} khách hàng để cập nhật
            trạng thái CRM.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Trạng thái mới
            </label>
            <Combobox
              options={[
                { value: 'active', label: CUSTOMER_STATUS_LABELS.active },
                { value: 'inactive', label: CUSTOMER_STATUS_LABELS.inactive },
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Chọn trạng thái..."
            />
          </div>
        </div>
      </AdaptiveSheet>
    </div>
  );
}
