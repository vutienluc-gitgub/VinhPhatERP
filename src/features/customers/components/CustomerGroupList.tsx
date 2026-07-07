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
} from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';

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
        <div className="h-10 bg-slate-200 rounded-lg w-1/4" />
        <div className="h-40 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={CUSTOMER_GROUP_LABELS.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-slate-400">
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
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
          {CUSTOMER_GROUP_LABELS.noGroups}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#0f3460] bg-slate-100 rounded px-2 py-0.5">
                      {group.code}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">
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

                <p className="text-xs text-slate-500 line-clamp-2 h-8">
                  {group.description || '—'}
                </p>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
                <span className="text-[10px] text-slate-400 font-semibold">
                  {CUSTOMER_GROUP_LABELS.updatePrefix}{' '}
                  {new Date(group.updated_at).toLocaleDateString('vi-VN')}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    group.status === 'active'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {group.status === 'active'
                    ? CUSTOMER_GROUP_LABELS.statusActive
                    : CUSTOMER_GROUP_LABELS.statusInactive}
                </span>
              </div>
            </div>
          ))}
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
        <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-5">
          {/* Group Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {CUSTOMER_GROUP_LABELS.codeLabel}
            </label>
            <input
              type="text"
              placeholder={CUSTOMER_GROUP_LABELS.codePlaceholder}
              disabled={!!editGroup}
              className={`w-full px-3 py-2 rounded-xl border text-sm font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white bg-slate-50 uppercase ${
                errors.code
                  ? 'border-red-500 ring-1 ring-red-500'
                  : 'border-slate-200'
              }`}
              {...register('code')}
            />
            {errors.code && (
              <span className="text-xs font-semibold text-red-600">
                {errors.code.message}
              </span>
            )}
          </div>

          {/* Group Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {CUSTOMER_GROUP_LABELS.nameLabel}
            </label>
            <input
              type="text"
              placeholder={CUSTOMER_GROUP_LABELS.namePlaceholder}
              className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white bg-slate-50 ${
                errors.name
                  ? 'border-red-500 ring-1 ring-red-500'
                  : 'border-slate-200'
              }`}
              {...register('name')}
            />
            {errors.name && (
              <span className="text-xs font-semibold text-red-600">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {CUSTOMER_GROUP_LABELS.descriptionLabel}
            </label>
            <textarea
              placeholder={CUSTOMER_GROUP_LABELS.descriptionPlaceholder}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white bg-slate-50 resize-none"
              {...register('description')}
            />
          </div>

          {/* Status selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {CUSTOMER_GROUP_LABELS.statusLabel}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="radio"
                  value="active"
                  className="accent-primary"
                  {...register('status')}
                  onChange={() => setValue('status', 'active')}
                />
                <span>{CUSTOMER_GROUP_LABELS.statusActive}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="radio"
                  value="inactive"
                  className="accent-primary"
                  {...register('status')}
                  onChange={() => setValue('status', 'inactive')}
                />
                <span>{CUSTOMER_GROUP_LABELS.statusInactive}</span>
              </label>
            </div>
          </div>

          {/* Save buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
