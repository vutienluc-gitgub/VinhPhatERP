import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

import {
  useCustomerGroupList,
  useCreateCustomerGroup,
  useUpdateCustomerGroup,
  useDeleteCustomerGroup,
} from '@/application/crm/useCustomerGroups';
import type { CustomerGroup } from '@/domain/crm/customer-groups.types';
import { CUSTOMER_GROUP_LABELS } from '@/features/customers/customers.constants';
import {
  Icon,
  Button,
  AdaptiveSheet,
  AddButton,
  ActionMenu,
  Input,
} from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import type { IconName } from '@/shared/components/Icon';

function getGroupIcon(code: string): IconName {
  const c = code.toLowerCase();
  if (c.includes('vip')) return 'Star';
  if (c.includes('xuong')) return 'Factory';
  if (c.includes('dai_ly') || c.includes('daily')) return 'Store';
  if (c.includes('le') || c.includes('retail')) return 'ShoppingCart';
  if (c.includes('local')) return 'Shirt';
  return 'Users';
}

const groupFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, CUSTOMER_GROUP_LABELS.codeRequired)
    .regex(/^[A-Z0-9_]+$/, CUSTOMER_GROUP_LABELS.codeInvalid),
  name: z.string().trim().min(1, CUSTOMER_GROUP_LABELS.nameRequired),
  description: z.string().trim().nullable().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

export function CustomerGroupList() {
  const { data: groups = [], isLoading } = useCustomerGroupList();
  const createMutation = useCreateCustomerGroup();
  const updateMutation = useUpdateCustomerGroup();
  const deleteMutation = useDeleteCustomerGroup();
  const { confirm } = useConfirm();

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState<CustomerGroup | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      status: 'active',
    },
  });

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.code.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q),
    );
  }, [groups, searchQuery]);

  const handleOpenCreate = () => {
    setEditGroup(null);
    reset({
      code: '',
      name: '',
      description: '',
      status: 'active',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (group: CustomerGroup) => {
    setEditGroup(group);
    reset({
      code: group.code,
      name: group.name,
      description: group.description || '',
      status: group.status,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditGroup(null);
  };

  const handleSave = async (values: GroupFormValues) => {
    try {
      if (editGroup) {
        // Edit mode
        await updateMutation.mutateAsync({
          id: editGroup.id,
          values: {
            name: values.name,
            description: values.description || null,
            status: values.status,
          },
        });
      } else {
        // Create mode
        await createMutation.mutateAsync({
          code: values.code,
          name: values.name,
          description: values.description || null,
          status: values.status,
        });
      }
      toast.success(CUSTOMER_GROUP_LABELS.saveSuccess);
      handleCloseForm();
    } catch (err: unknown) {
      console.error('[CustomerGroupList] save error:', err);
      const errCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? (err as { code: string }).code
          : undefined;
      if (errCode === '23505') {
        toast.error(CUSTOMER_GROUP_LABELS.codeExistsError);
      } else {
        toast.error(
          err instanceof Error
            ? err.message
            : CUSTOMER_GROUP_LABELS.generalError,
        );
      }
    }
  };

  const handleDelete = async (group: CustomerGroup) => {
    const confirmed = await confirm({
      title: CUSTOMER_GROUP_LABELS.confirmDeleteTitle,
      message: CUSTOMER_GROUP_LABELS.confirmDeleteMessage,
      confirmLabel: CUSTOMER_GROUP_LABELS.confirmDeleteAction,
      cancelLabel: CUSTOMER_GROUP_LABELS.cancelAction,
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(group.id);
      toast.success(CUSTOMER_GROUP_LABELS.deleteSuccess);
    } catch (err: unknown) {
      console.error('[CustomerGroupList] delete error:', err);
      const errCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? (err as { code: string }).code
          : undefined;
      if (errCode === '23503') {
        toast.error(CUSTOMER_GROUP_LABELS.deleteErrorRestrict);
      } else {
        toast.error(
          err instanceof Error
            ? err.message
            : CUSTOMER_GROUP_LABELS.generalError,
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-surface-secondary rounded-lg w-1/4" />
        <div className="h-40 bg-surface-secondary rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={CUSTOMER_GROUP_LABELS.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-surface text-text text-sm transition-all focus:outline-none focus:ring-2 focus:ring-input-focus focus:border-primary border-border placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3.5 top-3 text-muted-foreground">
            <Icon name="Search" size={18} />
          </span>
        </div>

        <AddButton
          onClick={handleOpenCreate}
          label={CUSTOMER_GROUP_LABELS.createBtn}
        />
      </div>

      {/* List / Grid layout */}
      {filteredGroups.length === 0 ? (
        <div className="py-16 px-6 text-center bg-surface-strong rounded-2xl border border-border flex flex-col items-center justify-center gap-3">
          <div className="p-4 bg-surface-subtle rounded-full text-muted-foreground mb-2">
            <Icon name="Users" size={32} />
          </div>
          <h3 className="text-lg font-bold text-text">
            Chưa có nhóm khách hàng
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-3">
            Tạo nhóm để phân loại và quản lý khách hàng hiệu quả hơn.
          </p>
          <Button variant="outline" onClick={handleOpenCreate} leftIcon="Plus">
            {CUSTOMER_GROUP_LABELS.createBtn}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const groupIcon = getGroupIcon(group.code);
            return (
              <div
                key={group.id}
                className="bg-surface-strong p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/40 group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-extrabold tracking-widest text-foreground bg-primary/10 border border-primary/20 rounded px-2 py-0.5 inline-flex items-center gap-1.5">
                        <Icon name={groupIcon} size={12} />
                        {group.code}
                      </span>
                      <h4 className="font-bold text-text text-sm md:text-base group-hover:text-foreground transition-colors">
                        {group.name}
                      </h4>
                    </div>

                    <ActionMenu
                      items={[
                        {
                          label: CUSTOMER_GROUP_LABELS.editBtn,
                          icon: 'Edit',
                          onClick: () => handleOpenEdit(group),
                        },
                        {
                          label: CUSTOMER_GROUP_LABELS.deleteBtn,
                          icon: 'Trash2',
                          onClick: () => handleDelete(group),
                          danger: true,
                        },
                      ]}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                    {group.description || '—'}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {CUSTOMER_GROUP_LABELS.updatePrefix}{' '}
                    {new Date(group.updated_at).toLocaleDateString('vi-VN')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5 ${
                      group.status === 'active'
                        ? 'bg-success/10 text-success border border-success/20'
                        : 'bg-surface-subtle text-muted-foreground border border-border'
                    }`}
                  >
                    {group.status === 'active' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    )}
                    {group.status === 'active'
                      ? CUSTOMER_GROUP_LABELS.statusActive
                      : CUSTOMER_GROUP_LABELS.statusInactive}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit AdaptiveSheet Form */}
      <AdaptiveSheet
        open={showForm}
        onClose={handleCloseForm}
        title={
          editGroup
            ? `Sửa nhóm: ${editGroup.name}`
            : CUSTOMER_GROUP_LABELS.createBtn
        }
      >
        <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-6">
          {/* Group Code */}
          <Input
            label={CUSTOMER_GROUP_LABELS.codeLabel}
            placeholder={CUSTOMER_GROUP_LABELS.codePlaceholder}
            disabled={!!editGroup}
            className="uppercase font-bold tracking-wide"
            error={errors.code?.message}
            description="Viết liền, không dấu."
            {...register('code')}
          />

          {/* Group Name */}
          <Input
            label={CUSTOMER_GROUP_LABELS.nameLabel}
            placeholder={CUSTOMER_GROUP_LABELS.namePlaceholder}
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-label uppercase tracking-wider">
              {CUSTOMER_GROUP_LABELS.descriptionLabel}
            </label>
            <textarea
              placeholder={CUSTOMER_GROUP_LABELS.descriptionPlaceholder}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border bg-input text-text text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-input-focus focus:border-primary border-input-border resize-none"
              {...register('description')}
            />
          </div>

          {/* Status selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-label uppercase tracking-wider">
              {CUSTOMER_GROUP_LABELS.statusLabel}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-text cursor-pointer select-none">
                <input
                  type="radio"
                  value="active"
                  className="accent-primary w-4 h-4"
                  {...register('status')}
                  onChange={() => setValue('status', 'active')}
                />
                <span>{CUSTOMER_GROUP_LABELS.statusActive}</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-text cursor-pointer select-none">
                <input
                  type="radio"
                  value="inactive"
                  className="accent-primary w-4 h-4"
                  {...register('status')}
                  onChange={() => setValue('status', 'inactive')}
                />
                <span>{CUSTOMER_GROUP_LABELS.statusInactive}</span>
              </label>
            </div>
          </div>

          {/* Save buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-default">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseForm}
              className="rounded-xl px-5"
            >
              {CUSTOMER_GROUP_LABELS.cancelBtn}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="rounded-xl px-5"
            >
              {isSubmitting
                ? CUSTOMER_GROUP_LABELS.saving
                : CUSTOMER_GROUP_LABELS.saveBtn}
            </Button>
          </div>
        </form>
      </AdaptiveSheet>
    </div>
  );
}
