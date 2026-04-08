import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';

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

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as ExpenseCategory | '';
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      category: val || undefined,
    }));
  }

  async function handleDelete(expense: Expense) {
    const ok = await confirm({
      message: `Xoá phiếu chi "${expense.expense_number}"? Số dư tài khoản sẽ được cập nhật lại.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(expense.id);
  }

  const hasFilter = !!(filters.search || filters.category);

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Tài chính</p>
            <h3>Phiếu chi</h3>
          </div>
          <button
            className="primary-button btn-standard"
            type="button"
            onClick={onNew}
          >
            + Tạo phiếu chi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <form
          className="filter-field"
          onSubmit={handleSearch}
          style={{ flex: '1 1 220px' }}
        >
          <label htmlFor="filter-expense-search">Tìm kiếm</label>
          <div className="flex-controls">
            <input
              id="filter-expense-search"
              className="field-input"
              type="text"
              placeholder="Số phiếu, mô tả..."
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
          <label htmlFor="filter-expense-category">Danh mục</label>
          <select
            id="filter-expense-category"
            className="field-select"
            value={filters.category ?? ''}
            onChange={handleCategoryChange}
          >
            <option value="">Tất cả</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setSearchInput('');
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
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : expenses.length === 0 ? (
          <p className="table-empty">
            {hasFilter
              ? 'Không tìm thấy phiếu chi phù hợp.'
              : 'Chưa có phiếu chi nào. Nhấn "+ Tạo phiếu chi" để bắt đầu.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Số phiếu</th>
                <th>Ngày chi</th>
                <th>Danh mục</th>
                <th>Mô tả</th>
                <th className="text-right">Số tiền</th>
                <th>Tài khoản</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <strong>{exp.expense_number}</strong>
                  </td>
                  <td className="td-muted">{exp.expense_date}</td>
                  <td>
                    <span
                      className="roll-status in_stock"
                      style={{ fontSize: '0.78rem' }}
                    >
                      {EXPENSE_CATEGORY_LABELS[exp.category]}
                    </span>
                  </td>
                  <td>
                    {exp.description}
                    {exp.suppliers?.name && (
                      <div className="td-muted" style={{ fontSize: '0.8rem' }}>
                        NCC: {exp.suppliers.name}
                      </div>
                    )}
                  </td>
                  <td className="numeric-debt">
                    {formatCurrency(exp.amount)} đ
                  </td>
                  <td className="td-muted">
                    {exp.payment_accounts?.name ?? '—'}
                  </td>
                  <td className="td-actions">
                    <button
                      className="btn-icon"
                      type="button"
                      title="Sửa"
                      onClick={() => onEdit(exp)}
                      style={{ marginRight: 4 }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon danger"
                      type="button"
                      title="Xóa"
                      onClick={() => handleDelete(exp)}
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
        <p className="error-inline-sm">
          Lỗi: {(deleteMutation.error as Error).message}
        </p>
      )}

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
