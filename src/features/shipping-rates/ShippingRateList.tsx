import { useState } from 'react'

import { useConfirm } from '@/shared/components/ConfirmDialog'
import { formatCurrency } from './shipping-rates.module'
import type { ShippingRate, ShippingRateFilter } from './types'
import { useDeleteShippingRate, useShippingRateList } from './useShippingRates'

type Props = {
  onEdit: (item: ShippingRate) => void
  onNew: () => void
}

export function ShippingRateList({ onEdit, onNew }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<ShippingRateFilter>({})

  const { data, isLoading, error } = useShippingRateList(filters)
  const deleteMutation = useDeleteShippingRate()
  const { confirm } = useConfirm()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters((prev) => ({ ...prev, query: searchInput.trim() || undefined }))
  }

  async function handleDelete(item: ShippingRate) {
    const ok = await confirm({
      message: `Xoá bảng giá "${item.name}"?`,
      variant: 'danger',
    })
    if (!ok) return
    deleteMutation.mutate(item.id)
  }

  function rateDescription(item: ShippingRate): string {
    const parts: string[] = []
    if (item.rate_per_trip != null) parts.push(`${formatCurrency(item.rate_per_trip)}/chuyến`)
    if (item.rate_per_meter != null) parts.push(`${formatCurrency(item.rate_per_meter)}/m`)
    if (item.rate_per_kg != null) parts.push(`${formatCurrency(item.rate_per_kg)}/kg`)
    if (item.loading_fee > 0) parts.push(`Bốc xếp: ${formatCurrency(item.loading_fee)}`)
    return parts.length > 0 ? parts.join(' · ') : '—'
  }

  const hasFilter = !!filters.query

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Quản trị</p>
            <h3>Giá cước vận chuyển</h3>
          </div>
          <button className="primary-button" type="button" onClick={onNew}>
            + Thêm bảng giá
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <form className="filter-field" onSubmit={handleSearch} style={{ flex: '1 1 220px' }}>
          <label htmlFor="filter-search">Tìm kiếm</label>
          <div className="flex-controls">
            <input
              id="filter-search"
              className="field-input"
              type="text"
              placeholder="Tên hoặc khu vực..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button className="btn-secondary" type="submit" style={{ whiteSpace: 'nowrap' }}>
              Tìm
            </button>
          </div>
        </form>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => { setFilters({}); setSearchInput('') }}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="error-inline">Lỗi tải dữ liệu: {(error as Error).message}</p>
      )}

      {/* Table */}
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : !data || data.length === 0 ? (
          <p className="table-empty">
            {hasFilter ? 'Không tìm thấy bảng giá phù hợp.' : 'Chưa có bảng giá cước nào. Bấm "+ Thêm bảng giá" để tạo.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên bảng giá</th>
                <th>Khu vực</th>
                <th>Giá cước</th>
                <th>Phí tối thiểu</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.destination_area}</td>
                  <td className="td-muted" style={{ fontSize: '0.85rem' }}>{rateDescription(item)}</td>
                  <td>{item.min_charge > 0 ? formatCurrency(item.min_charge) : '—'}</td>
                  <td>
                    <span className={`roll-status ${item.is_active ? 'in_stock' : 'damaged'}`}>
                      {item.is_active ? 'Đang dùng' : 'Ngừng'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => onEdit(item)}
                        style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => { void handleDelete(item) }}
                        disabled={deleteMutation.isPending}
                        style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', color: '#c0392b' }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteMutation.error && (
        <p className="error-inline-sm">
          Lỗi: {(deleteMutation.error as Error).message}
        </p>
      )}
    </div>
  )
}
