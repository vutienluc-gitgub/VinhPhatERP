import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Button, DataTable, ActionBar, Icon } from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  useCompanyRoles,
  useCreateCompanyRole,
  useUpdateCompanyRole,
  useDeleteCompanyRole,
} from '@/application/crm';

interface RoleManagementModalProps {
  open: boolean;
  onClose: () => void;
}

const roleFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã vai trò')
    .regex(/^[a-z0-9_]+$/, 'Mã chỉ chứa chữ thường, số và dấu gạch dưới'),
  name: z.string().trim().min(1, 'Vui lòng nhập tên hiển thị'),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export function RoleManagementModal({
  open,
  onClose,
}: RoleManagementModalProps) {
  const { data: roles, isLoading } = useCompanyRoles();
  const createMutation = useCreateCompanyRole();
  const updateMutation = useUpdateCompanyRole();
  const deleteMutation = useDeleteCompanyRole();
  const { confirm } = useConfirm();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { code: '', name: '' },
  });

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  function resetForm() {
    setIsAdding(false);
    setEditingId(null);
    setEditRoleName('');
    form.reset();
  }

  const handleCreate = form.handleSubmit((values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Đã thêm vai trò mới');
        resetForm();
      },
      onError: (err) => toast.error(err.message),
    });
  });

  async function handleUpdate(id: string) {
    if (!editRoleName.trim()) {
      toast.error('Tên vai trò không được để trống');
      return;
    }
    updateMutation.mutate(
      { id, data: { name: editRoleName.trim() } },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật vai trò');
          resetForm();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Xóa vai trò',
      message: `Bạn có chắc chắn muốn xóa vai trò "${name}"?`,
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (ok) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success('Đã xóa vai trò'),
        onError: (err) => toast.error(err.message),
      });
    }
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title="Quản lý vai trò (Dynamic Roles)"
      footer={
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Đóng
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted">
            Thêm mới và quản lý các chức danh tùy chỉnh cho nhân viên.
          </p>
          {!isAdding && (
            <Button
              size="sm"
              onClick={() => setIsAdding(true)}
              disabled={isPending}
            >
              + Thêm Role
            </Button>
          )}
        </div>

        {isAdding && (
          <form
            className="bg-[var(--surface-accent)] p-4 rounded-[var(--radius)] flex flex-col gap-3"
            onSubmit={handleCreate}
          >
            <h4 className="font-bold text-sm">Thêm vai trò mới</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="text-xs font-medium mb-1 block">
                  Mã (Code)
                </label>
                <input
                  {...form.register('code')}
                  className={`field-input text-sm ${form.formState.errors.code ? 'border-danger' : ''}`}
                  placeholder="VD: ketoan"
                  disabled={isPending}
                />
                {form.formState.errors.code && (
                  <p className="field-error">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>
              <div className="form-field">
                <label className="text-xs font-medium mb-1 block">
                  Tên hiển thị
                </label>
                <input
                  {...form.register('name')}
                  className={`field-input text-sm ${form.formState.errors.name ? 'border-danger' : ''}`}
                  placeholder="VD: Kế toán"
                  disabled={isPending}
                />
                {form.formState.errors.name && (
                  <p className="field-error">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={resetForm}
                disabled={isPending}
                type="button"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="submit"
                isLoading={createMutation.isPending}
              >
                Lưu
              </Button>
            </div>
          </form>
        )}

        <DataTable
          data={roles ?? []}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          columns={[
            {
              header: 'Mã',
              id: 'code',
              cell: (r) => <span className="font-mono text-xs">{r.code}</span>,
            },
            {
              header: 'Tên hiển thị',
              id: 'name',
              cell: (r) => {
                if (editingId === r.id) {
                  return (
                    <input
                      autoFocus
                      className="field-input text-sm py-1 px-2 h-8"
                      value={editRoleName}
                      onChange={(e) => setEditRoleName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(r.id)}
                    />
                  );
                }
                return (
                  <span className="font-medium">
                    {r.name}{' '}
                    {r.is_system && (
                      <span className="text-xs text-muted font-normal ml-1">
                        (Hệ thống)
                      </span>
                    )}
                  </span>
                );
              },
            },
            {
              header: 'Thao tác',
              className: 'text-right',
              cell: (r) => {
                if (r.is_system) {
                  return (
                    <Icon
                      name="Lock"
                      size={14}
                      className="text-muted inline-block mr-2"
                    />
                  );
                }
                if (editingId === r.id) {
                  return (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={resetForm}
                        disabled={isPending}
                      >
                        <Icon name="X" size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="primary"
                        onClick={() => handleUpdate(r.id)}
                        disabled={isPending}
                      >
                        <Icon name="Check" size={16} />
                      </Button>
                    </div>
                  );
                }
                return (
                  <ActionBar
                    actions={[
                      {
                        icon: 'Pencil',
                        title: 'Sửa',
                        onClick: () => {
                          setEditingId(r.id);
                          setEditRoleName(r.name);
                          setIsAdding(false);
                        },
                      },
                      {
                        icon: 'Trash2',
                        title: 'Xóa',
                        variant: 'danger',
                        onClick: () => handleDelete(r.id, r.name),
                        disabled: deleteMutation.isPending,
                      },
                    ]}
                  />
                );
              },
            },
          ]}
          renderMobileCard={(r) => (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <span className="mobile-card-title">{r.code}</span>
              </div>
              <div className="mobile-card-body">
                <p className="font-bold text-lg">{r.name}</p>
              </div>
            </div>
          )}
        />
      </div>
    </AdaptiveSheet>
  );
}
