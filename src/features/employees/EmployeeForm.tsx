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
  useCompanyRoles,
} from '@/application/crm';
import { linkProfileToEmployee } from '@/api';

import { EMPLOYEE_LABELS, EMPLOYEE_MESSAGES } from './employees.constants';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

const STATUS_OPTIONS = [
  {
    value: 'active',
    label: EMPLOYEE_LABELS.STATUS_ACTIVE,
  },
  {
    value: 'inactive',
    label: EMPLOYEE_LABELS.STATUS_INACTIVE,
  },
];

export function EmployeeForm({ open, onClose, employee }: EmployeeFormProps) {
  const isEditing = !!employee;
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const { data: nextCode } = useNextEmployeeCode();
  const { data: rolesData, isLoading: isLoadingRoles } = useCompanyRoles();

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
          email: employee.email || '',
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
                toast.error(EMPLOYEE_MESSAGES.FORM_LINK_WARN);
              }
            }
            toast.success(EMPLOYEE_MESSAGES.FORM_UPDATE_SUCCESS);
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
                toast.error(EMPLOYEE_MESSAGES.FORM_LINK_WARN);
              }
            }
            toast.success(EMPLOYEE_MESSAGES.FORM_ADD_SUCCESS);
            onClose();
          },
          onError: (error) => {
            toast.error(error.message || EMPLOYEE_MESSAGES.FORM_ERROR);
          },
        },
      );
    }
  };

  const onInvalid = (errors: unknown) => {
    console.error('Form validation failed:', errors);
    toast.error(EMPLOYEE_MESSAGES.FORM_INVALID);
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || isLoadingRoles;

  const roleOptions =
    rolesData?.map((r) => ({
      value: r.code,
      label: r.name,
    })) || [];

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? EMPLOYEE_LABELS.FORM_EDIT_TITLE
          : EMPLOYEE_LABELS.FORM_ADD_TITLE
      }
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            {EMPLOYEE_LABELS.BTN_CANCEL}
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="employee-form"
            isLoading={isPending}
          >
            {EMPLOYEE_LABELS.BTN_SAVE}
          </Button>
        </>
      }
    >
      <form
        id="employee-form"
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      >
        {isEditing && (
          <div className="mb-4">
            <span className="text-muted text-sm">
              Mã nhân viên: <strong>{employee.code}</strong>
            </span>
          </div>
        )}

        <div className="form-grid">
          <div className="form-field">
            <label>
              {EMPLOYEE_LABELS.TABLE_NAME}{' '}
              <span className="field-required">*</span>
            </label>
            <input
              {...form.register('name')}
              className={`field-input${form.formState.errors.name ? ' border-danger' : ''}`}
              placeholder={EMPLOYEE_LABELS.FORM_NAME_PLACEHOLDER}
              disabled={isPending}
            />
            {form.formState.errors.name && (
              <p className="field-error">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label>{EMPLOYEE_LABELS.TABLE_PHONE}</label>
            <input
              {...form.register('phone')}
              className="field-input"
              placeholder={EMPLOYEE_LABELS.FORM_PHONE_PLACEHOLDER}
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
            <label>{EMPLOYEE_LABELS.TABLE_EMAIL}</label>
            <input
              {...form.register('email')}
              className={`field-input${form.formState.errors.email ? ' border-danger' : ''}`}
              placeholder={EMPLOYEE_LABELS.FORM_EMAIL_PLACEHOLDER}
              type="email"
              disabled={isPending}
            />
            {form.formState.errors.email && (
              <p className="field-error">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label>
              {EMPLOYEE_LABELS.TABLE_ROLE}{' '}
              <span className="field-required">*</span>
            </label>
            <Combobox
              options={roleOptions}
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
              {EMPLOYEE_LABELS.TABLE_STATUS}{' '}
              <span className="field-required">*</span>
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

        {/* Show linked profile option if the selected role is a system driver role, or just if the code is driver for now */}
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
      </form>
    </AdaptiveSheet>
  );
}
