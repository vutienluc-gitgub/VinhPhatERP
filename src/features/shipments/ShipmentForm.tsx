import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import {
  emptyShipmentItem,
  shipmentsDefaultValues,
  shipmentsSchema,
} from './shipments.module'
import type { ShipmentsFormValues } from './shipments.module'
import {
  useAvailableFinishedRolls,
  useCreateShipment,
  useNextShipmentNumber,
} from './useShipments'

type ShipmentFormProps = {
  orderId: string
  customerId: string
  orderNumber: string
  onClose: () => void
}

export function ShipmentForm({ orderId, customerId, orderNumber, onClose }: ShipmentFormProps) {
  const { data: nextNumber } = useNextShipmentNumber()
  const { data: availableRolls = [] } = useAvailableFinishedRolls()
  const createMutation = useCreateShipment()
  const availableRollById = new Map(availableRolls.map((roll) => [roll.id, roll]))

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentsFormValues>({
    resolver: zodResolver(shipmentsSchema),
    defaultValues: {
      ...shipmentsDefaultValues,
      orderId,
      customerId,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // Auto-fill shipment number
  useEffect(() => {
    if (nextNumber) setValue('shipmentNumber', nextNumber)
  }, [nextNumber, setValue])

  async function onSubmit(values: ShipmentsFormValues) {
    await createMutation.mutateAsync(values)
    reset()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h3>Tạo phiếu xuất — {orderNumber}</h3>
          <button className="btn-icon" type="button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Shipment number */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Số phiếu xuất *</label>
              <input className="field-input" {...register('shipmentNumber')} readOnly style={{ background: 'var(--surface)' }} />
              {errors.shipmentNumber && <p className="field-error">{errors.shipmentNumber.message}</p>}
            </div>
            <div>
              <label className="form-label">Ngày giao *</label>
              <input className="field-input" type="date" {...register('shipmentDate')} />
              {errors.shipmentDate && <p className="field-error">{errors.shipmentDate.message}</p>}
            </div>
          </div>

          {/* Delivery address */}
          <div>
            <label className="form-label">Địa chỉ giao</label>
            <input className="field-input" {...register('deliveryAddress')} placeholder="Địa chỉ giao hàng..." />
          </div>

          {/* Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Dòng hàng *</label>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => append({ ...emptyShipmentItem })}
                style={{ fontSize: '0.82rem' }}
              >
                + Thêm dòng
              </button>
            </div>

            {fields.map((field, idx) => (
              <div
                key={field.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 80px 36px',
                  gap: '0.4rem',
                  alignItems: 'start',
                  marginBottom: '0.4rem',
                }}
              >
                <div>
                  {idx === 0 && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Cuộn thành phẩm</span>}
                  <select
                    className="field-select"
                    {...register(`items.${idx}.finishedRollId`, {
                      onChange: (event) => {
                        const rollId = event.target.value
                        const selectedRoll = availableRollById.get(rollId)
                        if (!selectedRoll) return

                        setValue(`items.${idx}.fabricType`, selectedRoll.fabric_type, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      },
                    })}
                  >
                    <option value="">— Không chọn —</option>
                    {availableRolls.map((roll) => (
                      <option key={roll.id} value={roll.id}>
                        {roll.roll_number} — {roll.fabric_type} {roll.color_name ? `(${roll.color_name})` : ''} — {roll.length_m}m
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {idx === 0 && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Loại vải *</span>}
                  <input className="field-input" {...register(`items.${idx}.fabricType`)} placeholder="Loại vải" />
                  {errors.items?.[idx]?.fabricType && (
                    <p className="field-error">{errors.items[idx]?.fabricType?.message}</p>
                  )}
                </div>
                <div>
                  {idx === 0 && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>SL (m) *</span>}
                  <input
                    className="field-input"
                    type="number"
                    step="0.001"
                    {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.items?.[idx]?.quantity && (
                    <p className="field-error">{errors.items[idx]?.quantity?.message}</p>
                  )}
                </div>
                <div style={{ paddingTop: idx === 0 ? 16 : 0 }}>
                  {fields.length > 1 && (
                    <button
                      className="btn-icon"
                      type="button"
                      onClick={() => remove(idx)}
                      title="Xóa dòng"
                      style={{ color: '#c0392b' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            {errors.items?.root && <p className="field-error">{errors.items.root.message}</p>}
          </div>

          {/* Error */}
          {createMutation.error && (
            <p style={{ color: '#c0392b', fontSize: '0.88rem' }}>
              Lỗi: {(createMutation.error as Error).message}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <button className="btn-secondary" type="button" onClick={onClose}>
              Huỷ
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.9rem' }}
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Tạo phiếu xuất'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
