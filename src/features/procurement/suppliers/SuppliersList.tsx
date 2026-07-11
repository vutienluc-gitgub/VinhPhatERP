import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { MoneyText } from '@/shared/value';
import {
  Icon,
  Badge,
  DataTableAdvanced,
  AddButton,
  ActionMenu,
  FilterBar,
  type FilterFieldConfig,
  KpiCard,
  KpiGrid,
  TabSwitcher,
  type TabItem,
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

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
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
                OTD: {supplier.on_time_rate ?? 0}%
              </span>
              <span className="text-xs text-muted">
                Đánh giá: {supplier.rating ?? 0}/5.0
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
              <MoneyText value={limit} />đ
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
                    disabled: deleteMutation.isPending,
                    separated: true,
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [onCreateContract, onEdit, handleDelete, deleteMutation.isPending],
  );

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton
          onClick={onNew}
          label={SUPPLIER_LIST_LABELS.ADD_BUTTON}
          icon="UserPlus"
        />
      </div>

      {/* 📊 KPI Dashboard area */}
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

      {error && (
        <div className="p-4">
          <p className="error-inline">
            {SUPPLIER_LIST_LABELS.ERROR_PREFIX}{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {/* Table & Cards */}
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
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{supplier.code}</span>
              <Badge
                variant={supplier.status === 'active' ? 'success' : 'gray'}
              >
                {SUPPLIER_STATUS_LABELS[supplier.status]}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <p className="font-bold text-lg">{supplier.name}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-muted">
                    <Icon name="Phone" size={16} />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.contact_person && (
                  <div className="flex items-center gap-2 text-muted">
                    <Icon name="User" size={16} />
                    <span>{supplier.contact_person}</span>
                  </div>
                )}
              </div>

              {supplier.address && (
                <div className="flex items-start gap-2 text-xs text-muted mt-1">
                  <Icon
                    name="MapPin"
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <span className="truncate">{supplier.address}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/10">
                <span className="text-[10px] uppercase font-bold text-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                  {supplier.category_name ?? supplier.category}
                </span>
                <Icon name="ChevronRight" size={16} className="text-muted" />
              </div>
            </div>
          </div>
        )}
        pagination={{
          result,
          onPageChange: setPage,
          itemLabel: SUPPLIER_LIST_LABELS.PAGINATION_ITEM,
        }}
      />
    </div>
  );
}
