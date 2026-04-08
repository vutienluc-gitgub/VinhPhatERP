import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';

import type { ShippingRate } from '@/features/shipping-rates/types';
import { useActiveShippingRates } from '@/features/shipping-rates/useShippingRates';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';

import {
  emptyShipmentItem,
  shipmentsDefaultValues,
  shipmentsSchema,
} from './shipments.module';
import type { ShipmentsFormValues } from './shipments.module';
import {
  useAvailableFinishedRolls,
  useCreateShipment,
  useDeliveryStaffList,
  useNextShipmentNumber,
} from './useShipments';

type ShipmentFormProps = {
  orderId: string;
  customerId: string;
  orderNumber: string;
  onClose: () => void;
};

function computeShippingCost(
  rate: ShippingRate | undefined,
  totalMeters: number,
): { shippingCost: number; loadingFee: number } {
  if (!rate)
    return {
      shippingCost: 0,
      loadingFee: 0,
    };

  let cost = 0;
  if (rate.rate_per_trip != null) {
    cost = rate.rate_per_trip;
  } else if (rate.rate_per_meter != null) {
    cost = rate.rate_per_meter * totalMeters;
  }

  const total = cost + (rate.loading_fee ?? 0);
  const finalCost =
    rate.min_charge > 0 ? Math.max(total, rate.min_charge) : total;

  return {
    shippingCost: Math.round(finalCost - (rate.loading_fee ?? 0)),
    loadingFee: rate.loading_fee ?? 0,
  };
}

export function ShipmentForm({
  orderId,
  customerId,
  orderNumber,
  onClose,
}: ShipmentFormProps) {
  const { data: nextNumber } = useNextShipmentNumber();
  const { data: availableRolls = [] } = useAvailableFinishedRolls(orderId);
  const { data: shippingRates = [] } = useActiveShippingRates();
  const { data: deliveryStaff = [] } = useDeliveryStaffList();
  const createMutation = useCreateShipment();
  const availableRollById = new Map(
    availableRolls.map((roll) => [roll.id, roll]),
  );
  const shippingRateById = useMemo(
    () => new Map(shippingRates.map((r) => [r.id, r])),
    [shippingRates],
  );

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
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedRateId = watch('shippingRateId');
  const watchedItems = watch('items');

  // Auto-fill shipment number
  useEffect(() => {
    if (nextNumber) setValue('shipmentNumber', nextNumber);
  }, [nextNumber, setValue]);

  // Auto-compute shipping cost when rate changes
  useEffect(() => {
    if (!watchedRateId) return;
    const rate = shippingRateById.get(watchedRateId);
    const totalMeters = watchedItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    );
    const { shippingCost, loadingFee } = computeShippingCost(rate, totalMeters);
    setValue('shippingCost', shippingCost);
    setValue('loadingFee', loadingFee);
  }, [watchedRateId, watchedItems, setValue, shippingRateById]);

  async function onSubmit(values: ShipmentsFormValues) {
    await createMutation.mutateAsync(values);
    reset();
    onClose();
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`Tạo phiếu xuất — ${orderNumber}`}
    >
      <form id="shipment-form" onSubmit={handleSubmit(onSubmit)}>
        {createMutation.error && (
          <p className="error-inline" style={{ marginBottom: '1rem' }}>
            Lỗi: {(createMutation.error as Error).message}
          </p>
        )}

        <div className="form-grid">
          {/* Shipment number + date */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>
                Số phiếu xuất <span className="field-required">*</span>
              </label>
              <input
                className={`field-input${errors.shipmentNumber ? ' is-error' : ''}`}
                {...register('shipmentNumber')}
                readOnly
                style={{ background: 'var(--surface-disabled)' }}
              />
              {errors.shipmentNumber && (
                <p className="field-error">{errors.shipmentNumber.message}</p>
              )}
            </div>
            <div className="form-field">
              <label>
                Ngày giao <span className="field-required">*</span>
              </label>
              <input
                className={`field-input${errors.shipmentDate ? ' is-error' : ''}`}
                type="date"
                {...register('shipmentDate')}
              />
              {errors.shipmentDate && (
                <p className="field-error">{errors.shipmentDate.message}</p>
              )}
            </div>
          </div>

          {/* Delivery address */}
          <div className="form-field">
            <label>Địa chỉ giao</label>
            <input
              className="field-input"
              {...register('deliveryAddress')}
              placeholder="Địa chỉ giao hàng..."
            />
          </div>

          {/* Delivery staff + vehicle */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Nhân viên giao hàng</label>
              <Controller
                name="deliveryStaffId"
                control={control}
                render={({ field }) => {
                  const staffOptions = deliveryStaff.map((staff) => ({
                    value: staff.id,
                    label: staff.full_name,
                    phone: staff.phone || undefined,
                  }));
                  return (
                    <Combobox
                      options={staffOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="— Chưa phân công —"
                    />
                  );
                }}
              />
            </div>
            <div className="form-field">
              <label>Biển số xe</label>
              <input
                className="field-input"
                {...register('vehicleInfo')}
                placeholder="VD: 51C-12345"
              />
            </div>
          </div>

          {/* Shipping rate + cost */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Bảng giá cước</label>
              <Controller
                name="shippingRateId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={shippingRates.map((rate) => ({
                      value: rate.id,
                      label: `${rate.name} — ${rate.destination_area}`,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="— Không áp dụng —"
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label>Chi phí vận chuyển (VNĐ)</label>
              <input
                className="field-input"
                type="number"
                {...register('shippingCost', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Loading fee */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Phí bốc xếp (VNĐ)</label>
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
          <div className="form-field">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <label style={{ margin: 0 }}>
                Dòng hàng <span className="field-required">*</span>
              </label>
            </div>

            {fields.map((field, idx) => (
              <div
                key={field.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 100px 40px',
                  gap: '0.5rem',
                  alignItems: 'start',
                  marginBottom: '1rem',
                  border: '1px solid var(--border)',
                  padding: '1rem',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                }}
              >
                <div
                  style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Dòng {idx + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      className="btn-icon danger"
                      type="button"
                      title="Xóa dòng"
                      onClick={() => remove(idx)}
                      style={{ fontSize: '0.85rem' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Cuộn thành phẩm
                  </span>
                  <Controller
                    name={`items.${idx}.finishedRollId` as const}
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={availableRolls.map((roll) => ({
                          value: roll.id,
                          label: `${roll.status === 'reserved' ? '🔒 ' : ''}${roll.roll_number} — ${roll.fabric_type} ${roll.color_name ? `(${roll.color_name})` : ''} — ${roll.length_m}m`,
                        }))}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          const selectedRoll = availableRollById.get(val || '');
                          if (selectedRoll) {
                            setValue(
                              `items.${idx}.fabricType`,
                              selectedRoll.fabric_type,
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              },
                            );
                          }
                        }}
                        placeholder="— Không chọn —"
                      />
                    )}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Loại vải *
                  </span>
                  <input
                    className="field-input"
                    {...register(`items.${idx}.fabricType`)}
                    placeholder="Loại vải"
                  />
                  {errors.items?.[idx]?.fabricType && (
                    <p className="field-error">
                      {errors.items[idx]?.fabricType?.message}
                    </p>
                  )}
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: '0.2rem',
                    }}
                  >
                    SL (m) *
                  </span>
                  <input
                    className="field-input"
                    type="number"
                    step="0.001"
                    {...register(`items.${idx}.quantity`, {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                  />
                  {errors.items?.[idx]?.quantity && (
                    <p className="field-error">
                      {errors.items[idx]?.quantity?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <button
              className="btn-secondary"
              type="button"
              onClick={() => append({ ...emptyShipmentItem })}
              style={{
                width: '100%',
                marginTop: '0.5rem',
              }}
            >
              + Thêm dòng
            </button>

            {errors.items?.root && (
              <p className="field-error">{errors.items.root.message}</p>
            )}
          </div>
        </div>
        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
          }}
        >
          <button
            className="btn-secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || createMutation.isPending}
          >
            Huỷ
          </button>
          <button
            className="primary-button btn-standard"
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
          >
            {createMutation.isPending ? 'Đang lưu...' : 'Tạo phiếu xuất'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
