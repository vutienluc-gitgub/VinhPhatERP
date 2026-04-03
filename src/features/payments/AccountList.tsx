import { useState } from 'react'

import { useConfirm } from '@/shared/components/ConfirmDialog'

import { ACCOUNT_TYPE_LABELS } from './payments.module'
import type { PaymentAccount } from './types'
import { useAllAccounts, useDeleteAccount } from './useAccounts'

type AccountListProps = {
  onEdit: (account: PaymentAccount) => void
  onNew: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function AccountList({ onEdit, onNew }: AccountListProps) {
  const { data: accounts = [], isLoading, error } = useAllAccounts()
  const deleteMutation = useDeleteAccount()
  const { confirm } = useConfirm()
  const [showInactive, setShowInactive] = useState(false)

  async function handleDelete(account: PaymentAccount) {
    const ok = await confirm({
      message: `Xóa tài khoản "${account.name}"? Chỉ xóa được nếu chưa có giao dịch liên kết.`,
      variant: 'danger',
    })
    if (!ok) return
    deleteMutation.mutate(account.id)
  }

  const filtered = showInactive ? accounts : accounts.filter((a) => a.status === 'active')

  const totalBalance = filtered.reduce((sum, a) => sum + a.current_balance, 0)

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Tài chính</p>
            <h3>Tài khoản thanh toán</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Hiện ngừng sử dụng
            </label>
            <button className="primary-button btn-standard" type="button" onClick={onNew}>
              + Thêm tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="error-inline">Lỗi tải dữ liệu: {(error as Error).message}</p>
      )}

      {/* Summary */}
      {filtered.length > 0 && (
        <div style={{ padding: '0.5rem 1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.88rem' }}>Tổng số dư tất cả tài khoản:</span>
          <strong style={{ fontSize: '1.1rem', color: totalBalance >= 0 ? '#27ae60' : '#c0392b' }}>
            {formatCurrency(totalBalance)} đ
          </strong>
        </div>
      )}

      {/* Table */}
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="table-empty">
            Chưa có tài khoản nào. Nhấn &quot;+ Thêm tài khoản&quot; để bắt đầu.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên tài khoản</th>
                <th>Loại</th>
                <th>Ngân hàng</th>
                <th className="text-right">Số dư ban đầu</th>
                <th className="text-right">Số dư hiện tại</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => (
                <tr key={account.id}>
                  <td><strong>{account.name}</strong></td>
                  <td className="td-muted">{ACCOUNT_TYPE_LABELS[account.type]}</td>
                  <td className="td-muted">
                    {account.bank_name ?? '—'}
                    {account.account_number && (
                      <div style={{ fontSize: '0.8rem' }}>{account.account_number}</div>
                    )}
                  </td>
                  <td className="numeric-cell">{formatCurrency(account.initial_balance)} đ</td>
                  <td className={account.current_balance >= 0 ? 'numeric-paid' : 'numeric-debt'}>
                    {formatCurrency(account.current_balance)} đ
                  </td>
                  <td>
                    <span className={`roll-status ${account.status === 'active' ? 'in_stock' : 'damaged'}`}>
                      {account.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button className="btn-icon" type="button" title="Sửa" onClick={() => onEdit(account)} style={{ marginRight: 4 }}>
                      ✏️
                    </button>
                    <button
                      className="btn-icon danger"
                      type="button"
                      title="Xóa"
                      onClick={() => handleDelete(account)}
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

      {deleteMutation.error && (
        <p className="error-inline-sm">Lỗi: {(deleteMutation.error as Error).message}</p>
      )}
    </div>
  )
}
