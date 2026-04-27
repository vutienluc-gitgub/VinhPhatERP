import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  DataTablePremium,
  AddButton,
  ActionBar,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { useAllAccounts, useDeleteAccount } from '@/application/payments';
import { sumBy } from '@/shared/utils/array.util';

import { ACCOUNT_TYPE_LABELS } from './payments.module';
import type { PaymentAccount } from './types';

type AccountListProps = {
  onEdit: (account: PaymentAccount) => void;
  onNew: () => void;
};

export function AccountList({ onEdit, onNew }: AccountListProps) {
  const { data: accounts = [], isLoading, error } = useAllAccounts();
  const deleteMutation = useDeleteAccount();
  const { confirm } = useConfirm();
  const [showInactive, setShowInactive] = useState(false);

  async function handleDelete(account: PaymentAccount) {
    const ok = await confirm({
      message: `Xóa tài khoản "${account.name}"? Chỉ xóa được nếu chưa có giao dịch liên kết.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(account.id);
  }

  const filtered = showInactive
    ? accounts
    : accounts.filter((a) => a.status === 'active');

  const totalBalance = sumBy(filtered, (a) => a.current_balance);

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <span className="font-bold text-lg">Tài Khoản Thanh Toán</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Hiện ngừng dùng
          </label>
          <AddButton onClick={onNew} label="Thêm tài khoản" />
        </div>
      </div>

      {/* KPI - Total Balance */}
      {filtered.length > 0 && (
        <div className="kpi-section kpi-grid">
          <div
            className={`kpi-card-premium ${totalBalance >= 0 ? 'kpi-success' : 'kpi-danger'}`}
          >
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Tổng số dư tất cả tài khoản</p>
                <p className="kpi-value">{formatCurrency(totalBalance)}đ</p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Wallet" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              {filtered.length} tài khoản đang theo dõi
            </div>
          </div>

          <div className="kpi-card-premium kpi-primary">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Tài khoản hoạt động</p>
                <p className="kpi-value">
                  {accounts.filter((a) => a.status === 'active').length}
                </p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="CreditCard" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Đang sử dụng
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={filtered}
        isLoading={isLoading}
        rowKey={(acc) => acc.id}
        onRowClick={(acc) => onEdit(acc)}
        emptyStateTitle="Chưa có tài khoản nào"
        emptyStateDescription='Nhấn "+ Thêm tài khoản" để bắt đầu quản lý quỹ tiền mặt và ngân hàng.'
        emptyStateIcon="CreditCard"
        emptyStateActionLabel="+ Thêm tài khoản"
        onEmptyStateAction={onNew}
        columns={[
          {
            header: 'Tên tài khoản',
            cell: (acc) => (
              <div className="flex flex-col">
                <span className="font-bold text-primary">{acc.name}</span>
                <span className="text-xs text-muted">
                  {ACCOUNT_TYPE_LABELS[acc.type]}
                </span>
              </div>
            ),
          },
          {
            header: 'Ngân hàng / Số TK',
            cell: (acc) => (
              <div className="flex flex-col">
                <span className="font-medium">{acc.bank_name ?? '—'}</span>
                {acc.account_number && (
                  <span className="text-xs text-muted">
                    {acc.account_number}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: 'Số dư ban đầu',
            className: 'text-right',
            cell: (acc) => (
              <span className="font-medium">
                {formatCurrency(acc.initial_balance)}đ
              </span>
            ),
          },
          {
            header: 'Số dư hiện tại',
            className: 'text-right',
            cell: (acc) => (
              <span
                className={`font-bold ${acc.current_balance >= 0 ? 'text-success' : 'text-danger'}`}
              >
                {formatCurrency(acc.current_balance)}đ
              </span>
            ),
          },
          {
            header: 'Trạng thái',
            cell: (acc) => (
              <Badge variant={acc.status === 'active' ? 'success' : 'gray'}>
                {acc.status === 'active' ? 'Hoạt động' : 'Ngừng'}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (acc) => (
              <ActionBar
                actions={[
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(acc),
                    title: 'Sửa',
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(acc),
                    title: 'Xóa',
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            ),
          },
        ]}
        renderMobileCard={(acc) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <div className="flex flex-col">
                <span className="mobile-card-title">{acc.name}</span>
                <span className="text-xs text-muted">
                  {ACCOUNT_TYPE_LABELS[acc.type]}
                </span>
              </div>
              <Badge variant={acc.status === 'active' ? 'success' : 'gray'}>
                {acc.status === 'active' ? 'Hoạt động' : 'Ngừng'}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Số dư ban đầu</span>
                  <span className="font-medium">
                    {formatCurrency(acc.initial_balance)}đ
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">Số dư hiện tại</span>
                  <span
                    className={`font-bold ${acc.current_balance >= 0 ? 'text-success' : 'text-danger'}`}
                  >
                    {formatCurrency(acc.current_balance)}đ
                  </span>
                </div>
              </div>
              {(acc.bank_name ?? acc.account_number) && (
                <div className="text-xs text-muted">
                  {acc.bank_name}
                  {acc.account_number ? ` · ${acc.account_number}` : ''}
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-border/10">
                <button
                  className="btn-secondary flex-1 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(acc);
                  }}
                >
                  <Icon name="Pencil" size={16} /> Sửa
                </button>
                <button
                  className="btn-secondary text-danger border-danger/20 px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(acc);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {deleteMutation.error && (
        <p className="error-inline-sm">
          Lỗi: {(deleteMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
