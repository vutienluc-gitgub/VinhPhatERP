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
import { ORDER_MESSAGES as MSG } from './orders.constants';

const filterSchema: FilterFieldConfig[] = [
  {
    key: 'search',
    type: 'search',
    label: MSG.SEARCH_LABEL,
    placeholder: MSG.SEARCH_PLACEHOLDER,
  },
  {
    key: 'status',
    type: 'combobox',
    label: MSG.PROG_FILTER_STATUS,
    options: Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'orderType',
    type: 'combobox',
    label: MSG.FIELD_ORDER_TYPE,
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
      await showAlert(MSG.ERR_DELETE_ONLY_DRAFT);
      return;
    }
    const ok = await confirm({
      message: MSG.CONFIRM_DELETE.replace('{0}', order.order_number),
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
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/orders/progress')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
            >
              <Icon name="BarChart3" size={14} />
              {MSG.BTN_PROGRESS}
            </button>
            <AddButton onClick={onNew} label={MSG.BTN_CREATE_ORDER} />
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
                <p className="kpi-label">{MSG.KPI_PENDING_APPROVAL}</p>
                <p className="kpi-value">{pendingReviewCount}</p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Bell" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              {MSG.KPI_PENDING_DESC}
            </div>
          </div>

          <div className="kpi-card-premium kpi-success">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">{MSG.KPI_EXPECTED_REVENUE}</p>
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
              {MSG.KPI_REVENUE_DESC}
            </div>
          </div>

          <div className="kpi-card-premium kpi-danger">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">{MSG.KPI_TOTAL_DEBT}</p>
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
              {MSG.KPI_DEBT_DESC}
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
            {MSG.ERR_LOAD_DATA}{' '}
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
            hasFilter ? MSG.EMPTY_SEARCH_TITLE : MSG.EMPTY_NO_DATA_TITLE
          }
          emptyStateDescription={
            hasFilter ? MSG.EMPTY_SEARCH_DESC : MSG.EMPTY_NO_DATA_DESC
          }
          emptyStateIcon={hasFilter ? 'Search' : 'Package'}
          emptyStateActionLabel={
            !hasFilter ? MSG.BTN_CREATE_ORDER_PLUS : undefined
          }
          onEmptyStateAction={!hasFilter ? onNew : undefined}
          columns={columns}
          renderMobileCard={(order) => <OrderMobileCard order={order} />}
          pagination={{
            result,
            onPageChange: setPage,
            itemLabel: MSG.PAGINATION_LABEL,
          }}
        />
      </TableSection>
    </PageLayout>
  );
}
