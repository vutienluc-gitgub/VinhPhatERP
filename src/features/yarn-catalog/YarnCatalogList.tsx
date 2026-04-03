import { useState } from 'react'
import { YARN_CATALOG_STATUS_LABELS } from './yarn-catalog.module'
import type { YarnCatalog, YarnCatalogFilter, YarnCatalogStatus } from './types'
import { useDeleteYarnCatalog, useYarnCatalogList } from './useYarnCatalog'

type YarnCatalogListProps = {
  onEdit: (catalog: YarnCatalog) => void
  onNew: () => void
}

function StatusBadge({ status }: { status: YarnCatalogStatus }) {
  return (
    <span className={`roll-status ${status === 'active' ? 'in_stock' : 'damaged'}`}>
      {YARN_CATALOG_STATUS_LABELS[status]}
    </span>
  )
}

export function YarnCatalogList({ onEdit, onNew }: YarnCatalogListProps) {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<YarnCatalogFilter>({})
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useYarnCatalogList(filters, page)
  const deleteMutation = useDeleteYarnCatalog()

  const catalogs = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }))
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as YarnCatalogStatus | ''
    setPage(1)
    setFilters((prev) => ({ ...prev, status: val || undefined }))
  }

  function handleDelete(catalog: YarnCatalog) {
    if (!window.confirm(`Xóa loại sợi "${catalog.name}"? Hành động này không thể hoàn tác.`)) return
    deleteMutation.mutate(catalog.id)
  }

  const hasFilter = !!(filters.search || filters.status)

  return (
    <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div className="page-header">
          <div>
            <p className="eyebrow">Master Data</p>
            <h3>Danh mục loại sợi</h3>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={onNew}
            style={{ minHeight: 40, padding: '0.6rem 1.1rem', fontSize: '0.9rem' }}
          >
            + Thêm loại sợi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="filter-bar"
        style={{ margin: '1rem 1.25rem', borderRadius: 'var(--radius-sm)' }}
      >
        <form
          className="filter-field"
          onSubmit={handleSearch}
          style={{ flex: '1 1 220px' }}
        >
          <label htmlFor="filter-search">Tìm kiếm</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              id="filter-search"
              className="field-input"
              type="text"
              placeholder="Tên, mã, thành phần..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button className="btn-secondary" type="submit" style={{ whiteSpace: 'nowrap' }}>
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
            onClick={() => { setFilters({}); setSearchInput(''); setPage(1) }}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {error && (
        <p style={{ padding: '1rem 1.25rem', color: '#c0392b', fontSize: '0.9rem' }}>
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      <div
        className="data-table-wrap"
        style={{ margin: '0 1.25rem 1.25rem', borderRadius: 'var(--radius-sm)' }}
      >
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : catalogs.length === 0 ? (
          <p className="table-empty">
            {hasFilter
              ? 'Không tìm thấy loại sợi phù hợp.'
              : 'Chưa có loại sợi nào. Nhấn "+ Thêm loại sợi" để bắt đầu.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên loại sợi</th>
                <th>Thành phần</th>
                <th>Xuất xứ</th>
                <th>Đơn vị</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {catalogs.map((catalog) => (
                <tr key={catalog.id}>
                  <td><strong>{catalog.code}</strong></td>
                  <td>
                    {catalog.name}
                    {catalog.color_name && (
                      <div className="td-muted" style={{ fontSize: '0.8rem' }}>
                        {catalog.color_name}
                      </div>
                    )}
                  </td>
                  <td className="td-muted">{catalog.composition ?? '—'}</td>
                  <td className="td-muted">{catalog.origin ?? '—'}</td>
                  <td className="td-muted">{catalog.unit}</td>
                  <td><StatusBadge status={catalog.status} /></td>
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
          <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
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
  )
}
