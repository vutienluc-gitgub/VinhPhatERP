import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  accountDefaultValues,
  accountSchema,
} from './payments.module'
import type { AccountFormValues } from './payments.module'
import type { PaymentAccount } from './types'
import { useCreateAccount, useUpdateAccount } from './useAccounts'

type AccountFormProps = {
  account: PaymentAccount | null
  onClose: () => void
}

function accountToFormValues(account: PaymentAccount): AccountFormValues {
  return {
    name: account.name,
    type: account.type,
    bankName: account.bank_name ?? '',
    accountNumber: account.account_number ?? '',
    initialBalance: account.initial_balance,
    notes: account.notes ?? '',
    status: account.status as 'active' | 'inactive',
  }
}

export function AccountForm({ account, onClose }: AccountFormProps) {
  const isEditing = account !== null
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: isEditing ? accountToFormValues(account) : accountDefaultValues,
  })

  useEffect(() => {
    reset(isEditing ? accountToFormValues(account) : accountDefaultValues)
  }, [account, isEditing, reset])

  const accountType = watch('type')

  async function onSubmit(values: AccountFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: account.id, values })
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
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
        <div className="modal-header">
          <h3 id="account-modal-title">
            {isEditing ? `Sửa: ${account.name}` : 'Thêm tài khoản mới'}
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
            {/* Tên + Loại */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="name">Tên tài khoản <span className="field-required">*</span></label>
                <input
                  id="name"
                  className={`field-input${errors.name ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: VCB - Vĩnh Phát"
                  {...register('name')}
                />
                {errors.name && <span className="field-error">{errors.name.message}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="type">Loại tài khoản <span className="field-required">*</span></label>
                <select id="type" className="field-select" {...register('type')}>
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bank info - only for bank accounts */}
            {accountType === 'bank' && (
              <div className="form-grid form-grid-2">
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
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="initialBalance">
                  Số dư ban đầu (đ) {!isEditing && <span className="field-required">*</span>}
                </label>
                <input
                  id="initialBalance"
                  className={`field-input${errors.initialBalance ? ' is-error' : ''}`}
                  type="number"
                  step="1000"
                  inputMode="numeric"
                  placeholder="0"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  readOnly={isEditing}
                  {...register('initialBalance', { valueAsNumber: true })}
                />
                {errors.initialBalance && <span className="field-error">{errors.initialBalance.message}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="status">Trạng thái</label>
                <select id="status" className="field-select" {...register('status')}>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng sử dụng</option>
                </select>
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
              {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
