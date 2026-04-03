import { useState } from 'react'

import { useConfirm } from '@/shared/components/ConfirmDialog'
import { Pagination } from '@/shared/components/Pagination'
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_ICONS } from './quotations.module'
import type { Quotation, QuotationsFilter, QuotationStatus } from './types'
import { useDeleteQuotation, useExpiringQuotationsCount, useQuotationList } from './useQuotations'

type QuotationListProps = {
  onEdit: (quotation: Quotation) => void
  onNew: () => void
  onView: (quotation: Quotation) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function statusClass(status: QuotationStatus): string {
  switch (status) {
    case 'sent':
      return 'reserved'
    case 'confirmed':
      return 'in_stock'
    case 'rejected':
      return 'damaged'
    case 'expired':
      return 'written_off'
    case 'converted':
      return 'in_process'
    default:
      return 'shipped'
  }
}

function validityInfo(validUntil: string | null): { text: string; urgent: boolean } | null {
  if (!validUntil) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDate = new Date(validUntil)
  const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { text: `Hết hạn ${Math.abs(diff)} ngày`, urgent: true }
  if (diff === 0) return { text: 'Hết hạn hôm nay', urgent: true }
  if (diff <= 3) return { text: `Còn ${diff} ngày`, urgent: true }
  return { text: `Còn ${diff} ngày`, urgent: false }
}

export function QuotationList({ onEdit, onNew, onView }: QuotationListProps) {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<QuotationsFilter>({})
  const [page, setPage] = useState(1)

  const { data: result, isLoading, error } = useQuotationList(filters, page)
  const quotations = result?.data ?? []
  const deleteMutation = useDeleteQuotation()
  const { data: expiringData } = useExpiringQuotationsCount()
  const { confirm, alert: showAlert } = useConfirm()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }))
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as QuotationStatus | ''
    setPage(1)
    setFilters((prev) => ({ ...prev, status: val || undefined }))
  }

  async function handleDelete(q: Quotation) {
    if (q.status !== 'draft') {
      await showAlert('Chỉ có thể xoá báo giá ở trạng thái Nháp.')
      return
    }
    const ok = await confirm({
      message: `Xóa báo giá "${q.quotation_number}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    })
    if (!ok) return
    deleteMutation.mutate(q.id)
  }

  const hasFilter = !!(filters.search || filters.status)

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Bán hàng</p>
            <h3>Báo giá</h3>
          </div>
          <button
            className="primary-button btn-standard"
            type="button"
            onClick={onNew}
          >
            + Tạo báo giá
          </button>
        </div>
      </div>

      {/* Expiration warnings */}
      {expiringData && (expiringData.expiring > 0 || expiringData.expired > 0) && (
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '0.5rem 1.25rem',
            flexWrap: 'wrap',
          }}
        >
          {expiringData.expired > 0 && (
            <span
              style={{
                background: '#fde8e8',
                color: '#c0392b',
                padding: '0.3rem 0.7rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 500,
              }}
            >
              ⚠️ {expiringData.expired} báo giá đã hết hạn
            </span>
          )}
          {expiringData.expiring > 0 && (
            <span
              style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '0.3rem 0.7rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 500,
              }}
            >
              ⏰ {expiringData.expiring} báo giá sắp hết hạn
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar card-filter-section">
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
              placeholder="Số báo giá..."
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
            <option value="draft">Nháp</option>
            <option value="sent">Đã gửi</option>
            <option value="confirmed">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="expired">Hết hạn</option>
            <option value="converted">Đã chuyển ĐH</option>
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
        ) : quotations.length === 0 ? (
          <p className="table-empty">
            {hasFilter
              ? 'Không tìm thấy báo giá phù hợp.'
              : 'Chưa có báo giá nào. Nhấn "+ Tạo báo giá" để bắt đầu.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Ngày BG</th>
                <th className="hide-mobile">Hiệu lực</th>
                <th className="text-right">Tổng tiền</th>
                <th className="hide-mobile">Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const validity = validityInfo(q.valid_until)
                const isActiveQuote = q.status === 'draft' || q.status === 'sent'
                return (
                  <tr
                    key={q.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onView(q)}
                  >
                    <td>
                      <strong>{q.quotation_number}</strong>
                      {q.revision > 1 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '0.3rem' }}>
                          v{q.revision}
                        </span>
                      )}
                      <div>
                        {q.customers?.name ?? '—'}
                        {q.customers?.code && (
                          <span className="td-muted" style={{ fontSize: '0.8rem', marginLeft: '0.3rem' }}>
                            {q.customers.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td-muted">{q.quotation_date}</td>
                    <td className="hide-mobile">
                      {q.valid_until ?? '—'}
                      {validity && isActiveQuote && (
                        <div style={{ fontSize: '0.78rem', color: validity.urgent ? '#c0392b' : 'var(--muted)' }}>
                          {validity.text}
                        </div>
                      )}
                    </td>
                    <td className="numeric-cell">
                      {formatCurrency(q.total_amount)}
                    </td>
                    <td className="hide-mobile">
                      <span className={`roll-status ${statusClass(q.status)}`}>
                        {QUOTATION_STATUS_ICONS[q.status]} {QUOTATION_STATUS_LABELS[q.status]}
                      </span>
                    </td>
                    <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                      {q.status === 'draft' && (
                        <>
                          <button
                            className="btn-icon"
                            type="button"
                            title="Sửa"
                            onClick={() => onEdit(q)}
                            style={{ marginRight: 4 }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon danger"
                            type="button"
                            title="Xóa"
                            onClick={() => handleDelete(q)}
                            disabled={deleteMutation.isPending}
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination result={result} onPageChange={setPage} />
    </div>
  )
}
