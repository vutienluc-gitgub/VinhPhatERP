import { useState } from 'react'

import { useConfirm } from '@/shared/components/ConfirmDialog'
import { Pagination } from '@/shared/components/Pagination'

import type { WeavingInvoice, WeavingInvoiceFilter } from './types'
import {
  useWeavingInvoiceList,
  useConfirmWeavingInvoice,
  useDeleteWeavingInvoice,
} from './useWeavingInvoices'
import { WEAVING_STATUS_LABELS } from './weaving-invoices.module'

type Props = {
  onNew: () => void
  onEdit: (invoice: WeavingInvoice) => void
}

function statusClass(status: string) {
  if (status === 'confirmed') return 'in_stock'
  if (status === 'paid') return 'confirmed'
  return 'pending'
}

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n))
}

export function WeavingInvoiceList({ onNew, onEdit }: Props) {
  const [filters, setFilters] = useState<WeavingInvoiceFilter>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: result, isLoading, error } = useWeavingInvoiceList(filters, page)
  const invoices = result?.data ?? []

  const confirmMutation = useConfirmWeavingInvoice()
  const deleteMutation = useDeleteWeavingInvoice()
  const { confirm } = useConfirm()

  async function handleConfirm(inv: WeavingInvoice) {
    const ok = await confirm({
      message: `Xác nhận phiếu "${inv.invoice_number}"? Hệ thống sẽ tự động nhập ${inv.weaving_invoice_rolls?.length ?? '?'} cuộn vào kho vải mộc.`,
      variant: 'danger',
    })
    if (!ok) return
    confirmMutation.mutate(inv.id)
  }

  async function handleDelete(inv: WeavingInvoice) {
    const ok = await confirm({
      message: `Xóa phiếu nháp "${inv.invoice_number}"?`,
      variant: 'danger',
    })
    if (!ok) return
    deleteMutation.mutate(inv.id)
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Gia công dệt</p>
            <h3>Phiếu gia công</h3>
          </div>
          <button className="primary-button btn-standard" type="button" onClick={onNew}>
            + Tạo phiếu
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <form
          className="filter-field"
          style={{ flex: '1 1 220px' }}
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setFilters((prev) => ({ ...prev, search: search.trim() || undefined }))
          }}
        >
          <label htmlFor="wi-search">Tìm kiếm</label>
          <div className="flex-controls">
            <input
              id="wi-search"
              className="field-input"
              placeholder="Số phiếu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-secondary" type="submit">Tìm</button>
          </div>
        </form>

        <div className="filter-field">
          <label htmlFor="wi-status">Trạng thái</label>
          <select
            id="wi-status"
            className="field-select"
            value={filters.status ?? ''}
            onChange={(e) => {
              setPage(1)
              setFilters((prev) => ({ ...prev, status: (e.target.value as WeavingInvoiceFilter['status']) || undefined }))
            }}
          >
            <option value="">Tất cả</option>
            <option value="draft">Nháp</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="paid">Đã thanh toán</option>
          </select>
        </div>

        {(filters.search || filters.status) && (
          <button className="btn-secondary" style={{ alignSelf: 'flex-end' }} onClick={() => { setFilters({}); setSearch('') }}>
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Error */}
      {error && <p className="error-inline">Lỗi: {(error as Error).message}</p>}

      {/* Confirm/delete errors */}
      {confirmMutation.error && (
        <p className="error-inline">{(confirmMutation.error as Error).message}</p>
      )}

      {/* Table */}
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : invoices.length === 0 ? (
          <p className="table-empty">Chưa có phiếu gia công nào.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Số phiếu</th>
                <th>Nhà dệt</th>
                <th>Ngày</th>
                <th>Loại vải</th>
                <th className="text-right">Tổng KG</th>
                <th className="text-right">Thành tiền</th>
                <th className="text-right">Đã trả</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>
                    {inv.suppliers?.name ?? '—'}
                    {inv.suppliers?.code && (
                      <div className="td-muted" style={{ fontSize: '0.8rem' }}>{inv.suppliers.code}</div>
                    )}
                  </td>
                  <td className="td-muted">{inv.invoice_date}</td>
                  <td>{inv.fabric_type}</td>
                  <td className="numeric-cell">{fmt(inv.total_weight_kg)} kg</td>
                  <td className="numeric-cell">{fmt(inv.total_amount)} đ</td>
                  <td className="numeric-cell" style={{ color: inv.paid_amount > 0 ? 'var(--success)' : undefined }}>
                    {fmt(inv.paid_amount)} đ
                  </td>
                  <td>
                    <span className={`roll-status ${statusClass(inv.status)}`}>
                      {WEAVING_STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="td-actions">
                    {inv.status === 'draft' && (
                      <>
                        <button
                          className="btn-icon"
                          type="button"
                          title="Sửa"
                          onClick={() => onEdit(inv)}
                          style={{ marginRight: 4 }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          type="button"
                          title="Xác nhận & nhập kho"
                          onClick={() => handleConfirm(inv)}
                          disabled={confirmMutation.isPending}
                          style={{ marginRight: 4 }}
                        >
                          ✅
                        </button>
                        <button
                          className="btn-icon danger"
                          type="button"
                          title="Xóa"
                          onClick={() => handleDelete(inv)}
                          disabled={deleteMutation.isPending}
                        >
                          🗑
                        </button>
                      </>
                    )}
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
