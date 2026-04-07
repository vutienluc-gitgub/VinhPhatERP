import { useState } from 'react'

import { useConfirm } from '@/shared/components/ConfirmDialog'
import { Pagination } from '@/shared/components/Pagination'
import { TableSkeleton } from '@/shared/components/TableSkeleton'
import { EmptyState } from '@/shared/components/EmptyState'
import { Combobox } from '@/shared/components/Combobox'

import { DeliveryConfirmForm } from './DeliveryConfirmForm'
import { exportShipmentToPdf } from './shipment-document'
import { SHIPMENT_STATUS_LABELS } from './shipments.module'
import type { Shipment, ShipmentsFilter, ShipmentStatus } from './types'
import {
  useConfirmShipment,
  useDeleteShipment,
  useExportShipmentPdf,
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

function formatCost(value: number): string {
  if (!value) return '—'
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function ShipmentList() {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<ShipmentsFilter>({})
  const [page, setPage] = useState(1)
  const [deliveryShipment, setDeliveryShipment] = useState<Shipment | null>(null)

  const { data: result, isLoading, error } = useShipmentList(filters, page)
  const shipments = result?.data ?? []
  const confirmMutation = useConfirmShipment()
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

  function handleStatusChange(val: string) {
    setPage(1)
    setFilters((prev) => ({ ...prev, status: (val as ShipmentStatus) || undefined }))
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
          <Combobox
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'preparing', label: 'Đang chuẩn bị' },
              { value: 'shipped', label: 'Đã giao' },
              { value: 'delivered', label: 'Đã nhận' },
            ]}
            value={filters.status ?? ''}
            onChange={handleStatusChange}
          />
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
      <div 
        className="data-table-wrap card-table-section"
        style={isLoading || shipments.length === 0 ? { border: 'none' } : undefined}
      >
        {isLoading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : shipments.length === 0 ? (
          <EmptyState 
            icon={hasFilter ? '🔍' : '🚚'}
            title={hasFilter ? 'Không tìm thấy phiếu xuất' : 'Chưa có phiếu xuất kho'}
            description={hasFilter ? 'Hãy thử thay đổi tiêu chí tìm kiếm.' : 'Sẽ có dữ liệu ở đây khi có yêu cầu chuyển hàng hoặc đơn giao cần xử lý.'}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Số phiếu</th>
                <th>Đơn hàng</th>
                <th>Khách hàng</th>
                <th>NV giao hàng</th>
                <th>Cước VC</th>
                <th>Ngày giao</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => {
                const totalCost = (s.shipping_cost || 0) + (s.loading_fee || 0)
                return (
                  <tr key={s.id}>
                    <td><strong>{s.shipment_number}</strong></td>
                    <td className="td-muted">{s.orders?.order_number ?? '—'}</td>
                    <td>{s.customers?.name ?? '—'}</td>
                    <td className="td-muted">
                      {s.delivery_staff?.full_name ?? <span style={{ color: 'var(--warning)', fontSize: '0.82rem' }}>Chưa phân công</span>}
                    </td>
                    <td className="td-muted">{formatCost(totalCost)}</td>
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
                            onClick={() => setDeliveryShipment(s)}
                            style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                          >
                            ✓ Xác nhận nhận hàng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {(confirmMutation.error || deleteMutation.error || exportPdfMutation.error) && (
        <p className="error-inline-sm">
          Lỗi: {((confirmMutation.error || deleteMutation.error || exportPdfMutation.error) as Error).message}
        </p>
      )}

      <Pagination result={result} onPageChange={setPage} />

      {/* Delivery confirm modal */}
      {deliveryShipment && (
        <DeliveryConfirmForm
          shipment={deliveryShipment}
          onClose={() => setDeliveryShipment(null)}
        />
      )}
    </div>
  )
}
