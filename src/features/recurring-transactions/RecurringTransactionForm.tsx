import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { Switch } from '@/shared/components/Switch';
import { formatCurrency } from '@/shared/utils/format';
import { useAccountList } from '@/application/payments';
import { useEmployees, useActiveSuppliers } from '@/application/crm';
import {
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
} from '@/application/recurring-transactions';
import { getErrorMessage } from '@/shared/utils/error';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from '@/schema/payment.schema';
import {
  recurringTransactionSchema,
  recurringTransactionDefaultValues,
} from '@/schema/recurring-transaction.schema';
import type { RecurringTransactionFormValues } from '@/schema/recurring-transaction.schema';
import type { RecurringTransaction } from '@/domain/recurring-transactions/types';

import {
  FREQUENCY_OPTIONS,
  DAY_OF_MONTH_OPTIONS,
  RECURRING_LABELS,
} from './recurring-transactions.constants';

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: EXPENSE_CATEGORY_LABELS[c],
}));

type RecurringTransactionFormProps = {
  transaction: RecurringTransaction | null;
  onClose: () => void;
};

function transactionToFormValues(
  tx: RecurringTransaction,
): RecurringTransactionFormValues {
  return {
    name: tx.name,
    category: tx.category,
    amount: tx.amount,
    frequency: tx.frequency,
    dayOfMonth: tx.day_of_month,
    supplierId: tx.supplier_id ?? '',
    employeeId: tx.employee_id ?? '',
    accountId: tx.account_id ?? '',
    description: tx.description,
    notes: tx.notes ?? '',
    isActive: tx.is_active,
    nextRunDate: tx.next_run_date,
  };
}

export function RecurringTransactionForm({
  transaction,
  onClose,
}: RecurringTransactionFormProps) {
  const isEditing = transaction !== null;
  const { data: accounts = [] } = useAccountList();
  const { data: employees = [] } = useEmployees();
  const { data: activeSuppliers } = useActiveSuppliers();
  const createMutation = useCreateRecurringTransaction();
  const updateMutation = useUpdateRecurringTransaction();

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.id,
        label: `${a.name} (${formatCurrency(a.current_balance)} đ)`,
      })),
    [accounts],
  );

  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.name} (${e.code})`,
      })),
    [employees],
  );

  const supplierOptions = useMemo(
    () =>
      (activeSuppliers ?? []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.code})`,
      })),
    [activeSuppliers],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecurringTransactionFormValues>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: isEditing
      ? transactionToFormValues(transaction)
      : recurringTransactionDefaultValues,
  });

  useEffect(() => {
    reset(
      isEditing
        ? transactionToFormValues(transaction)
        : recurringTransactionDefaultValues,
    );
  }, [transaction, isEditing, reset]);

  async function onSubmit(values: RecurringTransactionFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: transaction.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch {
      // Allow react-query mutation error state to handle UI feedback
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
          ? `${RECURRING_LABELS.editTitle}: ${transaction.name}`
          : RECURRING_LABELS.createTitle
      }
    >
      {mutationError && (
        <p className="error-inline mb-4">
          {RECURRING_LABELS.formErrorPrefix}: {getErrorMessage(mutationError)}
        </p>
      )}

      <form
        id="recurring-transaction-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="form-grid">
          {/* Tên nghiệp vụ */}
          <div className="form-field">
            <label htmlFor="name">
              Tên nghiệp vụ <span className="field-required">*</span>
            </label>
            <input
              id="name"
              className={`field-input${errors.name ? ' is-error' : ''}`}
              type="text"
              placeholder="VD: Tiền thuê kho tháng, Lương nhân viên"
              {...register('name')}
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>

          {/* Danh mục + Số tiền */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="category">
                Danh mục <span className="field-required">*</span>
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={CATEGORY_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label htmlFor="amount">
                Số tiền (đ) <span className="field-required">*</span>
              </label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="amount"
                    className={`field-input${errors.amount ? ' is-error' : ''}`}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 0)}
                    onBlur={field.onBlur}
                    placeholder="VD: 5.000.000"
                  />
                )}
              />
              {errors.amount && (
                <span className="field-error">{errors.amount.message}</span>
              )}
            </div>
          </div>

          {/* Tần suất + Ngày trong tháng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="frequency">
                Tần suất <span className="field-required">*</span>
              </label>
              <Controller
                name="frequency"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={FREQUENCY_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label htmlFor="dayOfMonth">
                Ngày phát sinh <span className="field-required">*</span>
              </label>
              <Controller
                name="dayOfMonth"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={DAY_OF_MONTH_OPTIONS}
                    value={String(field.value)}
                    onChange={(v) => field.onChange(Number(v))}
                  />
                )}
              />
              {errors.dayOfMonth && (
                <span className="field-error">{errors.dayOfMonth.message}</span>
              )}
            </div>
          </div>

          {/* Ngày bắt đầu */}
          <div className="form-field">
            <label htmlFor="nextRunDate">
              Ngày chạy tiếp theo <span className="field-required">*</span>
            </label>
            <input
              id="nextRunDate"
              className={`field-input${errors.nextRunDate ? ' is-error' : ''}`}
              type="date"
              {...register('nextRunDate')}
            />
            {errors.nextRunDate && (
              <span className="field-error">{errors.nextRunDate.message}</span>
            )}
          </div>

          {/* Nhà cung cấp + Tài khoản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="supplierId">Nhà cung cấp / Đối tác</label>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={supplierOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="— Không chọn —"
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label htmlFor="accountId">Tài khoản chi</label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={accountOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="— Không chọn —"
                  />
                )}
              />
            </div>
          </div>

          {/* Nhân viên phụ trách */}
          <div className="form-field">
            <label htmlFor="employeeId">Nhân viên phụ trách</label>
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={employeeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="— Không chọn —"
                />
              )}
            />
          </div>

          {/* Mô tả */}
          <div className="form-field">
            <label htmlFor="description">
              Mô tả <span className="field-required">*</span>
            </label>
            <input
              id="description"
              className={`field-input${errors.description ? ' is-error' : ''}`}
              type="text"
              placeholder="VD: Tiền thuê kho hàng tại Q.Bình Tân"
              {...register('description')}
            />
            {errors.description && (
              <span className="field-error">{errors.description.message}</span>
            )}
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

          {/* Trạng thái */}
          <div className="form-field">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  label="Kích hoạt"
                  description="Tắt để tạm dừng tạo phiếu chi tự động"
                />
              )}
            />
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto justify-center"
          >
            {RECURRING_LABELS.formCancel}
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isPending}
            className="w-full sm:w-auto justify-center"
          >
            {isEditing
              ? RECURRING_LABELS.formUpdate
              : RECURRING_LABELS.formCreate}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
