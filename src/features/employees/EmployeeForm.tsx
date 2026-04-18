import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import {
  employeeFormSchema,
  employeeDefaultValues,
  type EmployeeFormValues,
  type Employee,
  type EmployeeRole,
} from '@/schema';
import {
  useCreateEmployee,
  useUpdateEmployee,
  useNextEmployeeCode,
  useAvailableDriverProfiles,
} from '@/application/crm';
import { linkProfileToEmployee } from '@/api';

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
  {
    value: 'driver',
    label: 'Tài xế',
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

  // State for login account link
  const [linkedProfileId, setLinkedProfileId] = useState<string | null>(null);

  const { data: availableProfiles = [], isLoading: isLoadingProfiles } =
    useAvailableDriverProfiles(employee?.id);

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

  useEffect(() => {
    if (open && availableProfiles.length > 0) {
      // Find the profile currently linked to this employee
      const currentLinked = availableProfiles.find(
        (p) => p.employee_id === employee?.id,
      );
      if (currentLinked) {
        setLinkedProfileId(currentLinked.id);
      } else {
        setLinkedProfileId(null);
      }
    } else if (!open) {
      // Reset when closed
      setLinkedProfileId(null);
    }
  }, [open, availableProfiles, employee?.id]);

  const onSubmit = async (values: EmployeeFormValues) => {
    if (isEditing) {
      updateMutation.mutate(
        {
          id: employee.id,
          data: values,
        },
        {
          onSuccess: async () => {
            if (values.role === 'driver') {
              try {
                await linkProfileToEmployee(employee.id, linkedProfileId);
              } catch (_err) {
                toast.error(
                  'Lưu hồ sơ thành công nhưng lỗi khi liên kết tài khoản',
                );
              }
            }
            toast.success('Cập nhật nhân viên thành công');
            onClose();
          },
          onError: (error) => {
            toast.error(error.message);
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
          onSuccess: async (newEmp) => {
            if (values.role === 'driver') {
              try {
                await linkProfileToEmployee(newEmp.id, linkedProfileId);
              } catch (_err) {
                toast.error(
                  'Lưu hồ sơ thành công nhưng lỗi khi liên kết tài khoản',
                );
              }
            }
            toast.success('Thêm nhân viên thành công');
            onClose();
          },
          onError: (error) => {
            toast.error(error.message || 'Có lỗi xảy ra');
          },
        },
      );
    }
  };

  const onInvalid = (errors: unknown) => {
    console.error('Form validation failed:', errors);
    toast.error('Vui lòng kiểm tra lại thông tin nhập hợp lệ');
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={isEditing ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
    >
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        {isEditing && (
          <div className="mb-4">
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
                form.setValue('role', val as EmployeeRole, {
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

        {form.watch('role') === 'driver' && (
          <div className="form-field mt-4 p-4 bg-[var(--surface-accent)] rounded-[var(--radius)]">
            <label>Tài khoản đăng nhập (Cổng tài xế)</label>
            <p className="text-[0.8rem] text-[var(--text-secondary)] mb-2">
              Liên kết hồ sơ này với một tài khoản (email) có Role = Tài xế trên
              hệ thống để họ đăng nhập vào Cổng Tài Xế.
            </p>
            <Combobox
              options={[
                {
                  label: '— Không liên kết —',
                  value: '',
                },
                ...availableProfiles.map((p) => ({
                  label: `${p.full_name} (${p.email})`,
                  value: p.id,
                })),
              ]}
              value={linkedProfileId || ''}
              onChange={(val) => setLinkedProfileId(val || null)}
              disabled={isPending || isLoadingProfiles}
              placeholder="Chọn tài khoản để liên kết..."
            />
          </div>
        )}

        <div className="modal-footer mt-6 p-0 border-none">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? 'Đang lưu...' : 'Lưu nhân viên'}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
