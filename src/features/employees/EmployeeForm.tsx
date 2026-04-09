import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import {
  employeeFormSchema,
  employeeDefaultValues,
  type EmployeeFormValues,
  type Employee,
} from '@/schema';

import {
  useCreateEmployee,
  useUpdateEmployee,
  useNextEmployeeCode,
} from './useEmployees';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

const ROLE_OPTIONS = [
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

const STATUS_OPTIONS = [
  {
    value: 'active',
    label: 'Hoạt động',
  },
  {
    value: 'inactive',
    label: 'Ngừng hoạt động',
  },
];

export function EmployeeForm({ open, onClose, employee }: EmployeeFormProps) {
  const isEditing = !!employee;
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const { data: nextCode } = useNextEmployeeCode();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: employeeDefaultValues,
  });

  useEffect(() => {
    if (open) {
      if (employee) {
        form.reset({
          name: employee.name,
          phone: employee.phone || '',
          role: employee.role,
          status: employee.status,
        });
      } else {
        form.reset(employeeDefaultValues);
      }
    }
  }, [open, employee, form]);

  const onSubmit = (values: EmployeeFormValues) => {
    if (isEditing) {
      updateMutation.mutate(
        {
          id: employee.id,
          data: values,
        },
        {
          onSuccess: () => {
            toast.success('Cập nhật nhân viên thành công');
            onClose();
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          ...values,
          code: nextCode ?? '',
        },
        {
          onSuccess: () => {
            toast.success('Thêm nhân viên thành công');
            onClose();
          },
        },
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={isEditing ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {isEditing && (
          <div style={{ marginBottom: '1rem' }}>
            <span className="td-muted">
              Mã nhân viên: <strong>{employee.code}</strong>
            </span>
          </div>
        )}

        <div className="form-grid">
          <div className="form-field">
            <label>
              Họ tên <span className="field-required">*</span>
            </label>
            <input
              {...form.register('name')}
              className={`field-input${form.formState.errors.name ? ' is-error' : ''}`}
              placeholder="Nhập họ tên"
              disabled={isPending}
            />
            {form.formState.errors.name && (
              <p className="field-error">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label>Số điện thoại</label>
            <input
              {...form.register('phone')}
              className="field-input"
              placeholder="Ví dụ: 0912345678"
              type="tel"
              disabled={isPending}
              onKeyDown={(e) => {
                const allowedKeys = [
                  'Backspace',
                  'Delete',
                  'ArrowLeft',
                  'ArrowRight',
                  'Tab',
                  'Home',
                  'End',
                  'Enter',
                  'Escape',
                ];
                if (
                  !allowedKeys.includes(e.key) &&
                  !e.ctrlKey &&
                  !e.metaKey &&
                  !/^[0-9\s\-().+]$/.test(e.key)
                ) {
                  e.preventDefault();
                }
              }}
            />
            {form.formState.errors.phone && (
              <p className="field-error">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label>
              Vai trò <span className="field-required">*</span>
            </label>
            <Combobox
              options={ROLE_OPTIONS}
              value={form.watch('role')}
              onChange={(val) =>
                form.setValue('role', val as 'admin' | 'warehouse' | 'sales', {
                  shouldValidate: true,
                })
              }
              disabled={isPending}
              hasError={!!form.formState.errors.role}
            />
            {form.formState.errors.role && (
              <p className="field-error">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label>
              Trạng thái <span className="field-required">*</span>
            </label>
            <Combobox
              options={STATUS_OPTIONS}
              value={form.watch('status')}
              onChange={(val) =>
                form.setValue('status', val as 'active' | 'inactive', {
                  shouldValidate: true,
                })
              }
              disabled={isPending}
              hasError={!!form.formState.errors.status}
            />
            {form.formState.errors.status && (
              <p className="field-error">
                {form.formState.errors.status.message}
              </p>
            )}
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="primary-button btn-standard"
            disabled={isPending}
          >
            {isPending ? 'Đang lưu...' : 'Lưu nhân viên'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
