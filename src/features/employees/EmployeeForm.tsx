import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import {
  employeeFormSchema,
  employeeDefaultValues,
  type EmployeeFormValues,
  type Employee,
} from '@/schema';

import { useCreateEmployee, useUpdateEmployee } from './useEmployees';

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
            onClose();
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          ...values,
          code: '',
        }, // code is generated on server or by trigger, API requires code property but we can just pass empty or we should handle it. Wait, the API requires code: string.
        {
          onSuccess: () => {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isEditing && (
          <div className="mb-4">
            <span className="text-sm font-medium text-text-secondary">
              Mã nhân viên: <strong>{employee.code}</strong>
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Họ tên <span className="text-danger">*</span>
          </label>
          <input
            {...form.register('name')}
            className="field-input w-full"
            placeholder="Nhập họ tên"
            disabled={isPending}
          />
          {form.formState.errors.name && (
            <p className="text-danger text-sm mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Số điện thoại
          </label>
          <input
            {...form.register('phone')}
            className="field-input w-full"
            placeholder="Ví dụ: 0912345678"
            type="tel"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Vai trò <span className="text-danger">*</span>
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
          />
          {form.formState.errors.role && (
            <p className="text-danger text-sm mt-1">
              {form.formState.errors.role.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Trạng thái <span className="text-danger">*</span>
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
          />
          {form.formState.errors.status && (
            <p className="text-danger text-sm mt-1">
              {form.formState.errors.status.message}
            </p>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending}
          >
            {isPending ? 'Đang lưu...' : 'Lưu nhân viên'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
