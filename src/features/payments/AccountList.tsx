import { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  DataTableAdvanced,
  AddButton,
  KpiCard,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { useAllAccounts, useDeleteAccount } from '@/application/payments';
import { sumBy } from '@/shared/utils/array.util';

import { ACCOUNT_TYPE_LABELS } from './payments.module';
import { ACCOUNT_STATUS_LABELS } from './payments.constants';
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
  const activeCount = accounts.filter((a) => a.status === 'active').length;

  const columns = useMemo<ColumnDef<PaymentAccount>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Tên tài khoản',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-primary">{row.original.name}</span>
            <span className="text-xs text-muted">
              {ACCOUNT_TYPE_LABELS[row.original.type]}
            </span>
          </div>
        ),
      },
      {
        id: 'bank_info',
        header: 'Ngân hàng / Số TK',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.bank_name ?? '—'}</span>
            {row.original.account_number && (
              <span className="text-xs text-muted">
                {row.original.account_number}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'initial_balance',
        header: 'Số dư ban đầu',
        meta: { className: 'text-right' },
        cell: ({ getValue }) => (
          <span className="font-medium">
            {formatCurrency(getValue<number>())}đ
          </span>
        ),
      },
      {
        accessorKey: 'current_balance',
        header: 'Số dư hiện tại',
        meta: { className: 'text-right' },
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <span
              className={`font-bold ${v >= 0 ? 'text-success' : 'text-danger'}`}
            >
              {formatCurrency(v)}đ
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ getValue }) => {
          const s = getValue<string>() as 'active' | 'inactive';
          return (
            <Badge variant={s === 'active' ? 'success' : 'gray'}>
              {ACCOUNT_STATUS_LABELS[s]}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        meta: { className: 'text-right' },
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn-icon"
              title="Sửa"
              onClick={() => onEdit(row.original)}
            >
              <Icon name="Pencil" size={16} />
            </button>
            <button
              className="btn-icon text-danger hover:bg-danger/10"
              title="Xóa"
              disabled={deleteMutation.isPending}
              onClick={() => handleDelete(row.original)}
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation.isPending],
  );

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

      {/* KPI */}
      <div className="kpi-section kpi-grid">
        <KpiCard
          label="Tổng số dư tất cả tài khoản"
          value={totalBalance}
          formatMode="currency"
          icon="Wallet"
          variant={totalBalance >= 0 ? 'success' : 'danger'}
          footer={`${filtered.length} tài khoản đang theo dõi`}
          isLoading={isLoading}
        />
        <KpiCard
          label="Tài khoản hoạt động"
          value={activeCount}
          icon="CreditCard"
          variant="primary"
          footer="Đang sử dụng"
          isLoading={isLoading}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu:{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="p-4">
        <DataTableAdvanced
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          skeletonRows={5}
          rowKey={(acc) => acc.id}
          onRowClick={onEdit}
          exportFileName="tai-khoan-thanh-toan"
          emptyStateTitle="Chưa có tài khoản nào"
          emptyStateDescription='Nhấn "+ Thêm tài khoản" để bắt đầu quản lý quỹ tiền mặt và ngân hàng.'
          emptyStateIcon="CreditCard"
          emptyStateActionLabel="+ Thêm tài khoản"
          onEmptyStateAction={onNew}
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
                  {ACCOUNT_STATUS_LABELS[acc.status as 'active' | 'inactive']}
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
      </div>

      {deleteMutation.error && (
        <p className="error-inline-sm px-4 pb-4">
          Lỗi:{' '}
          {deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : String(deleteMutation.error)}
        </p>
      )}
    </div>
  );
}
