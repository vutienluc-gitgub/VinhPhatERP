import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller, useWatch, Control } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { formatCurrency } from '@/shared/utils/format';
import { useAccountList, useUnpaidDocuments } from '@/application/payments';
import { useEmployees, useSuppliersList } from '@/application/crm';
import { useCreateExpense, useUpdateExpense } from '@/application/payments';
import { sumBy } from '@/shared/utils/array.util';

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

// -- Allocation Details Component
function UnpaidDocumentsSection({
  supplierId,
  control,
  setValue,
}: {
  supplierId: string;
  control: Control<ExpenseFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
}) {
  const { data: unpaidDocs, isLoading } = useUnpaidDocuments(supplierId);
  const allocations =
    useWatch({
      control,
      name: 'allocations',
    }) || [];

  if (!supplierId || isLoading || !unpaidDocs?.length) return null;

  return (
    <div className="form-field col-span-full mt-4">
      <label className="text-sm font-semibold mb-2 block">
        Đối trừ công nợ (Tự động tính vào số tiền chi)
      </label>
      <div className="bg-[var(--surface-sunken)] p-3 rounded-md border border-[var(--border-subtle)] space-y-2">
        {unpaidDocs.map((doc) => {
          const allocIdx = allocations.findIndex(
            (a: { document_id: string }) => a.document_id === doc.document_id,
          );
          const isSelected = allocIdx >= 0;
          const remaining = doc.remaining_amount;

          return (
            <div
              key={doc.document_id}
              className="flex items-center gap-3 p-2 bg-[var(--surface-default)] rounded border border-[var(--border-subtle)]"
            >
              <input
                type="checkbox"
                className="w-4 h-4 rounded appearance-none checked:bg-primary border border-gray-300 checked:border-primary shrink-0 relative
                  after:content-['✓'] after:absolute after:text-[10px] after:text-white after:left-[3px] after:top-[1px] after:opacity-0 checked:after:opacity-100"
                checked={isSelected}
                onChange={(e) => {
                  const chk = e.target.checked;
                  const currentAlloc = [...allocations];
                  if (chk) {
                    currentAlloc.push({
                      document_type: doc.document_type,
                      document_id: doc.document_id,
                      allocated_amount: remaining,
                    });
                  } else {
                    currentAlloc.splice(allocIdx, 1);
                  }

                  setValue('allocations', currentAlloc);
                  // Tự động tính tổng tiền vào ô So Tien
                  const sumAmount = sumBy(
                    currentAlloc,
                    (a) => a.allocated_amount,
                  );
                  setValue('amount', sumAmount);
                }}
              />
              <div className="flex-1 text-sm">
                <div className="font-medium">{doc.document_number}</div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {doc.document_type === 'weaving_invoice'
                    ? 'Phiếu dệt'
                    : 'Phiếu nhập sợi'}
                  {' - '} Ngày:{' '}
                  {new Date(doc.document_date).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-[var(--danger-strong)]">
                  {formatCurrency(remaining)} đ
                </div>
                {doc.paid_amount > 0 && (
                  <div className="text-xs text-[var(--text-tertiary)]">
                    Đã thanh toán: {formatCurrency(doc.paid_amount)} đ
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

export function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
  const isEditing = expense !== null;
  const { data: accounts = [] } = useAccountList();
  const { data: employees = [] } = useEmployees();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: suppliersData } = useSuppliersList({ limit: 100 } as any);
  const suppliers = suppliersData?.data ?? [];
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
        <p className="error-inline mb-4">
          Lỗi: {(mutationError as Error).message}
        </p>
      )}

      <form id="expense-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Số phiếu chi + Ngày chi */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="expenseNumber">Số phiếu chi</label>
              {isEditing ? (
                <input
                  id="expenseNumber"
                  className="field-input"
                  type="text"
                  readOnly
                  {...register('expenseNumber')}
                />
              ) : (
                <input
                  id="expenseNumber"
                  className="field-input bg-[var(--surface-disabled)] text-[var(--text-tertiary)] italic"
                  type="text"
                  value="Tự động"
                  readOnly
                  disabled
                />
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
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
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

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="supplierId">Nhà cung cấp / Đối tác</label>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={suppliers.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.code})`,
                    }))}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      // Reset allocations if supplier changes
                      setValue('allocations', []);
                    }}
                    placeholder="— Chọn nhà cung cấp —"
                  />
                )}
              />
            </div>

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
                <span className="field-error">
                  {errors.description.message}
                </span>
              )}
            </div>
          </div>

          {/* Tài khoản chi + Số CT */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
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
                : 'Tạo phiếu chi'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
