import { useState } from 'react';

import {
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_STATUS_LABELS,
} from '@/schema/customer.schema';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { Pagination } from '@/shared/components/Pagination';
import { TableSkeleton } from '@/shared/components/TableSkeleton';

import type { Customer, CustomersFilter } from './types';
import { useCustomerList, useDeleteCustomer } from './useCustomers';

type CustomerListProps = {
  onEdit: (customer: Customer) => void;
  onNew: () => void;
};

export function CustomerList({ onEdit, onNew }: CustomerListProps) {
  const [queryInput, setQueryInput] = useState('');
  const [filters, setFilters] = useState<CustomersFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = useCustomerList(filters, page);
  const customers = result?.data ?? [];
  const deleteMutation = useDeleteCustomer();
  const { confirm } = useConfirm();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      query: queryInput.trim() || undefined,
    }));
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as 'active' | 'inactive' | '';
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      status: val || undefined,
    }));
  }

  async function handleDelete(customer: Customer) {
    const ok = await confirm({
      message: `Xóa khách hàng "${customer.name}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(customer.id);
  }

  const hasFilter = !!(filters.query || filters.status);

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Danh mục</p>
            <h3>Khách hàng</h3>
          </div>
          <button
            className="primary-button btn-standard"
            type="button"
            onClick={onNew}
          >
            + Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="filter-bar card-filter-section">
        <form
          className="filter-field"
          onSubmit={handleSearch}
          style={{ flex: '1 1 220px' }}
        >
          <label htmlFor="filter-query">Tìm kiếm</label>
          <div className="flex-controls">
            <input
              id="filter-query"
              className="field-input"
              type="text"
              placeholder="Tên, mã, số điện thoại..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
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
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setQueryInput('');
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Lỗi */}
      {error && (
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Bảng */}
      <div
        className="data-table-wrap card-table-section"
        style={
          isLoading || customers.length === 0 ? { border: 'none' } : undefined
        }
      >
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={hasFilter ? '🔍' : '👥'}
            title={
              hasFilter
                ? 'Không tìm thấy khách hàng'
                : 'Chưa có thông tin khách hàng'
            }
            description={
              hasFilter
                ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
                : 'Nhấn nút thêm khách hàng mới để quản lý thông tin liên hệ và công nợ.'
            }
            actionLabel={!hasFilter ? '+ Thêm khách hàng' : undefined}
            actionClick={!hasFilter ? onNew : undefined}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Tên khách hàng</th>
                <th>Số điện thoại</th>
                <th>Nguồn</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.code}</strong>
                  </td>
                  <td>
                    {customer.name}
                    {customer.address && (
                      <div className="td-muted" style={{ fontSize: '0.8rem' }}>
                        {customer.address}
                      </div>
                    )}
                  </td>
                  <td className="td-muted">{customer.phone ?? '—'}</td>
                  <td>
                    <span
                      className="roll-status in_stock"
                      style={{ fontSize: '0.78rem' }}
                    >
                      {CUSTOMER_SOURCE_LABELS[customer.source || 'other'] ??
                        'Khác'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`roll-status ${customer.status === 'active' ? 'in_stock' : 'damaged'}`}
                    >
                      {CUSTOMER_STATUS_LABELS[customer.status]}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button
                      className="btn-icon"
                      type="button"
                      title="Sửa"
                      onClick={() => onEdit(customer)}
                      style={{ marginRight: 4 }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon danger"
                      type="button"
                      title="Xóa"
                      onClick={() => handleDelete(customer)}
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
  );
}
