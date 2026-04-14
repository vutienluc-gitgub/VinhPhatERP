import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { formatCurrency } from '@/shared/utils/format';
import { useAccountList } from '@/application/payments';
import { useEmployees } from '@/application/crm';
import {
  useCreateExpense,
  useNextExpenseNumber,
  useUpdateExpense,
} from '@/application/payments';

import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  expenseDefaultValues,
  expenseSchema,
} from './payments.module';
import type { ExpenseFormValues } from './payments.module';
import type { Expense } from './types';

type ExpenseFormProps = {
  expense: Expense | null;
  onClose: () => void;
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
  };
}

export function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
  const isEditing = expense !== null;
  const { data: nextNumber } = useNextExpenseNumber();
  const { data: accounts = [] } = useAccountList();
  const { data: employees = [] } = useEmployees();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

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
      : expenseDefaultValues,
  });

  useEffect(() => {
    reset(isEditing ? expenseToFormValues(expense) : expenseDefaultValues);
  }, [expense, isEditing, reset]);

  useEffect(() => {
    if (!isEditing && nextNumber) {
      setValue('expenseNumber', nextNumber);
    }
  }, [isEditing, nextNumber, setValue]);

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
      title={
        isEditing
          ? `Sửa phiếu chi: ${expense.expense_number}`
          : 'Tạo phiếu chi mới'
      }
    >
      {mutationError && (
        <p className="error-inline" style={{ marginBottom: '1rem' }}>
          Lỗi: {(mutationError as Error).message}
        </p>
      )}

      <form id="expense-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Số phiếu chi + Ngày chi */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label htmlFor="expenseNumber">
                Số phiếu chi <span className="field-required">*</span>
              </label>
              <input
                id="expenseNumber"
                className={`field-input${errors.expenseNumber ? ' is-error' : ''}`}
                type="text"
                readOnly={!isEditing}
                style={
                  !isEditing ? { background: 'var(--surface)' } : undefined
                }
                {...register('expenseNumber')}
              />
              {errors.expenseNumber && (
                <span className="field-error">
                  {errors.expenseNumber.message}
                </span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="expenseDate">
                Ngày chi <span className="field-required">*</span>
              </label>
              <input
                id="expenseDate"
                className={`field-input${errors.expenseDate ? ' is-error' : ''}`}
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
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label htmlFor="category">
                Danh mục <span className="field-required">*</span>
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={EXPENSE_CATEGORIES.map((c) => ({
                      value: c,
                      label: EXPENSE_CATEGORY_LABELS[c],
                    }))}
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

          {/* Mô tả */}
          <div className="form-field">
            <label htmlFor="description">
              Mô tả <span className="field-required">*</span>
            </label>
            <input
              id="description"
              className={`field-input${errors.description ? ' is-error' : ''}`}
              type="text"
              placeholder="VD: Thanh toán tiền sợi tháng 3"
              {...register('description')}
            />
            {errors.description && (
              <span className="field-error">{errors.description.message}</span>
            )}
          </div>

          {/* Tài khoản chi + Số CT */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label htmlFor="accountId">Tài khoản chi</label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={accounts.map((a) => ({
                      value: a.id,
                      label: `${a.name} (${formatCurrency(a.current_balance)} đ)`,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="— Không chọn —"
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label htmlFor="referenceNumber">Số chứng từ</label>
              <input
                id="referenceNumber"
                className="field-input"
                type="text"
                placeholder="Mã giao dịch, số hóa đơn..."
                {...register('referenceNumber')}
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
                  options={employees.map((e) => ({
                    value: e.id,
                    label: `${e.name} (${e.code})`,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="— Không chọn —"
                />
              )}
            />
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

        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
          }}
        >
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
                : 'Tạo phiếu chi'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
