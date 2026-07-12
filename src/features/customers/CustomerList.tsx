import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { CUSTOMER_STATUS_LABELS } from '@/schema/customer.schema';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  DataTableAdvanced,
  AddButton,
  FilterBar,
  type FilterFieldConfig,
  type IconName,
  KpiCard,
  KpiGrid,
  TabSwitcher,
  type TabItem,
  AdaptiveSheet,
  Combobox,
  Button,
  PageLayout,
  PageHeader,
  KPISection,
  FilterSection,
  TableSection,
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

import { useCustomerColumns } from './hooks/useCustomerColumns';
import { CustomerMobileCard } from './components/CustomerMobileCard';
import type { Customer, CustomersFilter } from './types';

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

  const columns = useCustomerColumns({
    onEdit,
    onCreateContract,
    handleDelete,
    isDeleting: deleteMutation.isPending,
    isSale,
    onDeposit,
    onChat,
  });

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
    <PageLayout>
      <PageHeader
        title="Danh sách khách hàng"
        subtitle="Quản lý thông tin khách hàng"
        actions={
          <AddButton onClick={onNew} label="Thêm khách hàng" icon="UserPlus" />
        }
      />

      {/* 📊 KPI Dashboard area */}
      <KPISection>
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
      </KPISection>

      <FilterSection>
        {/* Tabs / Saved Views */}
        <div className="pb-2">
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
      </FilterSection>

      {/* 📑 Data Section */}
      <TableSection>
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
          columns={columns}
          renderMobileCard={(customer) => (
            <CustomerMobileCard customer={customer} />
          )}
          pagination={{
            result,
            onPageChange: setPage,
            itemLabel: 'khách hàng',
          }}
        />
      </TableSection>

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
    </PageLayout>
  );
}
