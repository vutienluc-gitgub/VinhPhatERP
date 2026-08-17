import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTableAdvanced,
  FilterBar,
  type FilterFieldConfig,
  PageHeader,
  PageActions,
  KPISection,
  TableSection,
  KpiCard,
  KpiGrid,
} from '@/shared/components';
import { useDeleteOrder, useOrderList } from '@/application/orders';
import { ORDER_STATUS_LABELS, ORDER_TYPE_OPTIONS } from '@/schema/order.schema';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useAuth } from '@/shared/hooks/useAuth';
import type { Order, OrdersFilter } from '@/domain/orders/types';

import { calculateOrderKPIs } from './utils';
import { useOrderColumns } from './hooks/useOrderColumns';
import { OrderMobileCard } from './components/OrderMobileCard';
import {
  ORDERS_DASHBOARD_LABELS,
  ORDERS_FORM_LABELS,
  ORDERS_LIST_LABELS,
  ORDERS_PROG_LABELS,
} from './orders.constants';

const filterSchema: FilterFieldConfig[] = [
  {
    key: 'search',
    type: 'search',
    label: ORDERS_LIST_LABELS.SEARCH_LABEL,
    placeholder: ORDERS_LIST_LABELS.SEARCH_PLACEHOLDER,
  },
  {
    key: 'status',
    type: 'combobox',
    label: ORDERS_PROG_LABELS.PROG_FILTER_STATUS,
    options: Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'orderType',
    type: 'combobox',
    label: ORDERS_FORM_LABELS.FIELD_ORDER_TYPE,
    options: ORDER_TYPE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
  },
];

type OrderListProps = {
  onEdit: (order: Order) => void;
  onNew: () => void;
  onView: (order: Order) => void;
};

export function OrderList({ onEdit, onNew, onView }: OrderListProps) {
  const navigate = useNavigate();
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'search',
    'status',
    'orderType',
  ]);
  const [page, setPage] = useState(1);
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const {
    data: result,
    isLoading,
    error,
  } = useOrderList(filters as OrdersFilter, page);
  const orders = result?.data ?? [];
  const deleteMutation = useDeleteOrder();
  const { confirm, alert: showAlert } = useConfirm();

  const { pendingReviewCount, totalRevenue, totalDebt } =
    calculateOrderKPIs(orders);

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  async function handleDelete(order: Order) {
    if (order.status !== 'draft') {
      await showAlert(ORDERS_LIST_LABELS.ERR_DELETE_ONLY_DRAFT);
      return;
    }
    const ok = await confirm({
      message: ORDERS_LIST_LABELS.CONFIRM_DELETE.replace(
        '{0}',
        order.order_number,
      ),
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(order.id);
  }

  const hasFilter = !!(filters.search || filters.status || filters.orderType);

  const columns = useOrderColumns({
    isAdmin,
    onEdit,
    onView,
    handleDelete,
  });

  return (
    <>
      <PageHeader
        title={ORDERS_LIST_LABELS.PAGE_TITLE}
        subtitle={ORDERS_LIST_LABELS.PAGE_SUBTITLE}
        actions={
          <PageActions
            actions={[
              {
                id: 'progress',
                label: ORDERS_LIST_LABELS.BTN_PROGRESS,
                icon: 'BarChart3',
                priority: 'secondary',
                onClick: () => navigate('/orders/progress'),
              },
              {
                id: 'create',
                label: ORDERS_LIST_LABELS.BTN_CREATE_ORDER,
                icon: 'Plus',
                priority: 'primary',
                onClick: onNew,
              },
            ]}
          />
        }
      />

      <KPISection>
        <KpiGrid>
          <KpiCard
            label={ORDERS_DASHBOARD_LABELS.KPI_PENDING_APPROVAL}
            value={pendingReviewCount}
            icon="Bell"
            variant={pendingReviewCount > 0 ? 'warning' : 'primary'}
            footer={ORDERS_DASHBOARD_LABELS.KPI_PENDING_DESC}
            formatMode="number"
          />

          <KpiCard
            label={ORDERS_DASHBOARD_LABELS.KPI_EXPECTED_REVENUE}
            value={totalRevenue}
            icon="Banknote"
            variant="success"
            footer={ORDERS_DASHBOARD_LABELS.KPI_REVENUE_DESC}
            formatMode="currency"
          />

          <KpiCard
            label={ORDERS_DASHBOARD_LABELS.KPI_TOTAL_DEBT}
            value={totalDebt}
            icon="AlertCircle"
            variant="danger"
            footer={ORDERS_DASHBOARD_LABELS.KPI_DEBT_DESC}
            formatMode="currency"
          />
        </KpiGrid>
      </KPISection>

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
            {ORDERS_LIST_LABELS.ERR_LOAD_DATA}{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      <TableSection>
        <DataTableAdvanced
          data={orders}
          isLoading={isLoading}
          rowKey={(o) => o.id}
          onRowClick={onView}
          emptyStateTitle={
            hasFilter
              ? ORDERS_LIST_LABELS.EMPTY_SEARCH_TITLE
              : ORDERS_LIST_LABELS.EMPTY_NO_DATA_TITLE
          }
          emptyStateDescription={
            hasFilter
              ? ORDERS_LIST_LABELS.EMPTY_SEARCH_DESC
              : ORDERS_LIST_LABELS.EMPTY_NO_DATA_DESC
          }
          emptyStateIcon={hasFilter ? 'Search' : 'Package'}
          emptyStateActionLabel={
            !hasFilter ? ORDERS_LIST_LABELS.BTN_CREATE_ORDER_PLUS : undefined
          }
          onEmptyStateAction={!hasFilter ? onNew : undefined}
          columns={columns}
          renderMobileCard={(order) => <OrderMobileCard order={order} />}
          pagination={{
            result,
            onPageChange: setPage,
            itemLabel: ORDERS_LIST_LABELS.PAGINATION_LABEL,
          }}
        />
      </TableSection>
    </>
  );
}
