import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import {
  customersDefaultValues,
  customersSchema,
  CUSTOMER_SOURCES,
  CUSTOMER_SOURCE_LABELS,
} from './customers.module'
import type { CustomersFormValues } from './customers.module'
import type { Customer } from './types'
import { useCreateCustomer, useNextCustomerCode, useUpdateCustomer } from './useCustomers'

type CustomerFormProps = {
  customer: Customer | null
  onClose: () => void
}

function customerToFormValues(customer: Customer): CustomersFormValues {
  return {
    code: customer.code,
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    tax_code: customer.tax_code ?? '',
    contact_person: customer.contact_person ?? '',
    source: customer.source ?? 'other',
    notes: customer.notes ?? '',
    status: customer.status,
  }
}

export function CustomerForm({ customer, onClose }: CustomerFormProps) {
  const isEditing = customer !== null
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const { data: nextCode } = useNextCustomerCode()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomersFormValues>({
    resolver: zodResolver(customersSchema),
    defaultValues: isEditing
      ? customerToFormValues(customer)
      : customersDefaultValues,
  })

  useEffect(() => {
    reset(
      isEditing ? customerToFormValues(customer) : customersDefaultValues,
    )
  }, [customer, isEditing, reset])

  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode)
    }
  }, [isEditing, nextCode, setValue])

  async function onSubmit(values: CustomersFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: customer.id, values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch {
      // Lỗi hiện qua mutationError bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h3 id="modal-title">
            {isEditing ? `Sửa: ${customer.name}` : 'Thêm khách hàng mới'}
          </h3>
          <button
            className="btn-icon"
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{ fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>

        {mutationError && (
          <p
            style={{
              color: '#c0392b',
              fontSize: '0.88rem',
              marginBottom: '0.75rem',
            }}
          >
            Lỗi: {(mutationError as Error).message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            {/* Mã + Tên */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="code">
                  Mã khách hàng <span className="field-required">*</span>
                </label>
                <input
                  id="code"
                  className={`field-input${errors.code ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: KH-001"
                  readOnly={!isEditing}
                  {...register('code')}
                />
                {errors.code && (
                  <span className="field-error">{errors.code.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="name">
                  Tên khách hàng <span className="field-required">*</span>
                </label>
                <input
                  id="name"
                  className={`field-input${errors.name ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: Công ty TNHH ABC"
                  {...register('name')}
                />
                {errors.name && (
                  <span className="field-error">{errors.name.message}</span>
                )}
              </div>
            </div>

            {/* Điện thoại + Email */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  className={`field-input${errors.phone ? ' is-error' : ''}`}
                  type="tel"
                  placeholder="VD: 0901 234 567"
                  {...register('phone')}
                />
                {errors.phone && (
                  <span className="field-error">{errors.phone.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  className={`field-input${errors.email ? ' is-error' : ''}`}
                  type="email"
                  placeholder="VD: lienhe@congty.vn"
                  {...register('email')}
                />
                {errors.email && (
                  <span className="field-error">{errors.email.message}</span>
                )}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="form-field">
              <label htmlFor="address">Địa chỉ</label>
              <input
                id="address"
                className="field-input"
                type="text"
                placeholder="VD: 123 Đường Lê Lợi, Q.1, TP.HCM"
                {...register('address')}
              />
            </div>

            {/* Mã số thuế + Người liên hệ */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="tax_code">Mã số thuế</label>
                <input
                  id="tax_code"
                  className={`field-input${errors.tax_code ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: 0312345678"
                  {...register('tax_code')}
                />
                {errors.tax_code && (
                  <span className="field-error">{errors.tax_code.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="contact_person">Người liên hệ</label>
                <input
                  id="contact_person"
                  className="field-input"
                  type="text"
                  placeholder="VD: Nguyễn Văn A"
                  {...register('contact_person')}
                />
              </div>
            </div>

            {/* Trạng thái + Nguồn KH */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="source">Nguồn khách hàng</label>
                <select id="source" className="field-select" {...register('source')}>
                  {CUSTOMER_SOURCES.map((s) => (
                    <option key={s} value={s}>{CUSTOMER_SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="status">Trạng thái</label>
                <select id="status" className="field-select" {...register('status')}>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="form-field">
              <label htmlFor="notes">Ghi chú</label>
              <textarea
                id="notes"
                className="field-input"
                rows={3}
                placeholder="Ghi chú thêm về khách hàng..."
                style={{ resize: 'vertical' }}
                {...register('notes')}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary"
              type="button"
              onClick={onClose}
              disabled={isPending}
            >
              Hủy
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={isPending}
            >
              {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
