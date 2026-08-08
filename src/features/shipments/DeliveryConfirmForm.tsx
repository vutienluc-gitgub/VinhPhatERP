import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { VPCombobox } from '@/shared/components';
import { useMarkDelivered } from '@/application/shipments';
import { useActivePaymentAccounts } from '@/shared/hooks/usePaymentAccountOptions';
import {
  deliveryConfirmSchema,
  deliveryConfirmDefaultValues,
  type DeliveryConfirmFormValues,
} from '@/schema/shipment.schema';
import { NumericInput } from '@/shared/value';

import {
  SHIPMENT_FORM_MESSAGES,
  DELIVERY_CONFIRM_MESSAGES as MSG,
} from './shipments.constants';
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
      expectedUpdatedAt: shipment.updated_at ?? undefined,
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
      title={MSG.TITLE(shipment.shipment_number)}
      maxWidth={500}
    >
      <form id="delivery-confirm-form" onSubmit={handleSubmit(onSubmit)}>
        {/* Receiver info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label className="form-label" htmlFor="receiverName">
              {MSG.LBL_RECEIVER_NAME} <span className="field-required">*</span>
            </label>
            <input
              id="receiverName"
              className={`field-input${errors.receiverName ? ' border-danger' : ''}`}
              {...register('receiverName')}
              placeholder={MSG.PLC_RECEIVER_NAME}
            />
            {errors.receiverName && (
              <span className="field-error">{errors.receiverName.message}</span>
            )}
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="receiverPhone">
              {MSG.LBL_RECEIVER_PHONE}
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
            {MSG.LBL_RECEIVER_SIGNATURE}{' '}
            <span className="field-required">*</span>
          </label>
          <input
            className={`field-input${errors.deliveryProof ? ' border-danger' : ''}`}
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
            <p className="text-[0.8rem] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.06em] mb-3">
              {MSG.LBL_DRIVER_FEE}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="driverCommission"
                control={control}
                render={({ field }) => (
                  <NumericInput
                    id="driverCommission"
                    className="field-input"
                    min={0}
                    step={10000}
                    placeholder="0"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />

              <div className="form-field mb-0">
                <label className="form-label">{MSG.LBL_BANK_ACCOUNT}</label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <VPCombobox
                      options={accountOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={MSG.PLC_BANK_ACCOUNT}
                    />
                  )}
                />
              </div>
            </div>
            {commission > 0 && (
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                {MSG.HELP_FEE_EXPENSE}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="form-field">
          <label className="form-label" htmlFor="notes">
            {MSG.LBL_NOTES}
          </label>
          <textarea
            id="notes"
            className="field-textarea"
            rows={2}
            {...register('notes')}
            placeholder={MSG.PLC_NOTES}
          />
        </div>

        {/* Error */}
        {deliverMutation.error && (
          <p className="error-inline mt-2">
            {SHIPMENT_FORM_MESSAGES.ERR_TITLE}{' '}
            {deliverMutation.error instanceof Error
              ? deliverMutation.error.message
              : String(deliverMutation.error)}
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
            {MSG.BTN_CANCEL}
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || deliverMutation.isPending}
            className="w-full sm:w-auto justify-center py-3 sm:py-2"
          >
            {deliverMutation.isPending ? MSG.BTN_SAVING : MSG.BTN_COMPLETE}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
