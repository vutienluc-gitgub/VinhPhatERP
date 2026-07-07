import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/shared/components';
import {
  customersDefaultValues,
  CUSTOMER_SOURCES,
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_SOURCE_ICONS,
} from '@/schema';
import {
  customersSchema,
  CRM_STATUS_LABELS,
  CRM_STATUS_ICONS,
} from '@/schema/customer.schema';
import type { CustomersFormValues, LeadStatus } from '@/schema/customer.schema';
import { Combobox } from '@/shared/components/Combobox';
import {
  useCreateCustomer,
  useNextCustomerCode,
  useUpdateCustomer,
  useEmployees,
} from '@/application/crm';
import { useAuth } from '@/shared/hooks/useAuth';
import { getErrorMessage } from '@/shared/utils/error';
import {
  useCustomerGroupList,
  useCustomerGroupMembers,
} from '@/application/crm/useCustomerGroups';
import { saveCustomerGroupsForCustomer } from '@/api/customer-groups.api';

import type { Customer } from './types';
import { CustomerPortalAccountPanel } from './CustomerPortalAccountPanel';
import { CustomerTimeline } from './CustomerTimeline';
import { CUSTOMER_FORM_LABELS } from './customers.constants';

const SOURCE_OPTIONS = CUSTOMER_SOURCES.map((s) => ({
  value: s,
  label: CUSTOMER_SOURCE_LABELS[s],
  icon: CUSTOMER_SOURCE_ICONS[s],
}));

const STATUS_OPTIONS = [
  {
    value: 'active',
    label: CUSTOMER_FORM_LABELS.statusActive,
    icon: 'CheckCircle2' as const,
  },
  {
    value: 'inactive',
    label: CUSTOMER_FORM_LABELS.statusInactive,
    icon: 'XCircle' as const,
  },
];

const LEAD_STATUS_OPTIONS = [
  { value: 'lead', label: CRM_STATUS_LABELS.lead, icon: CRM_STATUS_ICONS.lead },
  {
    value: 'opportunity',
    label: CRM_STATUS_LABELS.opportunity,
    icon: CRM_STATUS_ICONS.opportunity,
  },
  {
    value: 'customer',
    label: CRM_STATUS_LABELS.customer,
    icon: CRM_STATUS_ICONS.customer,
  },
  { value: 'lost', label: CRM_STATUS_LABELS.lost, icon: CRM_STATUS_ICONS.lost },
];

type CustomerFormProps = {
  customer: Customer | null;
  onClose: () => void;
};

function customerToFormValues(customer: Customer): CustomersFormValues {
  return {
    code: customer.code,
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    tax_code: customer.tax_code ?? '',
    contact_person: customer.contact_person ?? '',
    source: customer.source ?? 'other',
    notes: customer.notes ?? '',
    status: customer.status,
    salesperson_id: customer.salesperson_id ?? '',
    lead_status: (customer.lead_status as LeadStatus) || 'lead',
  };
}

export function CustomerForm({ customer, onClose }: CustomerFormProps) {
  const isEditing = customer !== null;
  const queryClient = useQueryClient();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const { data: nextCode } = useNextCustomerCode();
  const { profile } = useAuth();
  const { data: salesEmployees } = useEmployees({
    role: 'sales',
    status: 'active',
  });

  // Tải danh sách nhóm và thành viên nhóm của khách hàng
  const { data: groupsList = [] } = useCustomerGroupList();
  const { data: currentGroupIds = [] } = useCustomerGroupMembers(customer?.id);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Đồng bộ nhóm đã chọn khi dữ liệu tải xong
  useEffect(() => {
    if (currentGroupIds) {
      setSelectedGroupIds(currentGroupIds);
    }
  }, [currentGroupIds]);

  const canAssign = profile?.role === 'admin' || profile?.role === 'manager';

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomersFormValues>({
    resolver: zodResolver(customersSchema),
    defaultValues: isEditing
      ? customerToFormValues(customer)
      : customersDefaultValues,
  });

  useEffect(() => {
    reset(isEditing ? customerToFormValues(customer) : customersDefaultValues);
  }, [customer, isEditing, reset]);

  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode);
    }
    if (!isEditing && !canAssign && profile?.employee_id) {
      setValue('salesperson_id', profile.employee_id);
    }
  }, [isEditing, nextCode, setValue, canAssign, profile?.employee_id]);

  async function onSubmit(values: CustomersFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: customer.id,
          values,
          expectedUpdatedAt: customer.updated_at,
        });
        // Lưu liên kết nhóm khách hàng (Many-to-Many)
        await saveCustomerGroupsForCustomer(customer.id, selectedGroupIds);
        toast.success(CUSTOMER_FORM_LABELS.successUpdate);
      } else {
        const newCustomer = await createMutation.mutateAsync(values);
        if (newCustomer?.id && selectedGroupIds.length > 0) {
          // Lưu liên kết nhóm cho khách hàng mới vừa tạo
          await saveCustomerGroupsForCustomer(newCustomer.id, selectedGroupIds);
        }
        toast.success(CUSTOMER_FORM_LABELS.successCreate);
      }

      // Invalidate cache để cập nhật giao diện
      void queryClient.invalidateQueries({
        queryKey: ['customer_groups', 'members'],
      });
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
      console.error('[CustomerForm Error]', err);
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <form id="customer-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {mutationError && (
        <p className="error-inline mb-4">
          {CUSTOMER_FORM_LABELS.errorPrefix} {getErrorMessage(mutationError)}
        </p>
      )}

      <div className="form-grid">
        {/* Mã + Tên */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label htmlFor="code">
              {CUSTOMER_FORM_LABELS.codeLabel}{' '}
              <span className="field-required">*</span>
            </label>
            <input
              id="code"
              className={`field-input${errors.code ? ' is-error' : ''}`}
              type="text"
              placeholder={CUSTOMER_FORM_LABELS.codePlaceholder}
              readOnly={!isEditing}
              {...register('code')}
            />
            {errors.code && (
              <span className="field-error">{errors.code.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="name">
              {CUSTOMER_FORM_LABELS.nameLabel}{' '}
              <span className="field-required">*</span>
            </label>
            <input
              id="name"
              className={`field-input${errors.name ? ' is-error' : ''}`}
              type="text"
              placeholder={CUSTOMER_FORM_LABELS.namePlaceholder}
              {...register('name')}
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>
        </div>

        {/* Điện thoại + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label htmlFor="phone">{CUSTOMER_FORM_LABELS.phoneLabel}</label>
            <input
              id="phone"
              className={`field-input${errors.phone ? ' is-error' : ''}`}
              type="tel"
              placeholder={CUSTOMER_FORM_LABELS.phonePlaceholder}
              {...register('phone')}
              onKeyDown={(e) => {
                // Cho phép: Xóa, Điều hướng, Copy/Paste, các phím số và dấu cấu trúc cơ bản
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
            {errors.phone && (
              <span className="field-error">{errors.phone.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="email">{CUSTOMER_FORM_LABELS.emailLabel}</label>
            <input
              id="email"
              className={`field-input${errors.email ? ' is-error' : ''}`}
              type="email"
              placeholder={CUSTOMER_FORM_LABELS.emailPlaceholder}
              {...register('email')}
            />
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
            )}
          </div>
        </div>

        {/* Địa chỉ */}
        <div className="form-field">
          <label htmlFor="address">{CUSTOMER_FORM_LABELS.addressLabel}</label>
          <input
            id="address"
            className="field-input"
            type="text"
            placeholder={CUSTOMER_FORM_LABELS.addressPlaceholder}
            {...register('address')}
          />
        </div>

        {/* Mã số thuế + Người liên hệ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label htmlFor="tax_code">
              {CUSTOMER_FORM_LABELS.taxCodeLabel}
            </label>
            <input
              id="tax_code"
              className={`field-input${errors.tax_code ? ' is-error' : ''}`}
              type="text"
              placeholder={CUSTOMER_FORM_LABELS.taxCodePlaceholder}
              {...register('tax_code')}
            />
            {errors.tax_code && (
              <span className="field-error">{errors.tax_code.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="contact_person">
              {CUSTOMER_FORM_LABELS.contactPersonLabel}
            </label>
            <input
              id="contact_person"
              className="field-input"
              type="text"
              placeholder={CUSTOMER_FORM_LABELS.contactPersonPlaceholder}
              {...register('contact_person')}
            />
          </div>
        </div>

        {/* Trạng thái + Nguồn KH */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label htmlFor="source">{CUSTOMER_FORM_LABELS.sourceLabel}</label>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={SOURCE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="status">{CUSTOMER_FORM_LABELS.statusLabel}</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={STATUS_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Phễu CRM & Nhân viên phụ trách */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label htmlFor="lead_status">
              {CUSTOMER_FORM_LABELS.leadStatusLabel}
            </label>
            <Controller
              name="lead_status"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={LEAD_STATUS_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="salesperson_id">
              {CUSTOMER_FORM_LABELS.salespersonLabel}
            </label>
            <Controller
              name="salesperson_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={[
                    { value: '', label: CUSTOMER_FORM_LABELS.unassigned },
                    ...(salesEmployees?.map((emp) => ({
                      value: emp.id,
                      label: `${emp.name} (${emp.code})`,
                      icon: 'User' as const,
                    })) ?? []),
                  ]}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  disabled={!canAssign}
                />
              )}
            />
          </div>
        </div>

        {/* Ghi chú */}
        <div className="form-field">
          <label htmlFor="notes">{CUSTOMER_FORM_LABELS.notesLabel}</label>
          <textarea
            id="notes"
            className="field-textarea"
            rows={3}
            placeholder={CUSTOMER_FORM_LABELS.notesPlaceholder}
            {...register('notes')}
          />
        </div>

        {/* Phân hạng sỉ & Tài khoản Portal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nhóm khách hàng (Many-to-Many Tags / Checkbox toggles) */}
          <div className="form-field">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              {CUSTOMER_FORM_LABELS.groupsLabel}
            </span>
            {groupsList.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                {CUSTOMER_FORM_LABELS.noGroups}
              </span>
            ) : (
              <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 h-full min-h-[90px] content-start">
                {groupsList
                  .filter(
                    (g) =>
                      g.status === 'active' || selectedGroupIds.includes(g.id),
                  )
                  .map((g) => {
                    const isSelected = selectedGroupIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGroupIds(
                              selectedGroupIds.filter((id) => id !== g.id),
                            );
                          } else {
                            setSelectedGroupIds([...selectedGroupIds, g.id]);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer h-fit ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{g.name}</span>
                        <span className="text-[10px] opacity-60 font-mono">
                          ({g.code})
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Tài khoản Customer Portal */}
          <div className="form-field">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              {CUSTOMER_FORM_LABELS.portalLabel}
            </span>
            {isEditing ? (
              <CustomerPortalAccountPanel
                customerId={customer.id}
                customerName={customer.name}
              />
            ) : (
              <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-4 min-h-[90px] flex items-center justify-center text-center text-xs text-slate-400 italic">
                {CUSTOMER_FORM_LABELS.portalPending}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
            {CUSTOMER_FORM_LABELS.timelineLabel}
          </h3>
          <CustomerTimeline customerId={customer.id} />
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          variant="secondary"
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="w-full sm:w-auto justify-center"
        >
          {CUSTOMER_FORM_LABELS.cancelBtn}
        </Button>
        <Button
          variant="primary"
          type="submit"
          isLoading={isPending}
          className="w-full sm:w-auto justify-center"
        >
          {isEditing
            ? CUSTOMER_FORM_LABELS.updateBtn
            : CUSTOMER_FORM_LABELS.createBtn}
        </Button>
      </div>
    </form>
  );
}
