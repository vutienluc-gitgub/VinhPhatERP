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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="p-4 rounded-[var(--radius)] bg-[var(--surface-accent)] border border-border mb-3">
            <p className="text-[0.8rem] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-3">
              Thù lao tài xế
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field mb-0">
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
                  <p className="text-xs text-[var(--success)] mt-1">
                    = {formatCurrency(commission)} VND
                  </p>
                )}
              </div>

              <div className="form-field mb-0">
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
              <p className="text-xs text-[var(--text-secondary)] mt-2">
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
          <p className="error-inline mt-2">
            Lỗi: {(deliverMutation.error as Error).message}
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || deliverMutation.isPending}
            className="w-full sm:w-auto justify-center"
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || deliverMutation.isPending}
            className="w-full sm:w-auto justify-center py-3 sm:py-2"
          >
            {deliverMutation.isPending ? 'Đang lưu...' : 'Hoàn tất giao hàng'}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
