import { useState } from 'react';

import type { Employee } from '@/schema';
import {
  Icon,
  Badge,
  DataTablePremium,
  AddButton,
  ClearFilterButton,
  ActionBar,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { useEmployees, useDeactivateEmployee } from '@/application/crm';

import { EmployeeForm } from './EmployeeForm';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  sales: 'Kinh doanh',
  warehouse: 'Kho bãi',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Ngừng hoạt động',
};

const ROLE_FILTER_OPTIONS = [
  {
    value: '',
    label: 'Tất cả vai trò',
  },
  {
    value: 'admin',
    label: 'Quản trị viên',
  },
  {
    value: 'sales',
    label: 'Kinh doanh',
  },
  {
    value: 'warehouse',
    label: 'Kho bãi',
  },
];

export function EmployeeListPage() {
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const {
    data: employees,
    isLoading,
    isError,
  } = useEmployees({
    role: roleFilter || undefined,
    query: search || undefined,
  });

  const deactivateMutation = useDeactivateEmployee();
  const { confirm } = useConfirm();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  function handleCreate() {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  }

  function handleEdit(employee: Employee) {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  }

  async function handleDeactivate(employee: Employee) {
    const ok = await confirm({
      title: 'Ngừng hoạt động nhân viên?',
      message: `Bạn có chắc chắn muốn vô hiệu hóa nhân viên "${employee.name}"? Có thể mở lại sau.`,
      confirmLabel: 'Ngừng hoạt động',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (ok) deactivateMutation.mutate(employee.id);
  }

  if (isError) {
    return (
      <div className="panel-card">
        <p className="error-inline">
          Đã xảy ra lỗi khi tải danh sách nhân viên.
        </p>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush">
      {/* 🏷️ Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">NHÂN SỰ</p>
          <h3 className="title-premium">Quản lý nhân viên</h3>
        </div>
        <AddButton onClick={handleCreate} label="Thêm mới" />
      </div>

      {/* 📊 KPI Dashboard area */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng nhân viên</p>
              <p className="kpi-value">{employees?.length ?? 0}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Users" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Thuộc các phòng ban
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang hoạt động</p>
              <p className="kpi-value">
                {employees?.filter((e) => e.status === 'active').length ?? 0}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Activity" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Người dùng kích hoạt
          </div>
        </div>

        <div className="kpi-card-premium kpi-warning">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Kinh doanh (Sales)</p>
              <p className="kpi-value">
                {employees?.filter((e) => e.role === 'sales').length ?? 0}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Briefcase" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Nhân viên kinh doanh
          </div>
        </div>
      </div>

      {/* 🔍 Filter Area */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="emp-search">Tìm kiếm</label>
            <div className="search-input-wrapper">
              <input
                id="emp-search"
                className="field-input"
                type="text"
                placeholder="Tên, mã, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Icon name="Search" size={16} className="search-input-icon" />
            </div>
          </div>
          <div className="filter-field">
            <label>Vai trò</label>
            <Combobox
              options={ROLE_FILTER_OPTIONS}
              value={roleFilter}
              onChange={setRoleFilter}
            />
          </div>
          {(search || roleFilter) && (
            <ClearFilterButton
              onClick={() => {
                setSearch('');
                setRoleFilter('');
              }}
            />
          )}
        </div>
      </div>

      {/* 📑 Data Table / Cards */}
      <DataTablePremium
        data={employees ?? []}
        isLoading={isLoading}
        rowKey={(e) => e.id}
        onRowClick={handleEdit}
        emptyStateTitle={
          search || roleFilter
            ? 'Không tìm thấy nhân viên'
            : 'Chưa có dữ liệu nhân viên'
        }
        emptyStateDescription={
          search || roleFilter
            ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
            : 'Hãy thêm nhân viên mới để bắt đầu quản lý.'
        }
        emptyStateIcon={search || roleFilter ? 'Search' : 'Users'}
        emptyStateActionLabel={
          !(search || roleFilter) ? '+ Thêm nhân viên' : undefined
        }
        onEmptyStateAction={!(search || roleFilter) ? handleCreate : undefined}
        columns={[
          {
            header: 'Mã NV',
            cell: (emp) => (
              <span className="font-bold text-primary">{emp.code}</span>
            ),
          },
          {
            header: 'Họ tên',
            cell: (emp) => <span className="font-bold">{emp.name}</span>,
          },
          {
            header: 'SĐT',
            className: 'text-sm font-medium',
            cell: (emp) => emp.phone || '—',
          },
          {
            header: 'Vai trò',
            cell: (emp) => (
              <span className="badge-outline">
                {ROLE_LABELS[emp.role] ?? emp.role}
              </span>
            ),
          },
          {
            header: 'Trạng thái',
            cell: (emp) => (
              <Badge variant={emp.status === 'active' ? 'success' : 'gray'}>
                {STATUS_LABELS[emp.status] ?? emp.status}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (emp) => (
              <ActionBar
                actions={
                  [
                    {
                      icon: 'Pencil',
                      onClick: () => handleEdit(emp),
                      title: 'Sửa',
                    },
                    emp.status === 'active'
                      ? {
                          icon: 'UserX',
                          onClick: () => void handleDeactivate(emp),
                          title: 'Ngừng hoạt động',
                          variant: 'danger',
                          disabled: deactivateMutation.isPending,
                        }
                      : null,
                  ].filter(Boolean) as ActionConfig[]
                }
              />
            ),
          },
        ]}
        renderMobileCard={(emp) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{emp.code}</span>
              <Badge variant={emp.status === 'active' ? 'success' : 'gray'}>
                {STATUS_LABELS[emp.status] ?? emp.status}
              </Badge>
            </div>
            <div className="mobile-card-body">
              <p className="font-bold text-lg">{emp.name}</p>
              <div className="mobile-card-row">
                <span className="label">Liên hệ:</span>
                <span className="value">{emp.phone || '—'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/10">
                <span className="text-[10px] uppercase font-bold text-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                  {ROLE_LABELS[emp.role] ?? emp.role}
                </span>
              </div>
            </div>
          </div>
        )}
      />

      <EmployeeForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employee={selectedEmployee}
      />
    </div>
  );
}
