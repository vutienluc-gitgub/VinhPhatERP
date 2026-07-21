import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  DataTableAdvanced,
  AddButton,
  FilterBar,
  type FilterFieldConfig,
  PageLayout,
  PageHeader,
  KPISection,
  FilterSection,
  TableSection,
} from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { useDeleteOrder, useOrderList } from '@/application/orders';
import { ORDER_STATUS_LABELS, ORDER_TYPE_OPTIONS } from '@/schema/order.schema';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useAuth } from '@/shared/hooks/useAuth';

import type { Order, OrdersFilter } from './types';
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
    <PageLayout>
      <PageHeader
        title={ORDERS_LIST_LABELS.PAGE_TITLE}
        subtitle={ORDERS_LIST_LABELS.PAGE_SUBTITLE}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/orders/progress')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
            >
              <Icon name="BarChart3" size={14} />
              {ORDERS_LIST_LABELS.BTN_PROGRESS}
            </button>
            <AddButton
              onClick={onNew}
              label={ORDERS_LIST_LABELS.BTN_CREATE_ORDER}
            />
          </div>
        }
      />

      <KPISection>
        <div className="kpi-grid">
          <div
            className={`kpi-card-premium ${pendingReviewCount > 0 ? 'kpi-warning' : 'kpi-primary'}`}
          >
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">
                  {ORDERS_DASHBOARD_LABELS.KPI_PENDING_APPROVAL}
                </p>
                <p className="kpi-value">{pendingReviewCount}</p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Bell" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              {ORDERS_DASHBOARD_LABELS.KPI_PENDING_DESC}
            </div>
          </div>

          <div className="kpi-card-premium kpi-success">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">
                  {ORDERS_DASHBOARD_LABELS.KPI_EXPECTED_REVENUE}
                </p>
                <div className="flex items-baseline gap-1">
                  <MoneyText
                    value={totalRevenue}
                    className="kpi-value"
                    suffix=""
                    compact
                  />
                  <span className="text-lg font-bold opacity-80">đ</span>
                </div>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Banknote" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              {ORDERS_DASHBOARD_LABELS.KPI_REVENUE_DESC}
            </div>
          </div>

          <div className="kpi-card-premium kpi-danger">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">
                  {ORDERS_DASHBOARD_LABELS.KPI_TOTAL_DEBT}
                </p>
                <div className="flex items-baseline gap-1">
                  <MoneyText
                    value={totalDebt}
                    className="kpi-value"
                    suffix=""
                    compact
                  />
                  <span className="text-lg font-bold opacity-80">đ</span>
                </div>
              </div>
              <div className="kpi-icon-box">
                <Icon name="AlertCircle" size={32} strokeWidth={2} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              {ORDERS_DASHBOARD_LABELS.KPI_DEBT_DESC}
            </div>
          </div>
        </div>
      </KPISection>

      <FilterSection>
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
    </PageLayout>
  );
}
