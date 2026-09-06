import { useState, useMemo } from 'react';

import { useFabricCatalogList } from '@/application/settings';
import {
  Icon,
  Badge,
  DataTable,
  ClearFilterButton,
  Button,
} from '@/shared/components';
import { OrderRequestModal } from '@/features/customer-portal/orders/OrderRequestModal';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';

import {
  FABRIC_CATALOG_TEXT,
  getPrimaryComposition,
  formatSpecValue,
} from './constants';

interface FabricCatalogFilterState {
  search?: string;
  status: 'active';
}

export function PortalFabricCatalogPage() {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<FabricCatalogFilterState>({
    search: undefined,
    status: 'active',
  });
  const [page, setPage] = useState(1);
  const [selectedFabric, setSelectedFabric] = useState<string | null>(null);

  const { data, isLoading, error } = useFabricCatalogList(
    {
      search: filters.search,
      status: 'active',
    },
    page,
  );

  const catalogs = useMemo(() => data?.data ?? [], [data?.data]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  function handleClearSearch() {
    setSearchInput('');
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: undefined,
    }));
  }

  const columns = useMemo(
    () => [
      {
        header: FABRIC_CATALOG_TEXT.COL_CODE,
        cell: (fabric: FabricCatalog) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-foreground">
              <Icon name="Layers" size={20} />
            </div>
            <span className="font-bold text-foreground">{fabric.code}</span>
          </div>
        ),
      },
      {
        header: FABRIC_CATALOG_TEXT.COL_NAME,
        cell: (fabric: FabricCatalog) => (
          <div className="flex flex-col">
            <span className="font-bold text-base">{fabric.name}</span>
            <span className="text-xs text-muted-foreground italic line-clamp-1">
              {fabric.composition ||
                FABRIC_CATALOG_TEXT.LABEL_UPDATING_COMPOSITION}
            </span>
          </div>
        ),
      },
      {
        header: FABRIC_CATALOG_TEXT.COL_SPEC,
        cell: (fabric: FabricCatalog) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">
              {FABRIC_CATALOG_TEXT.LABEL_WIDTH_PREFIX}{' '}
              <span className="font-medium">
                {formatSpecValue(fabric.target_width_cm, 'cm')}
              </span>
            </span>
            <span className="text-sm">
              {FABRIC_CATALOG_TEXT.LABEL_GSM_PREFIX}{' '}
              <span className="font-medium">
                {formatSpecValue(fabric.target_gsm, 'gsm')}
              </span>
            </span>
          </div>
        ),
      },
      {
        header: FABRIC_CATALOG_TEXT.COL_UNIT,
        cell: (fabric: FabricCatalog) => (
          <Badge variant="gray">{fabric.unit}</Badge>
        ),
      },
      {
        header: FABRIC_CATALOG_TEXT.COL_FEATURES,
        cell: (fabric: FabricCatalog) => (
          <div className="flex gap-1.5 flex-wrap">
            {fabric.composition && (
              <Badge variant="gray">
                {getPrimaryComposition(fabric.composition)}
              </Badge>
            )}
            <Badge variant="primary">{FABRIC_CATALOG_TEXT.LABEL_PREMIUM}</Badge>
          </div>
        ),
      },
      {
        header: FABRIC_CATALOG_TEXT.COL_ACTIONS,
        className: 'text-right',
        cell: (fabric: FabricCatalog) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFabric(fabric.name)}
            >
              {FABRIC_CATALOG_TEXT.LABEL_REQUEST_ORDER}
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div className="portal-header-info">
          <h2 className="portal-title">{FABRIC_CATALOG_TEXT.PAGE_TITLE}</h2>
          <p className="portal-subtitle">{FABRIC_CATALOG_TEXT.PAGE_SUBTITLE}</p>
        </div>
      </div>

      <div className="portal-card">
        {/* Search Bar */}
        <div className="p-4 border-b border-border bg-surface-subtle">
          <div className="flex flex-wrap items-center gap-4">
            <form
              className="search-input-wrapper flex-1 min-w-[280px]"
              onSubmit={handleSearch}
            >
              <input
                className="field-input"
                type="text"
                placeholder={FABRIC_CATALOG_TEXT.SEARCH_PLACEHOLDER}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={handleSearch}
              />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
            {filters.search && (
              <ClearFilterButton onClick={handleClearSearch} />
            )}
          </div>
        </div>

        {error && (
          <p className="p-4 text-danger">
            {FABRIC_CATALOG_TEXT.ERROR_LOAD_FAILED}{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        )}

        <DataTable
          data={catalogs}
          isLoading={isLoading}
          rowKey={(fabric) => fabric.id}
          emptyStateTitle={FABRIC_CATALOG_TEXT.EMPTY_STATE_TITLE}
          emptyStateDescription={FABRIC_CATALOG_TEXT.EMPTY_STATE_DESC}
          emptyStateIcon="Layers"
          columns={columns}
          renderMobileCard={(fabric) => (
            <div className="portal-mobile-card p-4 rounded-xl border border-border bg-surface-strong">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon name="Layers" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground leading-tight">
                    {fabric.code}
                  </h4>
                  <p className="text-xs text-muted-foreground">{fabric.unit}</p>
                </div>
              </div>
              <h3 className="font-bold text-base mb-1 text-foreground">
                {fabric.name}
              </h3>
              <p className="text-sm text-muted-foreground italic mb-3">
                {fabric.composition ||
                  FABRIC_CATALOG_TEXT.LABEL_UNKNOWN_COMPOSITION}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3 bg-surface-subtle border border-border rounded-lg p-2.5">
                <div>
                  <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    {FABRIC_CATALOG_TEXT.LABEL_WIDTH_STD}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatSpecValue(fabric.target_width_cm, 'cm')}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    {FABRIC_CATALOG_TEXT.LABEL_GSM_STD}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatSpecValue(fabric.target_gsm, 'gsm')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="gray">
                  {getPrimaryComposition(fabric.composition)}
                </Badge>
                <Badge variant="success">
                  {FABRIC_CATALOG_TEXT.LABEL_AVAILABLE}
                </Badge>
                <div className="ml-auto flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFabric(fabric.name)}
                  >
                    {FABRIC_CATALOG_TEXT.LABEL_REQUEST}
                  </Button>
                </div>
              </div>
            </div>
          )}
          pagination={{
            result: data,
            onPageChange: setPage,
            itemLabel: FABRIC_CATALOG_TEXT.ITEM_LABEL,
          }}
        />
      </div>

      <div className="mt-6 p-5 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col md:flex-row items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-foreground shadow-sm flex-shrink-0">
          <Icon name="Info" size={24} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-primary-strong mb-1">
            {FABRIC_CATALOG_TEXT.BANNER_TITLE}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {FABRIC_CATALOG_TEXT.BANNER_DESC}
          </p>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => setSelectedFabric('')}
        >
          {FABRIC_CATALOG_TEXT.BANNER_BUTTON}
        </button>
      </div>

      {selectedFabric !== null && (
        <OrderRequestModal
          initialFabricType={selectedFabric}
          onClose={() => setSelectedFabric(null)}
        />
      )}
    </div>
  );
}
