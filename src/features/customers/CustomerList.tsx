import { useState } from 'react';

import {
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_STATUS_LABELS,
} from '@/schema/customer.schema';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { Pagination } from '@/shared/components/Pagination';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import { Icon } from '@/shared/components/Icon';
import { Combobox } from '@/shared/components/Combobox';

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
      {/* 🏷️ Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">CRM & ĐỐI TÁC</p>
          <h3 className="title-premium">Quản lý Khách hàng</h3>
        </div>
        <button
          className="btn-primary min-h-[42px] px-6"
          type="button"
          onClick={onNew}
        >
          <Icon name="UserPlus" size={18} className="mr-2" /> Thêm khách hàng
        </button>
      </div>

      {/* 📊 KPI Dashboard area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-6 bg-surface-subtle border-b border-border">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng khách hàng</p>
              <p className="kpi-value">{result?.total ?? 0}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Users" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Cơ sở dữ liệu khách hàng
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang hoạt động</p>
              <p className="kpi-value">
                {customers.filter((c) => c.status === 'active').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Activity" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Khách hàng có giao dịch
          </div>
        </div>

        <div className="kpi-card-premium kpi-warning">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Khách hàng mới</p>
              <p className="kpi-value">+{customers.length}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Star" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Đã thêm trong kỳ
          </div>
        </div>
      </div>

      {/* 🔍 Filter Area */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="filter-field">
            <label>Tìm kiếm khách hàng</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                className="field-input"
                type="text"
                placeholder="Tên, mã, số điện thoại..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
              />
              <button type="submit" className="hidden" />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>

          <div className="filter-field">
            <label>Trạng thái</label>
            <Combobox
              options={[
                {
                  value: '',
                  label: 'Tất cả trạng thái',
                },
                {
                  value: 'active',
                  label: 'Hoạt động',
                },
                {
                  value: 'inactive',
                  label: 'Ngừng hoạt động',
                },
              ]}
              value={filters.status ?? ''}
              onChange={(val) => {
                setPage(1);
                setFilters((prev) => ({
                  ...prev,
                  status: (val as 'active' | 'inactive') || undefined,
                }));
              }}
            />
          </div>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary mt-4 text-danger border-danger/20 flex items-center gap-2"
            type="button"
            onClick={() => {
              setFilters({});
              setQueryInput('');
              setPage(1);
            }}
          >
            <Icon name="X" size={14} /> Xóa lọc nhanh
          </button>
        )}
      </div>

      {/* 📑 Data Section */}
      <div className="card-table-section min-h-[400px]">
        {error && (
          <div className="p-4">
            <p className="error-inline">Lỗi: {(error as Error).message}</p>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : customers.length === 0 ? (
          <div className="py-20">
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
                  : 'Hãy thêm khách hàng mới để quản lý thông tin.'
              }
              actionLabel={!hasFilter ? '+ Thêm khách hàng' : undefined}
              actionClick={!hasFilter ? onNew : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="data-table hidden md:table">
              <thead>
                <tr>
                  <th>Mã KH</th>
                  <th>Tên & Địa chỉ</th>
                  <th>Liên hệ</th>
                  <th>Nguồn</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-surface-subtle transition-colors"
                  >
                    <td>
                      <span className="font-bold text-primary">
                        {customer.code}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold">{customer.name}</span>
                        <span className="text-xs text-muted truncate max-w-[300px]">
                          {customer.address || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="text-sm font-medium">
                      {customer.phone ?? '—'}
                    </td>
                    <td>
                      <span className="badge-outline">
                        {CUSTOMER_SOURCE_LABELS[customer.source || 'other'] ??
                          'Khác'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${customer.status === 'active' ? 'status-active active' : 'status-inactive inactive'}`}
                      >
                        {CUSTOMER_STATUS_LABELS[customer.status]}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn-icon"
                          onClick={() => onEdit(customer)}
                          title="Sửa"
                        >
                          <Icon name="Pencil" size={16} />
                        </button>
                        <button
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(customer)}
                          disabled={deleteMutation.isPending}
                          title="Xóa"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-3">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="mobile-card"
                  onClick={() => onEdit(customer)}
                >
                  <div className="mobile-card-header border-b border-border/10 pb-2 mb-2">
                    <span className="font-bold text-primary">
                      {customer.code}
                    </span>
                    <span
                      className={`status-badge ${customer.status === 'active' ? 'active' : 'inactive'}`}
                    >
                      {CUSTOMER_STATUS_LABELS[customer.status]}
                    </span>
                  </div>
                  <div className="mobile-card-body space-y-2">
                    <p className="font-bold text-lg">{customer.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Icon name="Phone" size={14} />
                      <span>{customer.phone || '—'}</span>
                    </div>
                    {customer.address && (
                      <div className="flex items-start gap-2 text-xs text-muted">
                        <Icon name="MapPin" size={14} className="mt-0.5" />
                        <span>{customer.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/10">
                      <span className="text-[10px] uppercase font-bold text-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                        {CUSTOMER_SOURCE_LABELS[customer.source || 'other']}
                      </span>
                      <Icon
                        name="ChevronRight"
                        size={16}
                        className="text-muted"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
