import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
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
  useDeliveryStaffList,
  useNextShipmentNumber,
} from './useShipments'
import { useActiveShippingRates } from '@/features/shipping-rates/useShippingRates'
import type { ShippingRate } from '@/features/shipping-rates/types'

type ShipmentFormProps = {
  orderId: string
  customerId: string
  orderNumber: string
  onClose: () => void
}

function computeShippingCost(rate: ShippingRate | undefined, totalMeters: number): { shippingCost: number; loadingFee: number } {
  if (!rate) return { shippingCost: 0, loadingFee: 0 }

  let cost = 0
  if (rate.rate_per_trip != null) {
    cost = rate.rate_per_trip
  } else if (rate.rate_per_meter != null) {
    cost = rate.rate_per_meter * totalMeters
  }

  const total = cost + (rate.loading_fee ?? 0)
  const finalCost = rate.min_charge > 0 ? Math.max(total, rate.min_charge) : total

  return {
    shippingCost: Math.round(finalCost - (rate.loading_fee ?? 0)),
    loadingFee: rate.loading_fee ?? 0,
  }
}

export function ShipmentForm({ orderId, customerId, orderNumber, onClose }: ShipmentFormProps) {
  const { data: nextNumber } = useNextShipmentNumber()
  const { data: availableRolls = [] } = useAvailableFinishedRolls(orderId)
  const { data: shippingRates = [] } = useActiveShippingRates()
  const { data: deliveryStaff = [] } = useDeliveryStaffList()
  const createMutation = useCreateShipment()
  const availableRollById = new Map(availableRolls.map((roll) => [roll.id, roll]))
  const shippingRateById = useMemo(() => new Map(shippingRates.map((r) => [r.id, r])), [shippingRates])

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
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

  const watchedRateId = watch('shippingRateId')
  const watchedItems = watch('items')

  // Auto-fill shipment number
  useEffect(() => {
    if (nextNumber) setValue('shipmentNumber', nextNumber)
  }, [nextNumber, setValue])

  // Auto-compute shipping cost when rate changes
  useEffect(() => {
    if (!watchedRateId) return
    const rate = shippingRateById.get(watchedRateId)
    const totalMeters = watchedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
    const { shippingCost, loadingFee } = computeShippingCost(rate, totalMeters)
    setValue('shippingCost', shippingCost)
    setValue('loadingFee', loadingFee)
  }, [watchedRateId, watchedItems, setValue, shippingRateById])

  async function onSubmit(values: ShipmentsFormValues) {
    await createMutation.mutateAsync(values)
    reset()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>Tạo phiếu xuất — {orderNumber}</h3>
          <button className="btn-icon" type="button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Shipment number + date */}
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

          {/* Delivery staff + vehicle */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Nhân viên giao hàng</label>
              <select className="field-select" {...register('deliveryStaffId')}>
                <option value="">— Chưa phân công —</option>
                {deliveryStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name}{staff.phone ? ` (${staff.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Biển số xe</label>
              <input className="field-input" {...register('vehicleInfo')} placeholder="VD: 51C-12345" />
            </div>
          </div>

          {/* Shipping rate + cost */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Bảng giá cước</label>
              <select className="field-select" {...register('shippingRateId')}>
                <option value="">— Không áp dụng —</option>
                {shippingRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.name} — {rate.destination_area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Chi phí vận chuyển (VNĐ)</label>
              <input
                className="field-input"
                type="number"
                {...register('shippingCost', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Loading fee */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Phí bốc xếp (VNĐ)</label>
              <input
                className="field-input"
                type="number"
                {...register('loadingFee', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div />
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '0.4rem',
                  alignItems: 'start',
                  marginBottom: '0.4rem',
                }}
              >
                <div style={{ gridColumn: 'span 1' }}>
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
                        {roll.status === 'reserved' ? '🔒 ' : ''}{roll.roll_number} — {roll.fabric_type} {roll.color_name ? `(${roll.color_name})` : ''} — {roll.length_m}m
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                  {idx === 0 && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Loại vải *</span>}
                  <input className="field-input" {...register(`items.${idx}.fabricType`)} placeholder="Loại vải" />
                  {errors.items?.[idx]?.fabricType && (
                    <p className="field-error">{errors.items[idx]?.fabricType?.message}</p>
                  )}
                </div>
                <div style={{ minWidth: 80 }}>
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
                <div style={{ paddingTop: idx === 0 ? 16 : 0, minWidth: 36, flexShrink: 0 }}>
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
