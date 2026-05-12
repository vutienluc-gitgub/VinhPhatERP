import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { formatCurrency } from '@/shared/utils/format';
import {
  useAccountList,
  useUnpaidDocuments,
  useNextExpenseNumber,
} from '@/application/payments';
import { useEmployees, useActiveSuppliers } from '@/application/crm';
import { useCreateExpense, useUpdateExpense } from '@/application/payments';
import { sumBy } from '@/shared/utils/array.util';
import type { UnpaidDocument } from '@/domain/payments/types';
import { getErrorMessage } from '@/shared/utils/error';

import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  expenseDefaultValues,
  expenseSchema,
} from './payments.module';
import type { ExpenseFormValues } from './payments.module';
import type { Expense } from './types';

/** Type cho 1 allocation item trong form */
type AllocationItem = ExpenseFormValues['allocations'][number];

/** Type cho 1 grouped doc item trong UnpaidDocumentsSection */
type GroupedDoc = {
  isGroup: boolean;
  id: string;
  title: string;
  subtitle: string;
  date: string;
  remaining: number;
  paid_amount: number;
  items: UnpaidDocument[];
};

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: EXPENSE_CATEGORY_LABELS[c],
}));

type ExpenseFormProps = {
  expense: Expense | null;
  onClose: () => void;
  initialSupplierId?: string;
};

// -- Allocation Details Component
function UnpaidDocumentsSection({
  supplierId,
  control,
  setValue,
}: {
  supplierId: string;
  control: Control<ExpenseFormValues>;
  setValue: UseFormSetValue<ExpenseFormValues>;
}) {
  const { data: unpaidDocs, isLoading } = useUnpaidDocuments(supplierId);
  const allocations =
    useWatch({
      control,
      name: 'allocations',
    }) || [];

  const groupedDocs = useMemo(() => {
    if (!unpaidDocs) return [];

    const result: GroupedDoc[] = [];
    const fabricByDate: Record<string, UnpaidDocument[]> = {};

    unpaidDocs.forEach((doc) => {
      if (doc.document_type === 'fabric_purchase') {
        const dateKey = doc.document_date;
        if (!fabricByDate[dateKey]) fabricByDate[dateKey] = [];
        fabricByDate[dateKey].push(doc);
      } else {
        result.push({
          isGroup: false,
          id: doc.document_id,
          title: doc.document_number,
          subtitle:
            doc.document_type === 'weaving_invoice'
              ? 'Phiếu dệt'
              : 'Phiếu nhập sợi',
          date: doc.document_date,
          remaining: doc.remaining_amount,
          paid_amount: doc.paid_amount,
          items: [doc],
        });
      }
    });

    Object.entries(fabricByDate).forEach(([dateStr, docs]) => {
      const totalRemaining = sumBy(docs, (d) => d.remaining_amount);
      const totalPaid = sumBy(docs, (d) => d.paid_amount);

      result.push({
        isGroup: true,
        id: `fabric_group_${dateStr}`,
        title: `Mua vải thành phẩm (${docs.length} cuộn)`,
        subtitle: 'Phiếu mua vải',
        date: dateStr,
        remaining: totalRemaining,
        paid_amount: totalPaid,
        items: docs,
      });
    });

    // Sort by date descending
    result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return result;
  }, [unpaidDocs]);

  if (!supplierId || isLoading || !unpaidDocs?.length) return null;

  return (
    <div className="form-field col-span-full mt-4">
      <label className="text-sm font-semibold mb-2 block">
        Đối trừ công nợ (Tự động tính vào số tiền chi)
      </label>
      <div className="bg-[var(--surface-sunken)] p-3 rounded-md border border-[var(--border-subtle)] space-y-2 max-h-64 overflow-y-auto">
        {groupedDocs.map((group) => {
          // Check if all items in this group are selected
          const isSelected = group.items.every((doc) =>
            allocations.some(
              (a: AllocationItem) => a.document_id === doc.document_id,
            ),
          );

          return (
            <div
              key={group.id}
              className="flex items-center gap-3 p-2 bg-[var(--surface-default)] rounded border border-[var(--border-subtle)]"
            >
              <input
                type="checkbox"
                className="w-4 h-4 rounded appearance-none checked:bg-primary border border-gray-300 checked:border-primary shrink-0 relative
                  after:content-['✓'] after:absolute after:text-[10px] after:text-white after:left-[3px] after:top-[1px] after:opacity-0 checked:after:opacity-100 cursor-pointer"
                checked={isSelected}
                onChange={(e) => {
                  const chk = e.target.checked;
                  let currentAlloc = [...allocations];
                  if (chk) {
                    group.items.forEach((doc) => {
                      if (
                        !currentAlloc.some(
                          (a: AllocationItem) =>
                            a.document_id === doc.document_id,
                        )
                      ) {
                        currentAlloc.push({
                          document_type: doc.document_type,
                          document_id: doc.document_id,
                          allocated_amount: doc.remaining_amount,
                        });
                      }
                    });
                  } else {
                    currentAlloc = currentAlloc.filter(
                      (a: AllocationItem) =>
                        !group.items.some(
                          (d) => d.document_id === a.document_id,
                        ),
                    );
                  }

                  setValue('allocations', currentAlloc);
                  // Tự động tính tổng tiền vào ô So Tien
                  const sumAmount = sumBy(
                    currentAlloc,
                    (a: AllocationItem) => a.allocated_amount,
                  );
                  setValue('amount', sumAmount);
                }}
              />
              <div className="flex-1 text-sm">
                <div className="font-medium">{group.title}</div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {group.subtitle}
                  {' - '} Ngày:{' '}
                  {new Date(group.date).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-[var(--danger-strong)]">
                  {formatCurrency(group.remaining)} đ
                </div>
                {group.paid_amount > 0 && (
                  <div className="text-xs text-[var(--text-tertiary)]">
                    Đã thanh toán: {formatCurrency(group.paid_amount)} đ
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
          ? `Sửa phiếu chi: ${expense.expense_number}`
          : 'Tạo phiếu chi mới'
      }
    >
      {mutationError && (
        <p className="error-inline mb-4">
          Lỗi: {getErrorMessage(mutationError)}
        </p>
      )}

      <form id="expense-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Số phiếu chi + Ngày chi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="expenseNumber">Số phiếu chi</label>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  options={employeeOptions}
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

        <div className="mt-8 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto justify-center"
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto justify-center"
          >
            {isPending
              ? 'Đang lưu...'
              : isEditing
                ? 'Cập nhật'
                : 'Tạo phiếu chi'}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
