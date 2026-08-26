import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

import { Button, Icon, VPSelect, VPEntityPicker } from '@/shared/components';
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
import type { CustomersFormValues } from '@/schema/customer.schema';
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
import type { Customer } from '@/domain/crm/customers.types';

import { CustomerGroupSelector } from './components/CustomerGroupSelector';
import { CustomerPortalAccountPanel } from './CustomerPortalAccountPanel';
import { CustomerTimeline } from './CustomerTimeline';
import { CUSTOMER_FORM_LABELS } from './customers.constants';
import {
  customerToFormValues,
  onPhoneKeyDown,
} from './utils/customer-form.helpers';

const SOURCE_OPTIONS = CUSTOMER_SOURCES.map((s) => ({
  value: s,
  label: CUSTOMER_SOURCE_LABELS[s],
  icon: (
    <Icon
      name={
        CUSTOMER_SOURCE_ICONS[s] as React.ComponentProps<typeof Icon>['name']
      }
      className="h-4 w-4 text-muted-foreground"
    />
  ),
}));

const STATUS_OPTIONS = [
  {
    value: 'active',
    label: CUSTOMER_FORM_LABELS.statusActive,
    icon: <Icon name="check-circle-2" className="h-4 w-4 text-success" />,
  },
  {
    value: 'inactive',
    label: CUSTOMER_FORM_LABELS.statusInactive,
    icon: <Icon name="x-circle" className="h-4 w-4 text-muted-foreground" />,
  },
];

const LEAD_STATUS_OPTIONS = [
  {
    value: 'lead',
    label: CRM_STATUS_LABELS.lead,
    icon: (
      <Icon
        name={
          CRM_STATUS_ICONS.lead as React.ComponentProps<typeof Icon>['name']
        }
        className="h-4 w-4 text-muted-foreground"
      />
    ),
  },
  {
    value: 'opportunity',
    label: CRM_STATUS_LABELS.opportunity,
    icon: (
      <Icon
        name={
          CRM_STATUS_ICONS.opportunity as React.ComponentProps<
            typeof Icon
          >['name']
        }
        className="h-4 w-4 text-muted-foreground"
      />
    ),
  },
  {
    value: 'customer',
    label: CRM_STATUS_LABELS.customer,
    icon: (
      <Icon
        name={
          CRM_STATUS_ICONS.customer as React.ComponentProps<typeof Icon>['name']
        }
        className="h-4 w-4 text-success"
      />
    ),
  },
  {
    value: 'lost',
    label: CRM_STATUS_LABELS.lost,
    icon: (
      <Icon
        name={
          CRM_STATUS_ICONS.lost as React.ComponentProps<typeof Icon>['name']
        }
        className="h-4 w-4 text-danger"
      />
    ),
  },
];

type CustomerFormProps = {
  customer: Customer | null;
  onClose: () => void;
};

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

  const {
    data: groupsList = [],
    isLoading: isGroupsLoading,
    isError: isGroupsError,
    refetch: refetchGroups,
  } = useCustomerGroupList();
  const { data: currentGroupIds = [] } = useCustomerGroupMembers(customer?.id);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Đồng bộ nhóm đã chọn khi ở chế độ Sửa
  useEffect(() => {
    if (isEditing && currentGroupIds) {
      setSelectedGroupIds(currentGroupIds);
    }
  }, [customer, isEditing, currentGroupIds]);

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

  // Reset form & state khi chuyển đổi giữa các khách hàng
  useEffect(() => {
    reset(isEditing ? customerToFormValues(customer) : customersDefaultValues);
    if (!isEditing) {
      setSelectedGroupIds([]);
    }
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

        let groupSaveFailed = false;
        try {
          await saveCustomerGroupsForCustomer(customer.id, selectedGroupIds);
        } catch (groupErr) {
          groupSaveFailed = true;
          console.error('[CustomerGroupSave Error (Edit)]', groupErr);
        }

        if (groupSaveFailed) {
          toast.error(CUSTOMER_FORM_LABELS.groupSavePartialWarning);
        } else {
          toast.success(CUSTOMER_FORM_LABELS.successUpdate);
        }
      } else {
        const newCustomer = await createMutation.mutateAsync(values);
        let groupSaveFailed = false;

        if (newCustomer?.id && selectedGroupIds.length > 0) {
          try {
            await saveCustomerGroupsForCustomer(
              newCustomer.id,
              selectedGroupIds,
            );
          } catch (groupErr) {
            groupSaveFailed = true;
            console.error('[CustomerGroupSave Error (Create)]', groupErr);
          }
        }

        if (groupSaveFailed) {
          toast.error(CUSTOMER_FORM_LABELS.groupSavePartialWarning);
        } else {
          toast.success(CUSTOMER_FORM_LABELS.successCreate);
        }
      }

      void queryClient.invalidateQueries({
        queryKey: ['customer_groups', 'members'],
      });
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
      console.error('[CustomerForm Submit Error]', err);
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
              className={`field-input${errors.code ? ' border-danger' : ''}`}
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
              className={`field-input${errors.name ? ' border-danger' : ''}`}
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
              className={`field-input${errors.phone ? ' border-danger' : ''}`}
              type="tel"
              placeholder={CUSTOMER_FORM_LABELS.phonePlaceholder}
              {...register('phone')}
              onKeyDown={onPhoneKeyDown}
            />
            {errors.phone && (
              <span className="field-error">{errors.phone.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="email">{CUSTOMER_FORM_LABELS.emailLabel}</label>
            <input
              id="email"
              className={`field-input${errors.email ? ' border-danger' : ''}`}
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
              className={`field-input${errors.tax_code ? ' border-danger' : ''}`}
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
                <VPSelect
                  options={SOURCE_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
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
                <VPSelect
                  options={STATUS_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
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
                <VPSelect
                  options={LEAD_STATUS_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
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
                <VPEntityPicker
                  options={
                    salesEmployees?.map((emp) => ({
                      id: emp.id,
                      name: emp.name,
                      code: emp.code,
                    })) ?? []
                  }
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder={CUSTOMER_FORM_LABELS.unassigned}
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
          <CustomerGroupSelector
            groups={groupsList}
            selectedGroupIds={selectedGroupIds}
            onChange={setSelectedGroupIds}
            isLoading={isGroupsLoading}
            isError={isGroupsError}
            onRetry={() => void refetchGroups()}
            disabled={isPending}
          />

          {/* Tài khoản Customer Portal */}
          <div className="form-field">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              {CUSTOMER_FORM_LABELS.portalLabel}
            </span>
            {isEditing ? (
              <CustomerPortalAccountPanel
                customerId={customer.id}
                customerName={customer.name}
              />
            ) : (
              <div className="border border-dashed border-default bg-surface-secondary/50 rounded-xl p-4 min-h-[90px] flex items-center justify-center text-center text-xs text-muted-foreground italic">
                {CUSTOMER_FORM_LABELS.portalPending}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-8 pt-6 border-t border-default">
          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
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
