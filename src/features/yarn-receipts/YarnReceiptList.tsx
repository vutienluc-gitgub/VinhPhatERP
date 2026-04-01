import { useState } from 'react'
import { DOC_STATUS_LABELS } from './yarn-receipts.module'
import { useConfirm } from '@/shared/components/ConfirmDialog'
import { Pagination } from '@/shared/components/Pagination'
import type { DocStatus, YarnReceipt, YarnReceiptsFilter } from './types'
import { useDeleteYarnReceipt, useYarnReceiptList } from './useYarnReceipts'

type YarnReceiptListProps = {
  onEdit: (receipt: YarnReceipt) => void
  onNew: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function statusClass(status: DocStatus): string {
  switch (status) {
    case 'confirmed':
      return 'in_stock'
    case 'cancelled':
      return 'damaged'
    default:
      return 'pending'
  }
}

export function YarnReceiptList({ onEdit, onNew }: YarnReceiptListProps) {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<YarnReceiptsFilter>({})
  const [page, setPage] = useState(1)

  const { data: result, isLoading, error } = useYarnReceiptList(filters, page)
  const receipts = result?.data ?? []
  const deleteMutation = useDeleteYarnReceipt()
  const { confirm } = useConfirm()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }))
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as DocStatus | ''
    setPage(1)
    setFilters((prev) => ({ ...prev, status: val || undefined }))
  }

  async function handleDelete(receipt: YarnReceipt) {
    const ok = await confirm({
      message: `Xóa phiếu nhập "${receipt.receipt_number}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    })
    if (!ok) return
    deleteMutation.mutate(receipt.id)
  }

  const hasFilter = !!(filters.search || filters.status)

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Nghiệp vụ kho</p>
            <h3>Phiếu nhập sợi</h3>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={onNew}
            className="primary-button btn-standard"
          >
            + Tạo phiếu nhập
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="filter-bar card-filter-section"
      >
        <form
          className="filter-field"
          onSubmit={handleSearch}
          style={{ flex: '1 1 220px' }}
        >
          <label htmlFor="filter-search">Tìm kiếm</label>
          <div className="flex-controls">
            <input
              id="filter-search"
              className="field-input"
              type="text"
              placeholder="Số phiếu nhập..."
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
            <option value="draft">Nháp</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="cancelled">Đã huỷ</option>
          </select>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({})
              setSearchInput('')
            }}
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
      >
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : receipts.length === 0 ? (
          <p className="table-empty">
            {hasFilter
              ? 'Không tìm thấy phiếu nhập phù hợp.'
              : 'Chưa có phiếu nhập nào. Nhấn "+ Tạo phiếu nhập" để bắt đầu.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Số phiếu</th>
                <th>Nhà cung cấp</th>
                <th>Ngày nhập</th>
                <th className="text-right">Tổng tiền</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td>
                    <strong>{receipt.receipt_number}</strong>
                  </td>
                  <td>
                    {receipt.suppliers?.name ?? '—'}
                    {receipt.suppliers?.code && (
                      <div className="td-muted" style={{ fontSize: '0.8rem' }}>
                        {receipt.suppliers.code}
                      </div>
                    )}
                  </td>
                  <td className="td-muted">{receipt.receipt_date}</td>
                  <td className="numeric-cell">
                    {formatCurrency(receipt.total_amount)}
                  </td>
                  <td>
                    <span className={`roll-status ${statusClass(receipt.status)}`}>
                      {DOC_STATUS_LABELS[receipt.status]}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button
                      className="btn-icon"
                      type="button"
                      title="Sửa"
                      onClick={() => onEdit(receipt)}
                      style={{ marginRight: 4 }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon danger"
                      type="button"
                      title="Xóa"
                      onClick={() => handleDelete(receipt)}
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
