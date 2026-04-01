import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_STATUSES,
  SUPPLIER_STATUS_LABELS,
  supplierDefaults,
  supplierSchema,
} from './suppliers.module'
import type { SupplierFormValues } from './suppliers.module'
import type { Supplier } from './types'
import { useCreateSupplier, useNextSupplierCode, useUpdateSupplier } from './useSuppliers'

type SupplierFormProps = {
  supplier: Supplier | null
  onClose: () => void
}

function supplierToFormValues(supplier: Supplier): SupplierFormValues {
  return {
    code: supplier.code,
    name: supplier.name,
    category: supplier.category,
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
    address: supplier.address ?? '',
    tax_code: supplier.tax_code ?? '',
    contact_person: supplier.contact_person ?? '',
    notes: supplier.notes ?? '',
    status: supplier.status,
  }
}

export function SupplierForm({ supplier, onClose }: SupplierFormProps) {
  const isEditing = supplier !== null
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const { data: nextCode } = useNextSupplierCode()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: isEditing ? supplierToFormValues(supplier) : supplierDefaults,
  })

  useEffect(() => {
    reset(isEditing ? supplierToFormValues(supplier) : supplierDefaults)
  }, [supplier, isEditing, reset])

  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode)
    }
  }, [isEditing, nextCode, setValue])

  async function onSubmit(values: SupplierFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: supplier.id, values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch {
      // Lỗi hiển thị qua mutationError bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error
  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">
            {isEditing ? `Sửa NCC: ${supplier.name}` : 'Thêm nhà cung cấp mới'}
          </h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Đóng" style={{ fontSize: '1.1rem' }}>
            ✕
          </button>
        </div>

        {mutationError && (
          <p style={{ color: '#c0392b', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
            Lỗi: {(mutationError as Error).message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            {/* Mã NCC + Tên NCC */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="code">
                  Mã NCC <span className="field-required">*</span>
                </label>
                <input
                  id="code"
                  type="text"
                  className={`field-input${errors.code ? ' is-error' : ''}`}
                  placeholder="VD: NCC-001"
                  readOnly={!isEditing}
                  {...register('code')}
                />
                {errors.code && <span className="field-error">{errors.code.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="name">
                  Tên nhà cung cấp <span className="field-required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={`field-input${errors.name ? ' is-error' : ''}`}
                  placeholder="VD: Công ty TNHH ABC"
                  {...register('name')}
                />
                {errors.name && <span className="field-error">{errors.name.message}</span>}
              </div>
            </div>

            {/* Điện thoại + Email */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  type="tel"
                  className={`field-input${errors.phone ? ' is-error' : ''}`}
                  placeholder="VD: 0901 234 567"
                  {...register('phone')}
                />
                {errors.phone && <span className="field-error">{errors.phone.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`field-input${errors.email ? ' is-error' : ''}`}
                  placeholder="VD: supplier@example.com"
                  {...register('email')}
                />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="form-field">
              <label htmlFor="address">Địa chỉ</label>
              <input
                id="address"
                type="text"
                className="field-input"
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
                  type="text"
                  className={`field-input${errors.tax_code ? ' is-error' : ''}`}
                  placeholder="VD: 0312345678"
                  {...register('tax_code')}
                />
                {errors.tax_code && <span className="field-error">{errors.tax_code.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="contact_person">Người liên hệ</label>
                <input
                  id="contact_person"
                  type="text"
                  className="field-input"
                  placeholder="VD: Nguyễn Văn A"
                  {...register('contact_person')}
                />
              </div>
            </div>

            {/* Danh mục + Trạng thái */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="category">
                  Danh mục <span className="field-required">*</span>
                </label>
                <select id="category" className="field-select" {...register('category')}>
                  {SUPPLIER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {SUPPLIER_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="field-error">{errors.category.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="status">Trạng thái</label>
                <select id="status" className="field-select" {...register('status')}>
                  {SUPPLIER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {SUPPLIER_STATUS_LABELS[st]}
                    </option>
                  ))}
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
                placeholder="Ghi chú nội bộ về nhà cung cấp..."
                {...register('notes')}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isPending}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isPending}>
              {isPending ? 'Đang lưu…' : isEditing ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
