import { useState } from 'react';

import type { Employee } from '@/schema';
import { Icon } from '@/shared/components/Icon';
import { Combobox } from '@/shared/components/Combobox';
import { useConfirm } from '@/shared/components/ConfirmDialog';

import { EmployeeForm } from './EmployeeForm';
import { useEmployees, useDeactivateEmployee } from './useEmployees';

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
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Nhân sự</p>
            <h3>Quản lý nhân viên</h3>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={handleCreate}
          >
            <Icon name="Plus" size={16} />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <div className="filter-field" style={{ flex: '1 1 220px' }}>
          <label htmlFor="emp-search">Tìm kiếm</label>
          <input
            id="emp-search"
            className="field-input"
            type="text"
            placeholder="Tên, mã, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-field" style={{ flex: '0 0 180px' }}>
          <label>Vai trò</label>
          <Combobox
            options={ROLE_FILTER_OPTIONS}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Tất cả vai trò"
          />
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : !employees?.length ? (
          <p className="table-empty">Không tìm thấy nhân viên nào.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ tên</th>
                <th>SĐT</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <strong>{emp.code}</strong>
                  </td>
                  <td>{emp.name}</td>
                  <td className="td-muted">{emp.phone || '—'}</td>
                  <td>
                    <span className="roll-status in_stock">
                      {ROLE_LABELS[emp.role] ?? emp.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        emp.status === 'active'
                          ? 'roll-status in_stock'
                          : 'roll-status damaged'
                      }
                    >
                      {STATUS_LABELS[emp.status] ?? emp.status}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.4rem',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        className="btn-secondary"
                        type="button"
                        title="Sửa"
                        onClick={() => handleEdit(emp)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        <Icon name="Pencil" size={14} />
                      </button>
                      {emp.status === 'active' && (
                        <button
                          className="btn-secondary"
                          type="button"
                          title="Ngừng hoạt động"
                          onClick={() => void handleDeactivate(emp)}
                          disabled={deactivateMutation.isPending}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.8rem',
                            color: '#c0392b',
                          }}
                        >
                          <Icon name="UserX" size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deactivateMutation.error && (
        <p className="error-inline-sm">
          Lỗi: {(deactivateMutation.error as Error).message}
        </p>
      )}

      <EmployeeForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employee={selectedEmployee}
      />
    </div>
  );
}
