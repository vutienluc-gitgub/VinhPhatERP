import { AddButton, FilterBar } from '@/shared/components';
import { DataTableAdvanced } from '@/shared/components/DataTableAdvanced';

import type { YarnCatalog } from './types';
import { useYarnCatalogColumns } from './hooks/useYarnCatalogColumns';
import { YarnCatalogMobileCard } from './components/YarnCatalogMobileCard';
import { useYarnCatalogListPresenter } from './hooks/useYarnCatalogListPresenter';
import {
  YARN_CATALOG_MESSAGES,
  YARN_CATALOG_FILTER_SCHEMA,
} from './yarn-catalog.constants';

type YarnCatalogListProps = {
  onEdit: (catalog: YarnCatalog) => void;
  onNew: () => void;
};

export function YarnCatalogList({ onEdit, onNew }: YarnCatalogListProps) {
  const {
    filters,
    catalogs,
    paginationResult,
    isLoading,
    error,
    isDeleting,
    deleteError,
    hasFilter,
    setPage,
    handleFilterChange,
    handleClearFilters,
    handleDelete,
  } = useYarnCatalogListPresenter();

  const tableColumns = useYarnCatalogColumns(onEdit, handleDelete, isDeleting);

  return (
    <div
      className="panel-card card-flush"
      aria-label={YARN_CATALOG_MESSAGES.ARIA_LIST_CONTAINER}
    >
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton
          onClick={onNew}
          label={YARN_CATALOG_MESSAGES.BTN_ADD}
          aria-label={YARN_CATALOG_MESSAGES.ARIA_ADD_NEW}
        />
      </div>

      {/* Filters (Config-Driven) */}
      <div aria-label={YARN_CATALOG_MESSAGES.ARIA_FILTER_BAR}>
        <FilterBar
          schema={YARN_CATALOG_FILTER_SCHEMA}
          value={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      {/* Error Output */}
      <div aria-live="polite" aria-atomic="true">
        {error && (
          <div className="p-4">
            <p className="error-inline" role="alert">
              {YARN_CATALOG_MESSAGES.LOAD_ERROR}:{' '}
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        )}
        {deleteError && (
          <div className="p-4">
            <p className="error-inline-sm" role="alert">
              {YARN_CATALOG_MESSAGES.DELETE_ERROR}:{' '}
              {deleteError instanceof Error
                ? deleteError.message
                : String(deleteError)}
            </p>
          </div>
        )}
      </div>

      {/* Table & Cards */}
      <div aria-label={YARN_CATALOG_MESSAGES.ARIA_DATA_TABLE}>
        <DataTableAdvanced
          data={catalogs}
          isLoading={isLoading}
          rowKey={(c) => c.id}
          onRowClick={(c) => onEdit(c)}
          exportFileName={YARN_CATALOG_MESSAGES.EXPORT_FILENAME}
          emptyStateTitle={
            hasFilter
              ? YARN_CATALOG_MESSAGES.NOT_FOUND_TITLE
              : YARN_CATALOG_MESSAGES.EMPTY_TITLE
          }
          emptyStateDescription={
            hasFilter
              ? YARN_CATALOG_MESSAGES.NOT_FOUND_DESC
              : YARN_CATALOG_MESSAGES.EMPTY_DESC
          }
          emptyStateIcon={hasFilter ? 'Search' : 'Layers'}
          emptyStateActionLabel={
            !hasFilter ? YARN_CATALOG_MESSAGES.BTN_ADD : undefined
          }
          onEmptyStateAction={!hasFilter ? onNew : undefined}
          columns={tableColumns}
          renderMobileCard={(c) => (
            <YarnCatalogMobileCard
              catalog={c}
              onEdit={onEdit}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          )}
          pagination={{
            result: paginationResult,
            onPageChange: setPage,
            itemLabel: YARN_CATALOG_MESSAGES.PAGINATION_LABEL,
          }}
        />
      </div>
    </div>
  );
}
