import { useState } from 'react'

import { useConfirm } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { Pagination } from '@/shared/components/Pagination'
import { TableSkeleton } from '@/shared/components/TableSkeleton'

import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_STATUSES,
  SUPPLIER_STATUS_LABELS,
} from './suppliers.module'
import type { Supplier, SupplierCategory, SupplierFilter } from './types'
import { useDeleteSupplier, useSuppliersList } from './useSuppliers'

type SuppliersListProps = {
  onEdit: (supplier: Supplier) => void
  onNew: () => void
}

export function SuppliersList({ onEdit, onNew }: SuppliersListProps) {
  const [filters, setFilters] = useState<SupplierFilter>({})
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const { data: result, isLoading, error } = useSuppliersList(filters, page)
  const suppliers = result?.data ?? []
  const deleteMutation = useDeleteSupplier()
  const { confirm } = useConfirm()

  const hasFilter = !!(filters.search || filters.category || filters.status)

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as SupplierCategory | ''
    setPage(1)
    setFilters((prev) => ({ ...prev, category: val || undefined }))
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as 'active' | 'inactive' | ''
    setPage(1)
    setFilters((prev) => ({ ...prev, status: val || undefined }))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }))
  }

  function clearFilters() {
    setFilters({})
    setSearchInput('')
  }

  async function handleDelete(supplier: Supplier) {
    const ok = await confirm({
      message: `Xóa NCC "${supplier.name}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    })
    if (!ok) return
    deleteMutation.mutate(supplier.id)
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Nhà cung cấp</p>
            <h3>Danh sách nhà cung cấp</h3>
          </div>
          <button
            className="primary-button btn-standard"
            type="button"
            onClick={onNew}
          >
            + Thêm NCC mới
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="filter-bar card-filter-section">
        <form className="filter-field" onSubmit={handleSearch} style={{ flex: '1 1 200px' }}>
          <label htmlFor="filter-search">Tìm kiếm</label>
          <div className="flex-controls">
            <input
              id="filter-search"
              className="field-input"
              type="text"
              placeholder="Tên hoặc mã NCC..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button className="btn-secondary" type="submit" style={{ whiteSpace: 'nowrap' }}>
              Lọc
            </button>
          </div>
        </form>

        <div className="filter-field" style={{ flex: '0 1 160px' }}>
          <label htmlFor="filter-category">Danh mục</label>
          <select
            id="filter-category"
            className="field-select"
            value={filters.category ?? ''}
            onChange={handleCategoryChange}
          >
            <option value="">Tất cả</option>
            {SUPPLIER_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {SUPPLIER_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field" style={{ flex: '0 1 140px' }}>
          <label htmlFor="filter-status">Trạng thái</label>
          <select
            id="filter-status"
            className="field-select"
            value={filters.status ?? ''}
            onChange={handleStatusChange}
          >
            <option value="">Tất cả</option>
            {SUPPLIER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {SUPPLIER_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={clearFilters}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Loading / Error */}
      {error && (
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Table */}
      <div 
        className="data-table-wrap card-table-section"
        style={isLoading || suppliers.length === 0 ? { border: 'none' } : undefined}
      >
        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : suppliers.length === 0 ? (
          <EmptyState 
            icon={hasFilter ? '🔍' : '🤝'}
            title={hasFilter ? 'Không tìm thấy nhà cung cấp' : 'Chưa có nhà cung cấp'}
            description={hasFilter ? 'Vui lòng thử điều chỉnh lại bộ lọc.' : 'Nhấn nút thêm nhà cung cấp mới để lưu trữ thông tin liên hệ.'}
            actionLabel={!hasFilter ? '+ Thêm NCC mới' : undefined}
            actionClick={!hasFilter ? onNew : undefined}
          />
        ) : (
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Mã NCC</th>
                <th>Tên nhà cung cấp</th>
                <th>Danh mục</th>
                <th>Số điện thoại</th>
                <th>Người liên hệ</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>
                    <strong>{supplier.code}</strong>
                  </td>
                  <td>
                    {supplier.name}
                    {supplier.address && (
                      <div className="td-muted" style={{ fontSize: '0.8rem' }}>
                        {supplier.address}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="roll-status in_stock" style={{ fontSize: '0.78rem' }}>
                      {SUPPLIER_CATEGORY_LABELS[supplier.category]}
                    </span>
                  </td>
                  <td className="td-muted">{supplier.phone || '—'}</td>
                  <td className="td-muted">{supplier.contact_person || '—'}</td>
                  <td>
                    <span
                      className={`roll-status ${supplier.status === 'active' ? 'in_stock' : 'damaged'}`}
                    >
                      {SUPPLIER_STATUS_LABELS[supplier.status]}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button
                      className="btn-icon"
                      type="button"
                      title="Sửa"
                      onClick={() => onEdit(supplier)}
                      style={{ marginRight: 4 }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon danger"
                      type="button"
                      title="Xóa"
                      onClick={() => handleDelete(supplier)}
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

      <Pagination result={result} onPageChange={setPage} />
    </div>
  )
}
