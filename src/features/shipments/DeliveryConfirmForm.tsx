import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { useMarkDelivered } from '@/application/shipments';
import {
  deliveryConfirmSchema,
  deliveryConfirmDefaultValues,
  type DeliveryConfirmFormValues,
} from '@/schema/shipment.schema';

import type { Shipment } from './types';

type Props = {
  shipment: Shipment;
  onClose: () => void;
};

export function DeliveryConfirmForm({ shipment, onClose }: Props) {
  const deliverMutation = useMarkDelivered();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryConfirmFormValues>({
    resolver: zodResolver(deliveryConfirmSchema),
    defaultValues: deliveryConfirmDefaultValues,
  });

  async function onSubmit(values: DeliveryConfirmFormValues) {
    await deliverMutation.mutateAsync({
      shipmentId: shipment.id,
      values,
    });
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 data URL for proof storage
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setValue('deliveryProof', result, { shouldValidate: true });
      }
    };
    reader.readAsDataURL(file);
  }

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
            Huỷ
          </Button>
          <button
            className="primary-button btn-standard"
            type="submit"
            disabled={isSubmitting || deliverMutation.isPending}
          >
            {deliverMutation.isPending ? 'Đang lưu...' : 'Hoàn tất giao hàng'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
