import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { useCreateAccount, useUpdateAccount } from '@/application/payments';

import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  accountDefaultValues,
  accountSchema,
} from './payments.module';
import type { AccountFormValues } from './payments.module';
import type { PaymentAccount } from './types';

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
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: isEditing
      ? accountToFormValues(account)
      : accountDefaultValues,
  });

  useEffect(() => {
    reset(isEditing ? accountToFormValues(account) : accountDefaultValues);
  }, [account, isEditing, reset]);

  const accountType = watch('type');

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
    } catch {
      // Lỗi hiện qua mutationError
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={isEditing ? `Sửa: ${account.name}` : 'Thêm tài khoản mới'}
    >
      {mutationError && (
        <p className="error-inline mb-4">
          Lỗi: {(mutationError as Error).message}
        </p>
      )}

      <form id="account-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Tên + Loại */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="name">
                Tên tài khoản <span className="field-required">*</span>
              </label>
              <input
                id="name"
                className={`field-input${errors.name ? ' is-error' : ''}`}
                type="text"
                placeholder="VD: VCB - Vĩnh Phát"
                {...register('name')}
              />
              {errors.name && (
                <span className="field-error">{errors.name.message}</span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="type">
                Loại tài khoản <span className="field-required">*</span>
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={ACCOUNT_TYPES.map((t) => ({
                      value: t,
                      label: ACCOUNT_TYPE_LABELS[t],
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          {/* Bank info - only for bank accounts */}
          {accountType === 'bank' && (
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label htmlFor="bankName">Tên ngân hàng</label>
                <input
                  id="bankName"
                  className="field-input"
                  type="text"
                  placeholder="VD: Vietcombank"
                  {...register('bankName')}
                />
              </div>
              <div className="form-field">
                <label htmlFor="accountNumber">Số tài khoản</label>
                <input
                  id="accountNumber"
                  className="field-input"
                  type="text"
                  placeholder="VD: 1234567890"
                  {...register('accountNumber')}
                />
              </div>
            </div>
          )}

          {/* Số dư ban đầu + Trạng thái */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="initialBalance">
                Số dư ban đầu (đ){' '}
                {!isEditing && <span className="field-required">*</span>}
              </label>
              <Controller
                name="initialBalance"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="initialBalance"
                    className={`field-input${errors.initialBalance ? ' is-error' : ''}`}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 0)}
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
            <div className="form-field">
              <label htmlFor="status">Trạng thái</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={[
                      {
                        value: 'active',
                        label: 'Hoạt động',
                      },
                      {
                        value: 'inactive',
                        label: 'Ngừng sử dụng',
                      },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div className="form-field">
            <label htmlFor="notes">Ghi chú</label>
            <textarea
              id="notes"
              className="field-textarea"
              rows={2}
              placeholder="Ghi chú thêm..."
              {...register('notes')}
            />
          </div>
        </div>

        <div className="modal-footer mt-6 p-0 border-none">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <button
            className="primary-button btn-standard"
            type="submit"
            disabled={isPending}
          >
            {isPending
              ? 'Đang lưu...'
              : isEditing
                ? 'Cập nhật'
                : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
