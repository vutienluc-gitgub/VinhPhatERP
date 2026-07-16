import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { formatCurrency } from '@/shared/utils/format';
import { MoneyInput } from '@/shared/value';
import { useAccountList, useNextExpenseNumber } from '@/application/payments';
import { useEmployees, useActiveSuppliers } from '@/application/crm';
import { useCreateExpense, useUpdateExpense } from '@/application/payments';
import { getErrorMessage } from '@/shared/utils/error';

import { EXPENSE_FORM_MESSAGES as MSG } from './payments.constants';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  expenseDefaultValues,
  expenseSchema,
} from './payments.module';
import type { ExpenseFormValues } from './payments.module';
import type { Expense } from './types';
import { EXPENSE_FORM_LABELS } from './payments.constants';
import { UnpaidDocumentsSection } from './components/UnpaidDocumentsSection';

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: EXPENSE_CATEGORY_LABELS[c],
}));

type ExpenseFormProps = {
  expense: Expense | null;
  onClose: () => void;
  initialSupplierId?: string;
};

function expenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    expenseNumber: expense.expense_number,
    category: expense.category,
    amount: expense.amount,
    expenseDate: expense.expense_date,
    accountId: expense.account_id ?? '',
    supplierId: expense.supplier_id ?? '',
    employeeId:
      (expense as Expense & { employee_id?: string | null }).employee_id ?? '',
    description: expense.description,
    referenceNumber: expense.reference_number ?? '',
    notes: expense.notes ?? '',
    allocations: [],
  };
}

export function ExpenseForm({
  expense,
  onClose,
  initialSupplierId,
}: ExpenseFormProps) {
  const isEditing = expense !== null;
  const { data: accounts = [] } = useAccountList();
  const { data: employees = [] } = useEmployees();
  const { data: activeSuppliers } = useActiveSuppliers();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const { data: nextNumber } = useNextExpenseNumber();

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.id,
        // eslint-disable-next-line no-restricted-syntax
        label: MSG.ACCOUNT_LABEL(a.name, formatCurrency(a.current_balance)),
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: isEditing
      ? expenseToFormValues(expense)
      : { ...expenseDefaultValues, supplierId: initialSupplierId ?? '' },
  });

  // Inject auto-generated number into form when available (create mode only)
  useEffect(() => {
    if (!isEditing && nextNumber) {
      setValue('expenseNumber', nextNumber);
    }
  }, [isEditing, nextNumber, setValue]);

  useEffect(() => {
    reset(
      isEditing
        ? expenseToFormValues(expense)
        : { ...expenseDefaultValues, supplierId: initialSupplierId ?? '' },
    );
  }, [expense, isEditing, reset, initialSupplierId]);

  async function onSubmit(values: ExpenseFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: expense.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      // Lỗi hiện qua mutationError
      console.error('[ExpenseForm]', err);
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
          ? `${EXPENSE_FORM_LABELS.titleEdit} ${expense.expense_number}`
          : EXPENSE_FORM_LABELS.titleCreate
      }
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto justify-center"
          >
            {EXPENSE_FORM_LABELS.cancel}
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="expense-form"
            isLoading={isPending}
            className="w-full sm:w-auto justify-center"
          >
            {isEditing
              ? EXPENSE_FORM_LABELS.submitEdit
              : EXPENSE_FORM_LABELS.submitCreate}
          </Button>
        </>
      }
    >
      {mutationError && (
        <p className="error-inline mb-4">
          {EXPENSE_FORM_LABELS.errorPrefix} {getErrorMessage(mutationError)}
        </p>
      )}

      <form id="expense-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Số phiếu chi + Ngày chi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="expenseNumber">
                {EXPENSE_FORM_LABELS.expenseNumber}
              </label>
              <input
                id="expenseNumber"
                className="field-input bg-[var(--surface-disabled)] text-[var(--text-tertiary)] italic"
                type="text"
                readOnly
                {...register('expenseNumber')}
              />
            </div>
            <div className="form-field">
              <label htmlFor="expenseDate">
                {EXPENSE_FORM_LABELS.expenseDate}{' '}
                <span className="field-required">*</span>
              </label>
              <input
                id="expenseDate"
                className={`field-input${errors.expenseDate ? ' border-danger' : ''}`}
                type="date"
                {...register('expenseDate')}
              />
              {errors.expenseDate && (
                <span className="field-error">
                  {errors.expenseDate.message}
                </span>
              )}
            </div>
          </div>

          {/* Danh mục + Số tiền */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="category">
                {EXPENSE_FORM_LABELS.category}{' '}
                <span className="field-required">*</span>
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
                {EXPENSE_FORM_LABELS.amount}{' '}
                <span className="field-required">*</span>
              </label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    id="amount"
                    className={`field-input${errors.amount ? ' border-danger' : ''}`}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={EXPENSE_FORM_LABELS.amountPlaceholder}
                  />
                )}
              />
              {errors.amount && (
                <span className="field-error">{errors.amount.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="supplierId">
                {EXPENSE_FORM_LABELS.supplierId}
              </label>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={supplierOptions}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      // Reset allocations if supplier changes
                      setValue('allocations', []);
                    }}
                    placeholder={EXPENSE_FORM_LABELS.supplierPlaceholder}
                  />
                )}
              />
            </div>

            <div className="form-field">
              <label htmlFor="description">
                {EXPENSE_FORM_LABELS.description}{' '}
                <span className="field-required">*</span>
              </label>
              <input
                id="description"
                className={`field-input${errors.description ? ' border-danger' : ''}`}
                type="text"
                placeholder={EXPENSE_FORM_LABELS.descriptionPlaceholder}
                {...register('description')}
              />
              {errors.description && (
                <span className="field-error">
                  {errors.description.message}
                </span>
              )}
            </div>
          </div>

          {/* Tài khoản chi + Số CT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="accountId">{EXPENSE_FORM_LABELS.accountId}</label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={accountOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={EXPENSE_FORM_LABELS.accountIdPlaceholder}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label htmlFor="referenceNumber">
                {EXPENSE_FORM_LABELS.referenceNumber}
              </label>
              <input
                id="referenceNumber"
                className="field-input"
                type="text"
                placeholder={EXPENSE_FORM_LABELS.referenceNumberPlaceholder}
                {...register('referenceNumber')}
              />
            </div>
          </div>

          {/* Nhân viên phụ trách */}
          <div className="form-field">
            <label htmlFor="employeeId">{EXPENSE_FORM_LABELS.employeeId}</label>
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={employeeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={EXPENSE_FORM_LABELS.employeeIdPlaceholder}
                />
              )}
            />
          </div>

          {/* Allocation Section */}
          <Controller
            name="supplierId"
            control={control}
            render={({ field: supplierField }) => (
              <UnpaidDocumentsSection
                supplierId={supplierField.value || ''}
                control={control}
                setValue={setValue}
              />
            )}
          />

          {/* Ghi chú */}
          <div className="form-field">
            <label htmlFor="notes">{EXPENSE_FORM_LABELS.notes}</label>
            <textarea
              id="notes"
              className="field-textarea"
              rows={2}
              placeholder={EXPENSE_FORM_LABELS.notesPlaceholder}
              {...register('notes')}
            />
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
