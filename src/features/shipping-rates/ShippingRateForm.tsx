import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  shippingRatesSchema,
  shippingRatesDefaultValues,
} from './shipping-rates.module'
import type { ShippingRateFormValues } from './shipping-rates.module'
import type { ShippingRate } from './types'
import { useCreateShippingRate, useUpdateShippingRate } from './useShippingRates'

type Props = {
  item: ShippingRate | null
  onClose: () => void
}

export function ShippingRateForm({ item, onClose }: Props) {
  const create = useCreateShippingRate()
  const update = useUpdateShippingRate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRatesSchema),
    defaultValues: item
      ? {
          name: item.name,
          destinationArea: item.destination_area,
          ratePerTrip: item.rate_per_trip,
          ratePerMeter: item.rate_per_meter,
          ratePerKg: item.rate_per_kg,
          loadingFee: item.loading_fee,
          minCharge: item.min_charge,
          isActive: item.is_active,
          notes: item.notes ?? '',
        }
      : shippingRatesDefaultValues,
  })

  async function onSubmit(values: ShippingRateFormValues) {
    if (item) {
      await update.mutateAsync({ id: item.id, values })
    } else {
      await create.mutateAsync(values)
    }
    onClose()
  }

  const mutationError = create.error || update.error

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>{item ? 'Sửa bảng giá cước' : 'Thêm bảng giá cước'}</h3>
          <button className="btn-icon" type="button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Name + Area */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Tên bảng giá *</label>
              <input className="field-input" {...register('name')} placeholder="VD: Tuyến HCM - Bình Dương" />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Khu vực giao *</label>
              <input className="field-input" {...register('destinationArea')} placeholder="VD: Bình Dương" />
              {errors.destinationArea && <p className="field-error">{errors.destinationArea.message}</p>}
            </div>
          </div>

          {/* Rate per trip */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Giá cố định/chuyến (VNĐ)</label>
              <input
                className="field-input"
                type="number"
                {...register('ratePerTrip', { valueAsNumber: true, setValueAs: (v) => (v === '' ? null : Number(v)) })}
                placeholder="0"
              />
              {errors.ratePerTrip && <p className="field-error">{errors.ratePerTrip.message}</p>}
            </div>
            <div>
              <label className="form-label">Giá theo mét (VNĐ/m)</label>
              <input
                className="field-input"
                type="number"
                step="0.001"
                {...register('ratePerMeter', { valueAsNumber: true, setValueAs: (v) => (v === '' ? null : Number(v)) })}
                placeholder="0"
              />
              {errors.ratePerMeter && <p className="field-error">{errors.ratePerMeter.message}</p>}
            </div>
          </div>

          {/* Rate per kg + loading fee */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Giá theo kg (VNĐ/kg)</label>
              <input
                className="field-input"
                type="number"
                step="0.001"
                {...register('ratePerKg', { valueAsNumber: true, setValueAs: (v) => (v === '' ? null : Number(v)) })}
                placeholder="0"
              />
              {errors.ratePerKg && <p className="field-error">{errors.ratePerKg.message}</p>}
            </div>
            <div>
              <label className="form-label">Phí bốc xếp (VNĐ) *</label>
              <input
                className="field-input"
                type="number"
                {...register('loadingFee', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.loadingFee && <p className="field-error">{errors.loadingFee.message}</p>}
            </div>
          </div>

          {/* Min charge + active */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Phí tối thiểu (VNĐ)</label>
              <input
                className="field-input"
                type="number"
                {...register('minCharge', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.minCharge && <p className="field-error">{errors.minCharge.message}</p>}
            </div>
            <div>
              <label className="form-label">Trạng thái</label>
              <select className="field-select" {...register('isActive', { setValueAs: (v) => v === 'true' || v === true })}>
                <option value="true">Đang dùng</option>
                <option value="false">Ngừng dùng</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Ghi chú</label>
            <textarea className="field-input" rows={2} {...register('notes')} placeholder="Ghi chú thêm..." />
          </div>

          {/* Error */}
          {mutationError && (
            <p style={{ color: '#c0392b', fontSize: '0.88rem' }}>
              Lỗi: {(mutationError as Error).message}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <button className="btn-secondary" type="button" onClick={onClose}>Huỷ</button>
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.9rem' }}
            >
              {isSubmitting ? 'Đang lưu...' : item ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
