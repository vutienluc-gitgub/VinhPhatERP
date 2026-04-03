import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  expenseDefaultValues,
  expenseSchema,
} from './payments.module'
import type { ExpenseFormValues } from './payments.module'
import type { Expense } from './types'
import { useAccountList } from './useAccounts'
import { useCreateExpense, useNextExpenseNumber, useUpdateExpense } from './useExpenses'

type ExpenseFormProps = {
  expense: Expense | null
  onClose: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function expenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    expenseNumber: expense.expense_number,
    category: expense.category,
    amount: expense.amount,
    expenseDate: expense.expense_date,
    accountId: expense.account_id ?? '',
    supplierId: expense.supplier_id ?? '',
    description: expense.description,
    referenceNumber: expense.reference_number ?? '',
    notes: expense.notes ?? '',
  }
}

export function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
  const isEditing = expense !== null
  const { data: nextNumber } = useNextExpenseNumber()
  const { data: accounts = [] } = useAccountList()
  const createMutation = useCreateExpense()
  const updateMutation = useUpdateExpense()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: isEditing ? expenseToFormValues(expense) : expenseDefaultValues,
  })

  useEffect(() => {
    reset(isEditing ? expenseToFormValues(expense) : expenseDefaultValues)
  }, [expense, isEditing, reset])

  useEffect(() => {
    if (!isEditing && nextNumber) {
      setValue('expenseNumber', nextNumber)
    }
  }, [isEditing, nextNumber, setValue])

  async function onSubmit(values: ExpenseFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: expense.id, values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch {
      // Lỗi hiện qua mutationError
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error
  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
        <div className="modal-header">
          <h3 id="expense-modal-title">
            {isEditing ? `Sửa phiếu chi: ${expense.expense_number}` : 'Tạo phiếu chi mới'}
          </h3>
          <button className="btn-icon" type="button" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {mutationError && (
          <p style={{ color: '#c0392b', fontSize: '0.88rem', marginBottom: '0.75rem', padding: '0 1rem' }}>
            Lỗi: {(mutationError as Error).message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            {/* Số phiếu chi + Ngày chi */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="expenseNumber">Số phiếu chi <span className="field-required">*</span></label>
                <input
                  id="expenseNumber"
                  className={`field-input${errors.expenseNumber ? ' is-error' : ''}`}
                  type="text"
                  readOnly={!isEditing}
                  style={!isEditing ? { background: 'var(--surface)' } : undefined}
                  {...register('expenseNumber')}
                />
                {errors.expenseNumber && <span className="field-error">{errors.expenseNumber.message}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="expenseDate">Ngày chi <span className="field-required">*</span></label>
                <input
                  id="expenseDate"
                  className={`field-input${errors.expenseDate ? ' is-error' : ''}`}
                  type="date"
                  {...register('expenseDate')}
                />
                {errors.expenseDate && <span className="field-error">{errors.expenseDate.message}</span>}
              </div>
            </div>

            {/* Danh mục + Số tiền */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="category">Danh mục <span className="field-required">*</span></label>
                <select id="category" className="field-select" {...register('category')}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="amount">Số tiền (đ) <span className="field-required">*</span></label>
                <input
                  id="amount"
                  className={`field-input${errors.amount ? ' is-error' : ''}`}
                  type="number"
                  step="1000"
                  inputMode="numeric"
                  placeholder="VD: 5000000"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && <span className="field-error">{errors.amount.message}</span>}
              </div>
            </div>

            {/* Mô tả */}
            <div className="form-field">
              <label htmlFor="description">Mô tả <span className="field-required">*</span></label>
              <input
                id="description"
                className={`field-input${errors.description ? ' is-error' : ''}`}
                type="text"
                placeholder="VD: Thanh toán tiền sợi tháng 3"
                {...register('description')}
              />
              {errors.description && <span className="field-error">{errors.description.message}</span>}
            </div>

            {/* Tài khoản chi + Số CT */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="accountId">Tài khoản chi</label>
                <select id="accountId" className="field-select" {...register('accountId')}>
                  <option value="">— Không chọn —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.current_balance)} đ)
                    </option>
                  ))}
                </select>
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

            {/* Ghi chú */}
            <div className="form-field">
              <label htmlFor="notes">Ghi chú</label>
              <textarea
                id="notes"
                className="field-input"
                rows={2}
                placeholder="Ghi chú thêm..."
                style={{ resize: 'vertical' }}
                {...register('notes')}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={isPending}>
              Hủy
            </button>
            <button className="primary-button" type="submit" disabled={isPending}>
              {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo phiếu chi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
