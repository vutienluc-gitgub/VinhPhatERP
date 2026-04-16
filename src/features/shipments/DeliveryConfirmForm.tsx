import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { useMarkDelivered } from '@/application/shipments';
import { useActivePaymentAccounts } from '@/shared/hooks/usePaymentAccountOptions';
import {
  deliveryConfirmSchema,
  deliveryConfirmDefaultValues,
  type DeliveryConfirmFormValues,
} from '@/schema/shipment.schema';
import { formatCurrency } from '@/shared/utils/format';

import type { Shipment } from './types';

type Props = {
  shipment: Shipment;
  onClose: () => void;
};

export function DeliveryConfirmForm({ shipment, onClose }: Props) {
  const deliverMutation = useMarkDelivered();
  const { data: accounts = [] } = useActivePaymentAccounts('bank');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryConfirmFormValues>({
    resolver: zodResolver(deliveryConfirmSchema),
    defaultValues: deliveryConfirmDefaultValues,
  });

  const commission = watch('driverCommission') ?? 0;
  const hasDriver = !!shipment.delivery_staff_id;

  async function onSubmit(values: DeliveryConfirmFormValues) {
    await deliverMutation.mutateAsync({
      shipmentId: shipment.id,
      values,
      employeeId: shipment.delivery_staff_id ?? undefined,
    });
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setValue('deliveryProof', result, { shouldValidate: true });
      }
    };
    reader.readAsDataURL(file);
  }

  const accountOptions = accounts
    .filter((a) => a.type === 'bank')
    .map((a) => ({
      value: a.id,
      label: a.bank_name ? `${a.name} — ${a.bank_name}` : a.name,
    }));

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`Xác nhận giao hàng — ${shipment.shipment_number}`}
      maxWidth={500}
    >
      <form id="delivery-confirm-form" onSubmit={handleSubmit(onSubmit)}>
        {/* Receiver info */}
        <div
          className="form-grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          <div className="form-field">
            <label className="form-label" htmlFor="receiverName">
              Tên người nhận <span className="field-required">*</span>
            </label>
            <input
              id="receiverName"
              className={`field-input${errors.receiverName ? ' is-error' : ''}`}
              {...register('receiverName')}
              placeholder="Họ tên người nhận hàng"
            />
            {errors.receiverName && (
              <span className="field-error">{errors.receiverName.message}</span>
            )}
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="receiverPhone">
              SĐT người nhận
            </label>
            <input
              id="receiverPhone"
              className="field-input"
              {...register('receiverPhone')}
              placeholder="0901..."
            />
          </div>
        </div>

        {/* Photo proof */}
        <div className="form-field">
          <label className="form-label">
            Ảnh biên nhận / chữ ký <span className="field-required">*</span>
          </label>
          <input
            className={`field-input${errors.deliveryProof ? ' is-error' : ''}`}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
          />
          {errors.deliveryProof && (
            <span className="field-error">{errors.deliveryProof.message}</span>
          )}
          <input type="hidden" {...register('deliveryProof')} />
        </div>

        {/* Driver commission section */}
        {hasDriver && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius)',
              background: 'var(--surface-accent)',
              border: '1px solid var(--border)',
              marginBottom: '0.75rem',
            }}
          >
            <p
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.75rem',
              }}
            >
              Thù lao tài xế
            </p>
            <div
              className="form-grid"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              }}
            >
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="driverCommission">
                  Số tiền thù lao (VNĐ)
                </label>
                <input
                  id="driverCommission"
                  className="field-input"
                  type="number"
                  min={0}
                  step={10000}
                  {...register('driverCommission', { valueAsNumber: true })}
                  placeholder="0"
                />
                {commission > 0 && (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--success)',
                      marginTop: '4px',
                    }}
                  >
                    = {formatCurrency(commission)} VND
                  </p>
                )}
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Tài khoản ngân hàng</label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={accountOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="— Chọn tài khoản —"
                    />
                  )}
                />
              </div>
            </div>
            {commission > 0 && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.5rem',
                }}
              >
                Hệ thống sẽ tự động tạo phiếu chi danh mục Logistics khi hoàn
                tất giao hàng.
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="form-field">
          <label className="form-label" htmlFor="notes">
            Ghi chú
          </label>
          <textarea
            id="notes"
            className="field-textarea"
            rows={2}
            {...register('notes')}
            placeholder="Ghi chú thêm..."
          />
        </div>

        {/* Error */}
        {deliverMutation.error && (
          <p className="error-inline" style={{ marginTop: '0.5rem' }}>
            Lỗi: {(deliverMutation.error as Error).message}
          </p>
        )}

        {/* Actions */}
        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
          }}
        >
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || deliverMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || deliverMutation.isPending}
          >
            {deliverMutation.isPending ? 'Đang lưu...' : 'Hoàn tất giao hàng'}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
