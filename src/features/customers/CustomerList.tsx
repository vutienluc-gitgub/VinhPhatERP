import { useState } from 'react';

import {
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_STATUS_LABELS,
} from '@/schema/customer.schema';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  DataTablePremium,
  AddButton,
  ClearFilterButton,
  ActionBar,
} from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { useCustomerList, useDeleteCustomer } from '@/application/crm';

import type { Customer, CustomersFilter } from './types';

type CustomerListProps = {
  onEdit: (customer: Customer) => void;
  onNew: () => void;
};

export function CustomerList({ onEdit, onNew }: CustomerListProps) {
  const [queryInput, setQueryInput] = useState('');
  const [filters, setFilters] = useState<CustomersFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useCustomerList(filters, page);
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
        <AddButton onClick={onNew} label="Thêm khách hàng" icon="UserPlus" />
      </div>

      {/* 📊 KPI Dashboard area */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
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
        <div className="filter-compact-premium">
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
          <ClearFilterButton
            onClick={() => {
              setFilters({});
              setQueryInput('');
              setPage(1);
            }}
            label="Xóa lọc nhanh"
          />
        )}
      </div>

      {/* 📑 Data Section */}
      <DataTablePremium
        data={customers}
        isLoading={isLoading}
        rowKey={(c) => c.id}
        onRowClick={onEdit}
        emptyStateTitle={
          hasFilter
            ? 'Không tìm thấy khách hàng'
            : 'Chưa có thông tin khách hàng'
        }
        emptyStateDescription={
          hasFilter
            ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
            : 'Hãy thêm khách hàng mới để quản lý thông tin.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Users'}
        emptyStateActionLabel={!hasFilter ? '+ Thêm khách hàng' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Mã KH',
            cell: (c) => (
              <span className="font-bold text-primary">{c.code}</span>
            ),
          },
          {
            header: 'Tên & Địa chỉ',
            cell: (c) => (
              <div className="flex flex-col">
                <span className="font-bold">{c.name}</span>
                <span className="text-xs text-muted truncate max-w-[300px]">
                  {c.address || '—'}
                </span>
              </div>
            ),
          },
          {
            header: 'Liên hệ',
            className: 'text-sm font-medium',
            cell: (c) => c.phone ?? '—',
          },
          {
            header: 'Nguồn',
            cell: (c) => (
              <span className="badge-outline">
                {CUSTOMER_SOURCE_LABELS[c.source || 'other'] ?? 'Khác'}
              </span>
            ),
          },
          {
            header: 'Trạng thái',
            cell: (c) => (
              <Badge variant={c.status === 'active' ? 'success' : 'gray'}>
                {CUSTOMER_STATUS_LABELS[c.status]}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (c) => (
              <ActionBar
                actions={[
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(c),
                    title: 'Sửa',
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(c),
                    title: 'Xóa',
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            ),
          },
        ]}
        renderMobileCard={(customer) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{customer.code}</span>
              <Badge
                variant={customer.status === 'active' ? 'success' : 'gray'}
              >
                {CUSTOMER_STATUS_LABELS[customer.status]}
              </Badge>
            </div>
            <div className="mobile-card-body">
              <p className="font-bold text-lg">{customer.name}</p>
              <div className="mobile-card-row">
                <span className="label">Liên hệ:</span>
                <span className="value">{customer.phone || '—'}</span>
              </div>
              {customer.address && (
                <div className="mobile-card-row">
                  <span className="label">Địa chỉ:</span>
                  <span className="value truncate ml-4 italic">
                    {customer.address}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/10">
                <span className="text-[10px] uppercase font-bold text-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                  {CUSTOMER_SOURCE_LABELS[customer.source || 'other']}
                </span>
                <Icon name="ChevronRight" size={16} className="text-muted" />
              </div>
            </div>
          </div>
        )}
      />

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
