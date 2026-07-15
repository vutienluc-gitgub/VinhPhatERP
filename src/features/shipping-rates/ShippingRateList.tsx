import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTable,
  AddButton,
  ActionBar,
  FilterBar,
  type FilterFieldConfig,
} from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { MoneyText } from '@/shared/value';
import { formatQuantity } from '@/shared/value/core/formatter';
import {
  useDeleteShippingRate,
  useShippingRateList,
} from '@/application/shipments';

import type { ShippingRate, ShippingRateFilter } from './types';
import { SHIPPING_RATE_LABELS } from './shipping-rates.constants';

type Props = {
  onEdit: (item: ShippingRate) => void;
  onNew: () => void;
};

function rateDescription(item: ShippingRate): string {
  const parts: string[] = [];
  if (item.rate_per_trip != null)
    parts.push(
      `${formatQuantity(item.rate_per_trip, 0)}${SHIPPING_RATE_LABELS.SUFFIX_TRIP.trim()}`,
    );
  if (item.rate_per_meter != null)
    parts.push(
      `${formatQuantity(item.rate_per_meter, 0)}${SHIPPING_RATE_LABELS.SUFFIX_METER.trim()}`,
    );
  if (item.rate_per_kg != null)
    parts.push(
      `${formatQuantity(item.rate_per_kg, 0)}${SHIPPING_RATE_LABELS.SUFFIX_KG.trim()}`,
    );
  if (item.loading_fee > 0)
    parts.push(
      `${SHIPPING_RATE_LABELS.TEXT_LOADING_FEE}: ${formatQuantity(item.loading_fee, 0)}${SHIPPING_RATE_LABELS.SUFFIX_VND.trim()}`,
    );
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function getStatusVariant(isActive: boolean): BadgeVariant {
  return isActive ? 'success' : 'gray';
}

export function ShippingRateList({ onEdit, onNew }: Props) {
  const { filters, setFilter, clearFilters } = useUrlFilterState(['query']);

  const { data, isLoading, error } = useShippingRateList(
    filters as ShippingRateFilter,
  );
  const rates = data ?? [];
  const deleteMutation = useDeleteShippingRate();
  const { confirm } = useConfirm();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'query',
      type: 'search',
      label: SHIPPING_RATE_LABELS.SEARCH_LABEL,
      placeholder: SHIPPING_RATE_LABELS.SEARCH_PLACEHOLDER,
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setFilter(key, value);
  }

  async function handleDelete(item: ShippingRate) {
    const ok = await confirm({
      message: `${SHIPPING_RATE_LABELS.CONFIRM_DELETE} "${item.name}"?`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(item.id);
  }

  const hasFilter = !!filters.query;

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton onClick={onNew} label={SHIPPING_RATE_LABELS.BTN_ADD} />
      </div>

      {/* Filters */}
      <FilterBar
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            {SHIPPING_RATE_LABELS.ERROR_LOAD}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <DataTable
        data={rates}
        isLoading={isLoading}
        rowKey={(item) => item.id}
        onRowClick={(item) => onEdit(item)}
        emptyStateTitle={
          hasFilter
            ? SHIPPING_RATE_LABELS.EMPTY_TITLE_SEARCH
            : SHIPPING_RATE_LABELS.EMPTY_TITLE
        }
        emptyStateDescription={
          hasFilter
            ? SHIPPING_RATE_LABELS.EMPTY_DESC_SEARCH
            : SHIPPING_RATE_LABELS.EMPTY_DESC
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Truck'}
        emptyStateActionLabel={
          !hasFilter ? `+ ${SHIPPING_RATE_LABELS.BTN_ADD}` : undefined
        }
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: SHIPPING_RATE_LABELS.TITLE_NAME,
            cell: (item) => (
              <span className="font-bold text-primary">{item.name}</span>
            ),
          },
          {
            header: SHIPPING_RATE_LABELS.TITLE_AREA,
            cell: (item) => (
              <span className="font-medium">{item.destination_area}</span>
            ),
          },
          {
            header: SHIPPING_RATE_LABELS.TITLE_RATE,
            cell: (item) => (
              <span className="text-sm text-muted">
                {rateDescription(item)}
              </span>
            ),
          },
          {
            header: SHIPPING_RATE_LABELS.TITLE_MIN_CHARGE,
            cell: (item) => (
              <span className="font-medium">
                {item.min_charge > 0 ? (
                  <>
                    <MoneyText value={item.min_charge} />đ
                  </>
                ) : (
                  '—'
                )}
              </span>
            ),
          },
          {
            header: SHIPPING_RATE_LABELS.TITLE_STATUS,
            cell: (item) => (
              <Badge variant={getStatusVariant(item.is_active)}>
                {item.is_active
                  ? SHIPPING_RATE_LABELS.STATUS_ACTIVE
                  : SHIPPING_RATE_LABELS.STATUS_INACTIVE}
              </Badge>
            ),
          },
          {
            header: SHIPPING_RATE_LABELS.TITLE_ACTIONS,
            className: 'text-right',
            onCellClick: () => {},
            cell: (item) => (
              <ActionBar
                actions={[
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(item),
                    title: SHIPPING_RATE_LABELS.BTN_EDIT,
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => {
                      void handleDelete(item);
                    },
                    title: SHIPPING_RATE_LABELS.BTN_DELETE,
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            ),
          },
        ]}
        renderMobileCard={(item) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{item.name}</span>
              <Badge variant={getStatusVariant(item.is_active)}>
                {item.is_active
                  ? SHIPPING_RATE_LABELS.STATUS_ACTIVE
                  : SHIPPING_RATE_LABELS.STATUS_INACTIVE}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">
                    {SHIPPING_RATE_LABELS.TITLE_AREA}
                  </span>
                  <span className="font-bold">{item.destination_area}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">
                    {SHIPPING_RATE_LABELS.TITLE_MIN_CHARGE}
                  </span>
                  <span className="font-medium">
                    {item.min_charge > 0 ? (
                      <MoneyText value={item.min_charge} />
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted">{rateDescription(item)}</div>
              <div className="flex gap-2 pt-2 border-t border-border/10">
                <button
                  className="btn-secondary flex-1 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Icon name="Pencil" size={16} />{' '}
                  {SHIPPING_RATE_LABELS.BTN_EDIT}
                </button>
                <button
                  className="btn-secondary text-danger border-danger/20 px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(item);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {deleteMutation.error && (
        <p className="error-inline-sm">
          {SHIPPING_RATE_LABELS.ERROR_PREFIX}
          {deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : String(deleteMutation.error)}
        </p>
      )}
    </div>
  );
}
