import { useState } from 'react'

import { useConfirm } from '@/shared/components/ConfirmDialog'
import { Pagination } from '@/shared/components/Pagination'
import { exportShipmentToPdf } from './shipment-document'
import { SHIPMENT_STATUS_LABELS } from './shipments.module'
import type { Shipment, ShipmentsFilter, ShipmentStatus } from './types'
import {
  useConfirmShipment,
  useDeleteShipment,
  useExportShipmentPdf,
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
  const exportPdfMutation = useExportShipmentPdf()
  const { confirm, alert: showAlert } = useConfirm()

  function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.'
  }

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

  async function handleConfirm(shipment: Shipment) {
    const ok = await confirm({
      message: `Xác nhận xuất kho phiếu "${shipment.shipment_number}"? Hệ thống sẽ chuyển trạng thái sang Đã giao và mở phiếu PDF để in hoặc lưu.`,
    })
    if (!ok) return

    try {
      const confirmedShipment = await confirmMutation.mutateAsync(shipment.id)
      try {
        exportShipmentToPdf(confirmedShipment)
      } catch (pdfError) {
        await showAlert(
          `Phiếu ${confirmedShipment.shipment_number} đã được xác nhận nhưng không thể mở trình in PDF. ${getErrorMessage(pdfError)}`,
          'Đã xác nhận shipment',
        )
      }
    } catch (error) {
      await showAlert(`Không thể xác nhận phiếu xuất. ${getErrorMessage(error)}`)
    }
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

  async function handleExportPdf(shipment: Shipment) {
    try {
      await exportPdfMutation.mutateAsync(shipment.id)
    } catch (error) {
      await showAlert(`Không thể tạo phiếu PDF cho ${shipment.shipment_number}. ${getErrorMessage(error)}`)
    }
  }

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
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {s.status === 'preparing' && (
                        <>
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => { void handleConfirm(s) }}
                            disabled={confirmMutation.isPending}
                            style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                            title="Xác nhận xuất kho và mở phiếu PDF"
                          >
                            📦 Giao + PDF
                          </button>
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => { void handleDelete(s.id) }}
                            disabled={deleteMutation.isPending}
                            style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', color: '#c0392b' }}
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {s.status !== 'preparing' && (
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => { void handleExportPdf(s) }}
                          disabled={exportPdfMutation.isPending}
                          style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                          title="Mở phiếu xuất để in hoặc lưu PDF"
                        >
                          🖨 PDF
                        </button>
                      )}
                      {s.status === 'shipped' && (
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => { void handleDeliver(s.id) }}
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

      {(confirmMutation.error || deliverMutation.error || deleteMutation.error || exportPdfMutation.error) && (
        <p className="error-inline-sm">
          Lỗi: {((confirmMutation.error || deliverMutation.error || deleteMutation.error || exportPdfMutation.error) as Error).message}
        </p>
      )}

      <Pagination result={result} onPageChange={setPage} />
    </div>
  )
}
