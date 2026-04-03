import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  deliveryConfirmSchema,
  deliveryConfirmDefaultValues,
} from './shipments.module'
import type { DeliveryConfirmFormValues } from './shipments.module'
import { useMarkDelivered } from './useShipments'
import type { Shipment } from './types'

type Props = {
  shipment: Shipment
  onClose: () => void
}

export function DeliveryConfirmForm({ shipment, onClose }: Props) {
  const deliverMutation = useMarkDelivered()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryConfirmFormValues>({
    resolver: zodResolver(deliveryConfirmSchema),
    defaultValues: deliveryConfirmDefaultValues,
  })

  async function onSubmit(values: DeliveryConfirmFormValues) {
    await deliverMutation.mutateAsync({ shipmentId: shipment.id, values })
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Convert to base64 data URL for proof storage
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setValue('deliveryProof', result, { shouldValidate: true })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>Xác nhận giao hàng — {shipment.shipment_number}</h3>
          <button className="btn-icon" type="button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Receiver info */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Tên người nhận *</label>
              <input className="field-input" {...register('receiverName')} placeholder="Họ tên người nhận hàng" />
              {errors.receiverName && <p className="field-error">{errors.receiverName.message}</p>}
            </div>
            <div>
              <label className="form-label">SĐT người nhận</label>
              <input className="field-input" {...register('receiverPhone')} placeholder="0901..." />
            </div>
          </div>

          {/* Photo proof */}
          <div>
            <label className="form-label">Ảnh biên nhận / chữ ký *</label>
            <input
              className="field-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
            />
            {errors.deliveryProof && <p className="field-error">{errors.deliveryProof.message}</p>}
            <input type="hidden" {...register('deliveryProof')} />
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Ghi chú</label>
            <textarea className="field-input" rows={2} {...register('notes')} placeholder="Ghi chú thêm..." />
          </div>

          {/* Error */}
          {deliverMutation.error && (
            <p style={{ color: '#c0392b', fontSize: '0.88rem' }}>
              Lỗi: {(deliverMutation.error as Error).message}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <button className="btn-secondary" type="button" onClick={onClose}>Huỷ</button>
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting || deliverMutation.isPending}
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.9rem' }}
            >
              {deliverMutation.isPending ? 'Đang lưu...' : 'Hoàn tất giao hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
