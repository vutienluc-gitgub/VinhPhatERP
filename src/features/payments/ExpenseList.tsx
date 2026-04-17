import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  ActionBar,
  FilterBarPremium,
  type FilterFieldConfig,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { useDeleteExpense, useExpenseList } from '@/application/payments';

import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from './payments.module';
import type { Expense, ExpenseCategory, ExpensesFilter } from './types';

type ExpenseListProps = {
  onEdit: (expense: Expense) => void;
  onNew: () => void;
};

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
  const [filters, setFilters] = useState<ExpensesFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = useExpenseList(filters, page);
  const expenses = result?.data ?? [];
  const deleteMutation = useDeleteExpense();
  const { confirm } = useConfirm();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Số phiếu, mô tả...',
    },
    {
      key: 'category',
      type: 'combobox',
      label: 'Danh mục',
      options: EXPENSE_CATEGORIES.map((c) => ({
        value: c,
        label: EXPENSE_CATEGORY_LABELS[c],
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
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
        <AddButton onClick={onNew} label="Tạo phiếu chi" />
      </div>

      {/* Filters (Config-Driven) */}
      <FilterBarPremium
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          setFilters({});
          setPage(1);
        }}
      />

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
        emptyStateIcon={hasFilter ? 'Search' : 'ReceiptText'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo phiếu chi' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Số phiếu / Ngày',
            id: 'expense_number',
            sortable: true,
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
            id: 'category',
            sortable: true,
            cell: (exp) => (
              <Badge variant={getCategoryVariant(exp.category)}>
                {EXPENSE_CATEGORY_LABELS[exp.category]}
              </Badge>
            ),
          },
          {
            header: 'Mô tả',
            id: 'description',
            sortable: true,
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
            id: 'amount',
            sortable: true,
            className: 'text-right',
            cell: (exp) => (
              <span className="font-bold text-danger">
                {formatCurrency(exp.amount)}đ
              </span>
            ),
          },
          {
            header: 'Tài khoản',
            id: 'payment_accounts',
            sortable: true,
            accessor: (exp) => exp.payment_accounts?.name,
            className: 'td-muted',
            cell: (exp) => exp.payment_accounts?.name ?? '—',
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (exp) => (
              <ActionBar
                actions={[
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(exp),
                    title: 'Sửa',
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(exp),
                    title: 'Xóa',
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
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
