import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  DataTableAdvanced,
  AddButton,
  FilterBar,
  type FilterFieldConfig,
  KpiCard,
  KpiGrid,
  TabSwitcher,
  type TabItem,
  PageLayout,
  PageHeader,
  KPISection,
  FilterSection,
  TableSection,
} from '@/shared/components';
import {
  useDeleteSupplier,
  useSuppliersList,
  useSupplierCategories,
  useSupplierStats,
} from '@/application/crm';
import {
  SUPPLIER_STATUSES,
  SUPPLIER_STATUS_LABELS,
} from '@/schema/supplier.schema';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';

import { useSupplierColumns } from './hooks/useSupplierColumns';
import { SupplierMobileCard } from './components/SupplierMobileCard';
import { SUPPLIER_LIST_LABELS } from './suppliers.constants';
import type { Supplier, SupplierFilter } from './types';

type SuppliersListProps = {
  onEdit: (supplier: Supplier) => void;
  onNew: () => void;
  onCreateContract: (supplier: Supplier) => void;
};

export function SuppliersList({
  onEdit,
  onNew,
  onCreateContract,
}: SuppliersListProps) {
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(
      ['search', 'category', 'status'] as const,
      { status: 'active' }, // Default: chỉ hiện NCC đang giao dịch
    );
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const {
    data: result,
    isLoading,
    error,
  } = useSuppliersList(filters as SupplierFilter, page);
  const suppliers = result?.data ?? [];
  const { data: categories = [] } = useSupplierCategories();
  const { data: stats } = useSupplierStats();
  const deleteMutation = useDeleteSupplier();
  const { confirm } = useConfirm();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: SUPPLIER_LIST_LABELS.FILTER_SEARCH,
      placeholder: SUPPLIER_LIST_LABELS.SEARCH_PLACEHOLDER,
    },
    {
      key: 'category',
      type: 'combobox',
      label: SUPPLIER_LIST_LABELS.FILTER_CATEGORY,
      options: categories.map((cat) => ({
        value: cat.code,
        label: cat.name,
      })),
    },
    {
      key: 'status',
      type: 'combobox',
      label: SUPPLIER_LIST_LABELS.FILTER_STATUS,
      options: SUPPLIER_STATUSES.map((st) => ({
        value: st,
        label: SUPPLIER_STATUS_LABELS[st],
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  function handleTabChange(key: string) {
    const next = new URLSearchParams(searchParams);
    const filterKeys = ['search', 'category', 'status'];
    filterKeys.forEach((k) => next.delete(k));

    if (key === 'active') {
      next.set('status', 'active');
    } else if (key === 'all') {
      next.set('status', ''); // Set empty to override default 'active'
    }

    setSearchParams(next, { replace: true });
    setPage(1);
  }

  let activeTab = 'all';
  if (filters.status === 'active' && Object.keys(filters).length === 1) {
    activeTab = 'active';
  } else if (filters.status === '' && Object.keys(filters).length === 1) {
    activeTab = 'all';
  } else {
    activeTab = 'custom';
  }

  const tabs: TabItem<string>[] = [
    {
      key: 'all',
      label: SUPPLIER_LIST_LABELS.TAB_ALL,
      icon: <Icon name="Truck" size={16} />,
    },
    {
      key: 'active',
      label: SUPPLIER_LIST_LABELS.TAB_ACTIVE,
      icon: <Icon name="CheckCircle2" size={16} />,
    },
  ];

  const hasFilter = hasActiveFilter;

  const handleDelete = useCallback(
    async (supplier: Supplier) => {
      const ok = await confirm({
        message: `${SUPPLIER_LIST_LABELS.CONFIRM_DELETE_PREFIX} "${supplier.name}"? ${SUPPLIER_LIST_LABELS.CONFIRM_DELETE_SUFFIX}`,
        variant: 'danger',
      });
      if (!ok) return;
      try {
        await deleteMutation.mutateAsync(supplier.id);
      } catch (err) {
        console.error('[SupplierDeleteError]', err);
      }
    },
    [confirm, deleteMutation],
  );

  const columns = useSupplierColumns({
    onEdit,
    onCreateContract,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  });

  return (
    <PageLayout>
      <PageHeader
        title="Nhà cung cấp"
        subtitle="Quản lý nhà cung cấp"
        actions={
          <AddButton
            onClick={onNew}
            label={SUPPLIER_LIST_LABELS.ADD_BUTTON}
            icon="UserPlus"
          />
        }
      />

      {/* 📊 KPI Dashboard area */}
      <KPISection>
        <KpiGrid>
          <KpiCard
            label={SUPPLIER_LIST_LABELS.KPI_TOTAL}
            value={stats?.total ?? result?.total ?? 0}
            icon="Truck"
            variant="primary"
            footer={SUPPLIER_LIST_LABELS.KPI_TOTAL_DESC}
          />

          <KpiCard
            label={SUPPLIER_LIST_LABELS.KPI_ACTIVE}
            value={stats?.active ?? 0}
            icon="CheckCircle"
            variant="success"
            footer={SUPPLIER_LIST_LABELS.KPI_ACTIVE_DESC}
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

      {error && (
        <div className="p-4">
          <p className="error-inline">
            {SUPPLIER_LIST_LABELS.ERROR_PREFIX}{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <TableSection>
        <DataTableAdvanced
          data={suppliers}
          isLoading={isLoading}
          rowKey={(s) => s.id}
          onRowClick={onEdit}
          emptyStateTitle={
            hasFilter
              ? SUPPLIER_LIST_LABELS.EMPTY_STATE_TITLE_SEARCH
              : SUPPLIER_LIST_LABELS.EMPTY_STATE_TITLE_NO_DATA
          }
          emptyStateDescription={
            hasFilter
              ? SUPPLIER_LIST_LABELS.EMPTY_STATE_DESC_SEARCH
              : SUPPLIER_LIST_LABELS.EMPTY_STATE_DESC_NO_DATA
          }
          emptyStateIcon={hasFilter ? 'Search' : 'Truck'}
          emptyStateActionLabel={
            !hasFilter ? SUPPLIER_LIST_LABELS.EMPTY_STATE_ADD : undefined
          }
          onEmptyStateAction={!hasFilter ? onNew : undefined}
          columns={columns}
          exportFileName="danh_sach_ncc"
          renderMobileCard={(supplier) => (
            <SupplierMobileCard supplier={supplier} />
          )}
          pagination={{
            result,
            onPageChange: setPage,
            itemLabel: SUPPLIER_LIST_LABELS.PAGINATION_ITEM,
          }}
        />
      </TableSection>
    </PageLayout>
  );
}
