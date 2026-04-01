import { useCallback, useState } from 'react'

import { PAYMENT_METHOD_LABELS } from './payments.module'
import { useConfirm } from '@/shared/components/ConfirmDialog'
import { Pagination } from '@/shared/components/Pagination'
import type { PaymentsFilter } from './types'
import { useDeletePayment, usePaymentList } from './usePayments'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function PaymentList() {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<PaymentsFilter>({})
  const [page, setPage] = useState(1)

  const { data: result, isLoading, error } = usePaymentList(filters, page)
  const payments = result?.data ?? []
  const deleteMutation = useDeletePayment()
  const { confirm } = useConfirm()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }))
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ message: 'Xoá phiếu thu này? Số tiền sẽ bị trừ khỏi đơn hàng.', variant: 'danger' })
    if (!ok) return
    deleteMutation.mutate(id)
  }

  const hasFilter = !!filters.search

  const onDeleteClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.id
    if (id) void handleDelete(id)
  }, [confirm, deleteMutation])

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Tài chính</p>
            <h3>Thu tiền</h3>
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
              placeholder="Số phiếu thu..."
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
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Table */}
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : payments.length === 0 ? (
          <p className="table-empty">
            {hasFilter ? 'Không tìm thấy phiếu thu phù hợp.' : 'Chưa có phiếu thu nào.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Số phiếu</th>
                <th>Đơn hàng</th>
                <th>Khách hàng</th>
                <th>Ngày thu</th>
                <th className="text-right">Số tiền</th>
                <th>Hình thức</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.payment_number}</strong></td>
                  <td className="td-muted">{p.orders?.order_number ?? '—'}</td>
                  <td>{p.customers?.name ?? '—'}</td>
                  <td className="td-muted">{p.payment_date}</td>
                  <td className="numeric-paid">
                    {formatCurrency(p.amount)} đ
                  </td>
                  <td className="td-muted">{PAYMENT_METHOD_LABELS[p.payment_method]}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      type="button"
                      data-id={p.id}
                      onClick={onDeleteClick}
                      disabled={deleteMutation.isPending}
                      style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', color: '#c0392b' }}
                    >
                      ✕
                    </button>
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

      <Pagination result={result} onPageChange={setPage} />
    </div>
  )
}
