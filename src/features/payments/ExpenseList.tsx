import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
} from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';

import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from './payments.module';
import type { Expense, ExpenseCategory, ExpensesFilter } from './types';
import { useDeleteExpense, useExpenseList } from './useExpenses';

type ExpenseListProps = {
  onEdit: (expense: Expense) => void;
  onNew: () => void;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function getCategoryVariant(category: ExpenseCategory): BadgeVariant {
  switch (category) {
    case 'salary':
      return 'info';
    case 'yarn_purchase':
    case 'weaving_cost':
    case 'dyeing_cost':
      return 'warning';
    case 'logistics':
      return 'purple';
    case 'supplier_payment':
    case 'equipment':
      return 'danger';
    default:
      return 'gray';
  }
}

export function ExpenseList({ onEdit, onNew }: ExpenseListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<ExpensesFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = useExpenseList(filters, page);
  const expenses = result?.data ?? [];
  const deleteMutation = useDeleteExpense();
  const { confirm } = useConfirm();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  async function handleDelete(expense: Expense) {
    const ok = await confirm({
      message: `Xoà phiếu chi "${expense.expense_number}"? Số dư tài khoản sẽ được cập nhật lại.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(expense.id);
  }

  const hasFilter = !!(filters.search || filters.category);

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">TÀI CHÍNH</p>
          <h3 className="title-premium">Phiếu Chi</h3>
        </div>
        <button
          className="btn-primary min-h-[42px] px-6"
          type="button"
          onClick={onNew}
        >
          <Icon name="Plus" size={18} className="mr-2" /> Tạo phiếu chi
        </button>
      </div>

      {/* Filters */}
      <div className="card-filter-section p-4 border-b border-border">
        <div className="filter-grid-premium">
          <div className="filter-field">
            <label htmlFor="filter-expense-search">Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                id="filter-expense-search"
                className="field-input"
                type="text"
                placeholder="Số phiếu, mô tả..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="hidden" />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>

          <div className="filter-field">
            <label>Danh mục</label>
            <Combobox
              options={[
                {
                  value: '',
                  label: 'Tất cả danh mục',
                },
                ...EXPENSE_CATEGORIES.map((c) => ({
                  value: c,
                  label: EXPENSE_CATEGORY_LABELS[c],
                })),
              ]}
              value={filters.category ?? ''}
              onChange={(val) => {
                setPage(1);
                setFilters((prev) => ({
                  ...prev,
                  category: (val as ExpenseCategory) || undefined,
                }));
              }}
            />
          </div>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary text-danger border-danger/20 flex items-center gap-2"
            type="button"
            onClick={() => {
              setFilters({});
              setSearchInput('');
            }}
            style={{ marginTop: '1rem' }}
          >
            <Icon name="X" size={14} /> Xóa lọc
          </button>
        )}
      </div>

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
        data={expenses}
        isLoading={isLoading}
        rowKey={(exp) => exp.id}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy phiếu chi' : 'Chưa có phiếu chi nào'
        }
        emptyStateDescription={
          hasFilter
            ? 'Thử điều chỉnh bộ lọc.'
            : 'Nhấn "Tạo phiếu chi" để bắt đầu ghi nhận chi phí.'
        }
        emptyStateIcon={hasFilter ? '🔍' : 'ReceiptText'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo phiếu chi' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Số phiếu / Ngày',
            cell: (exp) => (
              <div className="flex flex-col">
                <span className="font-bold text-primary">
                  {exp.expense_number}
                </span>
                <span className="text-xs text-muted">{exp.expense_date}</span>
              </div>
            ),
          },
          {
            header: 'Danh mục',
            cell: (exp) => (
              <Badge variant={getCategoryVariant(exp.category)}>
                {EXPENSE_CATEGORY_LABELS[exp.category]}
              </Badge>
            ),
          },
          {
            header: 'Mô tả',
            cell: (exp) => (
              <div className="flex flex-col">
                <span>{exp.description}</span>
                {exp.suppliers?.name && (
                  <span className="text-xs text-muted">
                    NCC: {exp.suppliers.name}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: 'Số tiền',
            className: 'text-right',
            cell: (exp) => (
              <span className="font-bold text-danger">
                {formatCurrency(exp.amount)}đ
              </span>
            ),
          },
          {
            header: 'Tài khoản',
            className: 'td-muted',
            cell: (exp) => exp.payment_accounts?.name ?? '—',
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (exp) => (
              <div className="flex justify-end gap-1">
                <button
                  className="btn-icon"
                  type="button"
                  onClick={() => onEdit(exp)}
                  title="Sửa"
                >
                  <Icon name="Pencil" size={16} />
                </button>
                <button
                  className="btn-icon text-danger hover:bg-danger/10"
                  type="button"
                  onClick={() => handleDelete(exp)}
                  disabled={deleteMutation.isPending}
                  title="Xóa"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            ),
          },
        ]}
        renderMobileCard={(exp) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <div className="flex flex-col">
                <span className="mobile-card-title">{exp.expense_number}</span>
                <span className="text-xs text-muted">{exp.expense_date}</span>
              </div>
              <span className="font-bold text-danger text-lg">
                {formatCurrency(exp.amount)}đ
              </span>
            </div>
            <div className="mobile-card-body space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={getCategoryVariant(exp.category)}>
                  {EXPENSE_CATEGORY_LABELS[exp.category]}
                </Badge>
                {exp.suppliers?.name && (
                  <span className="text-xs text-muted">
                    {exp.suppliers.name}
                  </span>
                )}
              </div>
              {exp.description && (
                <p className="text-sm text-muted">{exp.description}</p>
              )}
              <div className="text-xs text-muted">
                Tài khoản: {exp.payment_accounts?.name ?? '—'}
              </div>
              <div className="flex gap-2 pt-2 border-t border-border/10">
                <button
                  className="btn-secondary flex-1 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(exp);
                  }}
                >
                  <Icon name="Pencil" size={16} /> Sửa
                </button>
                <button
                  className="btn-secondary flex-1 text-danger border-danger/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(exp);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Icon name="Trash2" size={16} /> Xóa
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

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
