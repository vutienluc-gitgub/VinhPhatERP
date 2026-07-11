import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { MoneyInput } from '@/shared/value';
import { useCreateAccount, useUpdateAccount } from '@/application/payments';
import { getErrorMessage } from '@/shared/utils/error';

import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  accountDefaultValues,
  accountSchema,
} from './payments.module';
import type { AccountFormValues } from './payments.module';
import {
  ACCOUNT_STATUS_OPTIONS,
  ACCOUNT_FORM_LABELS,
} from './payments.constants';
import type { PaymentAccount } from './types';

const TYPE_OPTIONS = ACCOUNT_TYPES.map((t) => ({
  value: t,
  label: ACCOUNT_TYPE_LABELS[t],
}));

type AccountFormProps = {
  account: PaymentAccount | null;
  onClose: () => void;
};

function accountToFormValues(account: PaymentAccount): AccountFormValues {
  return {
    name: account.name,
    type: account.type,
    bankName: account.bank_name ?? '',
    accountNumber: account.account_number ?? '',
    initialBalance: account.initial_balance,
    notes: account.notes ?? '',
    status: account.status as 'active' | 'inactive',
  };
}

export function AccountForm({ account, onClose }: AccountFormProps) {
  const isEditing = account !== null;
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: isEditing
      ? accountToFormValues(account)
      : accountDefaultValues,
  });

  // Reset form when editing target changes
  useEffect(() => {
    reset(isEditing ? accountToFormValues(account) : accountDefaultValues);
  }, [account, isEditing, reset]);

  const accountType = watch('type');

  // Fix #1 — clear bank-only fields when type switches away from 'bank'
  useEffect(() => {
    if (accountType !== 'bank') {
      setValue('bankName', '');
      setValue('accountNumber', '');
    }
  }, [accountType, setValue]);

  async function onSubmit(values: AccountFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: account.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      // Lỗi hiện qua mutationError
      console.error('[AccountForm]', err);
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={
        isEditing
          ? `${ACCOUNT_FORM_LABELS.titleEdit} ${account.name}`
          : ACCOUNT_FORM_LABELS.titleCreate
      }
    >
      {mutationError && (
        <p className="error-inline mb-4">
          {ACCOUNT_FORM_LABELS.errorPrefix} {getErrorMessage(mutationError)}
        </p>
      )}

      <form id="account-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Tên + Loại */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="name">
                {ACCOUNT_FORM_LABELS.name}{' '}
                <span className="field-required">*</span>
              </label>
              <input
                id="name"
                className={`field-input${errors.name ? ' border-danger' : ''}`}
                type="text"
                placeholder={ACCOUNT_FORM_LABELS.namePlaceholder}
                {...register('name')}
              />
              {errors.name && (
                <span className="field-error">{errors.name.message}</span>
              )}
            </div>

            {/* Fix #2 — add hasError + error message for type Combobox */}
            <div className="form-field">
              <label htmlFor="type">
                {ACCOUNT_FORM_LABELS.type}{' '}
                <span className="field-required">*</span>
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={TYPE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.type}
                  />
                )}
              />
              {errors.type && (
                <span className="field-error">{errors.type.message}</span>
              )}
            </div>
          </div>

          {/* Bank info — only visible when type === 'bank' */}
          {accountType === 'bank' && (
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label htmlFor="bankName">{ACCOUNT_FORM_LABELS.bankName}</label>
                <input
                  id="bankName"
                  className="field-input"
                  type="text"
                  placeholder={ACCOUNT_FORM_LABELS.bankNamePlaceholder}
                  {...register('bankName')}
                />
              </div>
              <div className="form-field">
                <label htmlFor="accountNumber">
                  {ACCOUNT_FORM_LABELS.accountNumber}
                </label>
                <input
                  id="accountNumber"
                  className="field-input"
                  type="text"
                  placeholder={ACCOUNT_FORM_LABELS.accountNumberPlaceholder}
                  {...register('accountNumber')}
                />
              </div>
            </div>
          )}

          {/* Số dư ban đầu + Trạng thái */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="initialBalance">
                {ACCOUNT_FORM_LABELS.initialBalance}{' '}
                {/* Field is locked in edit mode, required on create */}
                {!isEditing && <span className="field-required">*</span>}
              </label>
              <Controller
                name="initialBalance"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    id="initialBalance"
                    className={`field-input${errors.initialBalance ? ' border-danger' : ''}`}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={isEditing}
                    placeholder="0"
                  />
                )}
              />
              {errors.initialBalance && (
                <span className="field-error">
                  {errors.initialBalance.message}
                </span>
              )}
            </div>

            {/* Fix #3 — use centralized ACCOUNT_STATUS_OPTIONS */}
            <div className="form-field">
              <label htmlFor="status">{ACCOUNT_FORM_LABELS.status}</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={ACCOUNT_STATUS_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div className="form-field">
            <label htmlFor="notes">{ACCOUNT_FORM_LABELS.notes}</label>
            <textarea
              id="notes"
              className="field-textarea"
              rows={2}
              placeholder={ACCOUNT_FORM_LABELS.notesPlaceholder}
              {...register('notes')}
            />
          </div>
        </div>

        {/* Fix #4 — use consistent footer layout matching PaymentForm / ExpenseForm */}
        <div className="mt-8 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto justify-center"
          >
            {ACCOUNT_FORM_LABELS.cancel}
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isPending}
            className="w-full sm:w-auto justify-center"
          >
            {isEditing
              ? ACCOUNT_FORM_LABELS.submitEdit
              : ACCOUNT_FORM_LABELS.submitCreate}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
