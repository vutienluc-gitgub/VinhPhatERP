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

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-danger/10 text-danger border-danger/20',
  sales: 'bg-info/10 text-info border-info/20',
  warehouse: 'bg-warning/10 text-warning border-warning/20',
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

  const handleCreate = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDeactivateRequest = async (employee: Employee) => {
    const isOk = await confirm({
      title: 'Ngừng hoạt động nhân viên?',
      message: `Bạn có chắc chắn muốn vô hiệu hóa nhân viên "${employee.name}"? Nhân viên này sẽ không thể được đăng nhập hoặc chọn trong các chức năng. Có thể mở lại sau.`,
      confirmLabel: 'Ngừng hoạt động',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });

    if (isOk) {
      deactivateMutation.mutate(employee.id);
    }
  };

  if (isError) {
    return (
      <div className="p-4 text-danger">
        Đã xảy ra lỗi khi tải danh sách nhân viên.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-surface border-b border-border shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-text-primary">
          Quản lý Nhân Viên
        </h1>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={handleCreate}
        >
          <Icon name="Plus" size={20} />
          <span className="hidden sm:inline">Thêm mới</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-surface/50 border-b border-border flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Icon
              name="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Tìm theo tên, mã, SĐT..."
              className="field-input pl-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Combobox
            options={ROLE_FILTER_OPTIONS}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Tất cả vai trò"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="card-container overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-hover text-text-secondary text-sm">
                  <th className="p-3 font-medium whitespace-nowrap">Mã NV</th>
                  <th className="p-3 font-medium whitespace-nowrap">Họ Tên</th>
                  <th className="p-3 font-medium whitespace-nowrap">SĐT</th>
                  <th className="p-3 font-medium whitespace-nowrap">Vai Trò</th>
                  <th className="p-3 font-medium whitespace-nowrap">
                    Trạng Thái
                  </th>
                  <th className="p-3 font-medium text-right whitespace-nowrap">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-text-secondary"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : employees?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-text-secondary"
                    >
                      Không tìm thấy nhân viên nào.
                    </td>
                  </tr>
                ) : (
                  employees?.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-border hover:bg-surface-hover transition-colors"
                    >
                      <td className="p-3 font-medium text-text-primary whitespace-nowrap">
                        {emp.code}
                      </td>
                      <td className="p-3 text-text-primary">{emp.name}</td>
                      <td className="p-3 text-text-secondary whitespace-nowrap">
                        {emp.phone || '-'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full border ${ROLE_COLORS[emp.role] || ''}`}
                        >
                          {ROLE_LABELS[emp.role] || emp.role}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${emp.status === 'active' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-secondary'}`}
                        >
                          {STATUS_LABELS[emp.status] || emp.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-1.5 text-info hover:bg-info/10 rounded-md transition-colors"
                            onClick={() => handleEdit(emp)}
                            title="Sửa"
                          >
                            <Icon name="Pencil" size={18} />
                          </button>
                          {emp.status === 'active' && (
                            <button
                              className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors"
                              onClick={() => handleDeactivateRequest(emp)}
                              title="Ngừng hoạt động"
                            >
                              <Icon name="UserX" size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EmployeeForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employee={selectedEmployee}
      />
    </div>
  );
}
