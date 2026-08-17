import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_SOURCES,
  CUSTOMER_SOURCE_LABELS,
} from '@/schema/customer.schema';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  DataTableAdvanced,
  FilterBar,
  type FilterFieldConfig,
  type IconName,
  KpiCard,
  KpiGrid,
  TabSwitcher,
  type TabItem,
  AdaptiveSheet,
  VPSelect,
  VPEntityPicker,
  Button,
  PageHeader,
  PageActions,
  KPISection,
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
import type { Customer, CustomersFilter } from '@/domain/crm/customers.types';

import { useCustomerColumns } from './hooks/useCustomerColumns';
import { CustomerMobileCard } from './components/CustomerMobileCard';
import { CUSTOMER_LIST_LABELS } from './customers.constants';

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
      'source',
    ]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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

  const { data: result, isLoading } = useCustomerList(
    effectiveFilters,
    page,
    pageSize,
  );
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
    onFilterSource: (source) => handleFilterChange('source', source),
  });

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'query',
      type: 'search',
      label: CUSTOMER_LIST_LABELS.searchLabel,
      placeholder: CUSTOMER_LIST_LABELS.searchPlaceholder,
    },
    {
      key: 'status',
      type: 'combobox',
      label: CUSTOMER_LIST_LABELS.statusLabel,
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
            label: CUSTOMER_LIST_LABELS.salespersonLabel,
            options:
              salesEmployees?.map((emp) => ({
                value: emp.id,
                label: emp.name,
              })) ?? [],
          },
        ]
      : []),
    {
      key: 'source',
      type: 'combobox',
      label: 'Nguồn',
      options: CUSTOMER_SOURCES.map((source) => ({
        value: source,
        label: CUSTOMER_SOURCE_LABELS[source],
      })),
    },
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
      'source',
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
      label: CUSTOMER_LIST_LABELS.tabAll,
      icon: <Icon name="Users" size={16} />,
    },
    {
      key: 'mine',
      label: CUSTOMER_LIST_LABELS.tabMine,
      icon: <Icon name="User" size={16} />,
    },
    {
      key: 'new',
      label: CUSTOMER_LIST_LABELS.tabNew,
      icon: <Icon name="Star" size={16} />,
    },
  ];

  async function handleDelete(customer: Customer) {
    const ok = await confirm({
      message: CUSTOMER_LIST_LABELS.deleteConfirmMsg.replace(
        '{name}',
        customer.name,
      ),
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(customer.id);
  }

  const bulkActions: BulkActionConfig<Customer>[] = [
    ...(canSelectSalesperson
      ? [
          {
            label: CUSTOMER_LIST_LABELS.bulkAssignLabel,
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
      label: CUSTOMER_LIST_LABELS.bulkStatusLabel,
      icon: 'Activity' as IconName,
      onClick: (rows: Customer[]) => {
        setSelectedBulkCustomers(rows);
        setSelectedStatus('');
        setBulkStatusOpen(true);
      },
    },
    {
      label: CUSTOMER_LIST_LABELS.bulkEmailLabel,
      icon: 'Mail' as IconName,
      onClick: (rows: Customer[]) => {
        alert(
          CUSTOMER_LIST_LABELS.bulkEmailDevAlert.replace(
            '{count}',
            String(rows.length),
          ),
        );
      },
    },
  ];

  const hasFilter = hasActiveFilter;

  return (
    <>
      <PageHeader
        title={CUSTOMER_LIST_LABELS.title}
        subtitle={CUSTOMER_LIST_LABELS.subtitle}
        actions={
          <PageActions
            actions={[
              {
                id: 'create',
                label: CUSTOMER_LIST_LABELS.addCustomerBtn,
                icon: 'UserPlus',
                priority: 'primary',
                onClick: onNew,
              },
            ]}
          />
        }
      />

      {/* 📊 KPI Dashboard area */}
      <KPISection>
        <KpiGrid>
          <KpiCard
            label={CUSTOMER_LIST_LABELS.kpiTotal}
            value={result?.total ?? 0}
            icon="Users"
            variant="primary"
            footer={CUSTOMER_LIST_LABELS.kpiTotalDesc}
            isLoading={isLoading}
          />

          <KpiCard
            label={CUSTOMER_LIST_LABELS.kpiActive}
            value={result?.stats?.active ?? 0}
            icon="Activity"
            variant="success"
            footer={CUSTOMER_LIST_LABELS.kpiActiveDesc}
            isLoading={isLoading}
          />

          <KpiCard
            label={CUSTOMER_LIST_LABELS.kpiNew}
            value={`+${result?.stats?.new ?? 0}`}
            icon="UserPlus"
            variant="warning"
            footer={CUSTOMER_LIST_LABELS.kpiNewDesc}
            isLoading={isLoading}
          />
        </KpiGrid>
      </KPISection>

      {/* Tabs / Saved Views */}
      <div className="pb-2 min-w-0">
        <TabSwitcher
          tabs={tabs}
          active={activeTab === 'custom' ? 'all' : activeTab}
          onChange={handleTabChange}
          className="!border-b-0"
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
      <TableSection>
        <DataTableAdvanced
          data={customers}
          isLoading={isLoading}
          rowKey={(c) => c.id}
          onRowClick={onEdit}
          exportFileName={CUSTOMER_LIST_LABELS.exportFileName}
          bulkActions={bulkActions}
          emptyStateTitle={
            hasFilter
              ? CUSTOMER_LIST_LABELS.emptyFilterTitle
              : CUSTOMER_LIST_LABELS.emptyTitle
          }
          emptyStateDescription={
            hasFilter
              ? CUSTOMER_LIST_LABELS.emptyFilterDesc
              : CUSTOMER_LIST_LABELS.emptyDesc
          }
          emptyStateIcon={hasFilter ? 'Search' : 'Users'}
          emptyStateActionLabel={
            !hasFilter ? CUSTOMER_LIST_LABELS.emptyAddBtn : undefined
          }
          onEmptyStateAction={!hasFilter ? onNew : undefined}
          columns={columns}
          renderMobileCard={(customer) => (
            <CustomerMobileCard customer={customer} />
          )}
          pagination={{
            result,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1); // Reset to page 1 on page size change
            },
            itemLabel: CUSTOMER_LIST_LABELS.itemLabel,
          }}
        />
      </TableSection>

      {/* Bulk Action Dialogs */}
      <AdaptiveSheet
        open={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        title={CUSTOMER_LIST_LABELS.bulkAssignTitle}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>
              {CUSTOMER_LIST_LABELS.cancelBtn}
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
              {CUSTOMER_LIST_LABELS.bulkAssignSubmit}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            {CUSTOMER_LIST_LABELS.bulkAssignDesc.replace(
              '{count}',
              String(selectedBulkCustomers.length),
            )}
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {CUSTOMER_LIST_LABELS.bulkAssignFieldLabel}
            </label>
            <VPEntityPicker
              options={
                salesEmployees?.map((e) => ({ id: e.id, name: e.name })) || []
              }
              value={selectedSalesperson}
              onChange={setSelectedSalesperson}
              placeholder={CUSTOMER_LIST_LABELS.bulkAssignPlaceholder}
            />
          </div>
        </div>
      </AdaptiveSheet>

      <AdaptiveSheet
        open={bulkStatusOpen}
        onClose={() => setBulkStatusOpen(false)}
        title={CUSTOMER_LIST_LABELS.bulkStatusTitle}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBulkStatusOpen(false)}>
              {CUSTOMER_LIST_LABELS.cancelBtn}
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
              {CUSTOMER_LIST_LABELS.bulkStatusSubmit}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            {CUSTOMER_LIST_LABELS.bulkStatusDesc.replace(
              '{count}',
              String(selectedBulkCustomers.length),
            )}
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {CUSTOMER_LIST_LABELS.bulkStatusFieldLabel}
            </label>
            <VPSelect
              options={[
                { value: 'active', label: CUSTOMER_STATUS_LABELS.active },
                { value: 'inactive', label: CUSTOMER_STATUS_LABELS.inactive },
              ]}
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              placeholder={CUSTOMER_LIST_LABELS.bulkStatusPlaceholder}
            />
          </div>
        </div>
      </AdaptiveSheet>
    </>
  );
}
