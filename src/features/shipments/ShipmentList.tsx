import { useCallback, useState } from 'react'

import { useConfirm } from '@/shared/components/ConfirmDialog'
import { Pagination } from '@/shared/components/Pagination'
import { SHIPMENT_STATUS_LABELS } from './shipments.module'
import type { ShipmentsFilter, ShipmentStatus } from './types'
import {
  useConfirmShipment,
  useDeleteShipment,
  useMarkDelivered,
  useShipmentList,
} from './useShipments'

function statusClass(status: ShipmentStatus): string {
  switch (status) {
    case 'shipped': return 'reserved'
    case 'delivered': return 'in_stock'
    case 'partially_returned': return 'in_process'
    case 'returned': return 'damaged'
    default: return 'shipped'
  }
}

export function ShipmentList() {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<ShipmentsFilter>({})
  const [page, setPage] = useState(1)

  const { data: result, isLoading, error } = useShipmentList(filters, page)
  const shipments = result?.data ?? []
  const confirmMutation = useConfirmShipment()
  const deliverMutation = useMarkDelivered()
  const deleteMutation = useDeleteShipment()
  const { confirm } = useConfirm()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }))
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as ShipmentStatus | ''
    setPage(1)
    setFilters((prev) => ({ ...prev, status: val || undefined }))
  }

  async function handleConfirm(id: string) {
    const ok = await confirm({ message: 'Xác nhận giao hàng? Cuộn vải sẽ chuyển sang trạng thái đã giao.' })
    if (!ok) return
    confirmMutation.mutate(id)
  }

  async function handleDeliver(id: string) {
    const ok = await confirm({ message: 'Xác nhận khách hàng đã nhận hàng?' })
    if (!ok) return
    deliverMutation.mutate(id)
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ message: 'Xoá phiếu xuất? Cuộn vải sẽ trả lại kho.', variant: 'danger' })
    if (!ok) return
    deleteMutation.mutate(id)
  }

  const onConfirmClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.id
    if (id) void handleConfirm(id)
  }, [confirm, confirmMutation])

  const onDeliverClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.id
    if (id) void handleDeliver(id)
  }, [confirm, deliverMutation])

  const onDeleteClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.id
    if (id) void handleDelete(id)
  }, [confirm, deleteMutation])

  const hasFilter = !!(filters.search || filters.status)

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Kho & Giao hàng</p>
            <h3>Xuất kho</h3>
          </div>
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
              placeholder="Số phiếu xuất..."
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
            <option value="preparing">Đang chuẩn bị</option>
            <option value="shipped">Đã giao</option>
            <option value="delivered">Đã nhận</option>
          </select>
        </div>

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
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Table */}
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : shipments.length === 0 ? (
          <p className="table-empty">
            {hasFilter ? 'Không tìm thấy phiếu xuất phù hợp.' : 'Chưa có phiếu xuất nào.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Số phiếu</th>
                <th>Đơn hàng</th>
                <th>Khách hàng</th>
                <th>Ngày giao</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.shipment_number}</strong></td>
                  <td className="td-muted">{s.orders?.order_number ?? '—'}</td>
                  <td>{s.customers?.name ?? '—'}</td>
                  <td className="td-muted">{s.shipment_date}</td>
                  <td>
                    <span className={`roll-status ${statusClass(s.status)}`}>
                      {SHIPMENT_STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {s.status === 'preparing' && (
                        <>
                          <button
                            className="btn-secondary"
                            type="button"
                            data-id={s.id}
                            onClick={onConfirmClick}
                            disabled={confirmMutation.isPending}
                            style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                          >
                            📦 Giao
                          </button>
                          <button
                            className="btn-secondary"
                            type="button"
                            data-id={s.id}
                            onClick={onDeleteClick}
                            disabled={deleteMutation.isPending}
                            style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', color: '#c0392b' }}
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {s.status === 'shipped' && (
                        <button
                          className="btn-secondary"
                          type="button"
                          data-id={s.id}
                          onClick={onDeliverClick}
                          disabled={deliverMutation.isPending}
                          style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                        >
                          ✓ Đã nhận
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(confirmMutation.error || deliverMutation.error || deleteMutation.error) && (
        <p className="error-inline-sm">
          Lỗi: {((confirmMutation.error || deliverMutation.error || deleteMutation.error) as Error).message}
        </p>
      )}

      <Pagination result={result} onPageChange={setPage} />
    </div>
  )
}
