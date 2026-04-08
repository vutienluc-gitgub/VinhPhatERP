import { useState } from 'react';

import { FABRIC_CATALOG_STATUS_LABELS } from './fabric-catalog.module';
import type {
  FabricCatalog,
  FabricCatalogFilter,
  FabricCatalogStatus,
} from './types';
import {
  useDeleteFabricCatalog,
  useFabricCatalogList,
} from './useFabricCatalog';

type FabricCatalogListProps = {
  onEdit: (catalog: FabricCatalog) => void;
  onNew: () => void;
};

function StatusBadge({ status }: { status: FabricCatalogStatus }) {
  return (
    <span
      className={`roll-status ${status === 'active' ? 'in_stock' : 'damaged'}`}
    >
      {FABRIC_CATALOG_STATUS_LABELS[status]}
    </span>
  );
}

export function FabricCatalogList({ onEdit, onNew }: FabricCatalogListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<FabricCatalogFilter>({});
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useFabricCatalogList(filters, page);
  const deleteMutation = useDeleteFabricCatalog();

  const catalogs = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as FabricCatalogStatus | '';
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      status: val || undefined,
    }));
  }

  function handleDelete(catalog: FabricCatalog) {
    if (
      !window.confirm(
        `Xóa loại vải "${catalog.name}"? Hành động này không thể hoàn tác.`,
      )
    )
      return;
    deleteMutation.mutate(catalog.id);
  }

  const hasFilter = !!(filters.search || filters.status);

  return (
    <div
      className="panel-card"
      style={{
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div className="page-header">
          <div>
            <p className="eyebrow">Master Data</p>
            <h3>Danh mục loại vải</h3>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={onNew}
            style={{
              minHeight: 40,
              padding: '0.6rem 1.1rem',
              fontSize: '0.9rem',
            }}
          >
            + Thêm loại vải
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="filter-bar"
        style={{
          margin: '1rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <form
          className="filter-field"
          onSubmit={handleSearch}
          style={{ flex: '1 1 220px' }}
        >
          <label htmlFor="filter-search">Tìm kiếm</label>
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
            }}
          >
            <input
              id="filter-search"
              className="field-input"
              type="text"
              placeholder="Tên, mã, thành phần..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              className="btn-secondary"
              type="submit"
              style={{ whiteSpace: 'nowrap' }}
            >
              Tìm
            </button>
          </div>
        </form>

        <div className="filter-field">
          <label htmlFor="filter-status">Trạng thái</label>
          <select
            id="filter-status"
            className="field-select"
            value={filters.status ?? ''}
            onChange={handleStatusChange}
          >
            <option value="">Tất cả</option>
            <option value="active">Đang dùng</option>
            <option value="inactive">Ngưng dùng</option>
          </select>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setSearchInput('');
              setPage(1);
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {error && (
        <p
          style={{
            padding: '1rem 1.25rem',
            color: '#c0392b',
            fontSize: '0.9rem',
          }}
        >
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      <div
        className="data-table-wrap"
        style={{
          margin: '0 1.25rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : catalogs.length === 0 ? (
          <p className="table-empty">
            {hasFilter
              ? 'Không tìm thấy loại vải phù hợp.'
              : 'Chưa có loại vải nào. Nhấn "+ Thêm loại vải" để bắt đầu.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên loại vải</th>
                <th>Thành phần</th>
                <th>Đơn vị</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {catalogs.map((catalog) => (
                <tr key={catalog.id}>
                  <td>
                    <strong>{catalog.code}</strong>
                  </td>
                  <td>{catalog.name}</td>
                  <td className="td-muted">{catalog.composition ?? '—'}</td>
                  <td className="td-muted">{catalog.unit}</td>
                  <td>
                    <StatusBadge status={catalog.status} />
                  </td>
                  <td className="td-actions">
                    <button
                      className="btn-icon"
                      type="button"
                      title="Sửa"
                      onClick={() => onEdit(catalog)}
                      style={{ marginRight: 4 }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon danger"
                      type="button"
                      title="Xóa"
                      onClick={() => handleDelete(catalog)}
                      disabled={deleteMutation.isPending}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0 1.25rem 1.25rem',
          }}
        >
          <button
            className="btn-secondary"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </button>
          <span
            style={{
              alignSelf: 'center',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            {page} / {totalPages}
          </span>
          <button
            className="btn-secondary"
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
}
