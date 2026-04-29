import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import { Switch } from '@/shared/components/Switch';
import {
  notificationSettingsSchema,
  notificationSettingsDefaults,
  type NotificationSettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdatePartialSettings,
} from '@/application/settings';

import {
  SETTINGS_LABELS,
  SETTINGS_MESSAGES,
  SETTINGS_PLACEHOLDERS,
} from './settings.constants';

export function NotificationSettingsForm() {
  const { data: settings } = useCompanySettings();
  const mutation = useUpdatePartialSettings();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: notificationSettingsDefaults,
  });

  const notifyNewOrder = watch('notify_new_order');
  const notifyOverdue = watch('notify_payment_overdue');
  const notifyLowStock = watch('notify_low_stock');

  useEffect(() => {
    if (settings) {
      reset({
        notify_new_order:
          (settings.notify_new_order as 'true' | 'false') ||
          notificationSettingsDefaults.notify_new_order,
        notify_payment_overdue:
          (settings.notify_payment_overdue as 'true' | 'false') ||
          notificationSettingsDefaults.notify_payment_overdue,
        notify_low_stock:
          (settings.notify_low_stock as 'true' | 'false') ||
          notificationSettingsDefaults.notify_low_stock,
        low_stock_threshold:
          settings.low_stock_threshold ||
          notificationSettingsDefaults.low_stock_threshold,
        notification_email:
          settings.notification_email ||
          notificationSettingsDefaults.notification_email,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: NotificationSettingsFormValues) {
    await mutation.mutateAsync(values as Record<string, string>);
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Icon name="Bell" size={20} strokeWidth={1.5} />
          </div>
          <span className="font-bold text-lg">
            {SETTINGS_LABELS.NOTIFICATION_TITLE}
          </span>
        </div>
      </div>
      <div className="p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="form-grid gap-4"
        >
          {mutation.isSuccess && (
            <div className="success-inline">
              <Icon name="CheckCircle2" size={16} strokeWidth={2} />
              {SETTINGS_MESSAGES.SAVE_SUCCESS}
            </div>
          )}

          {mutation.error && (
            <p className="error-inline">
              {SETTINGS_MESSAGES.SAVE_ERROR}{' '}
              {mutation.error instanceof Error
                ? mutation.error.message
                : String(mutation.error)}
            </p>
          )}

          <div className="flex flex-col gap-5 max-w-lg">
            <Switch
              id="nf-new-order"
              checked={notifyNewOrder === 'true'}
              onChange={(val) =>
                setValue('notify_new_order', val ? 'true' : 'false', {
                  shouldDirty: true,
                })
              }
              label={SETTINGS_LABELS.NOTIFY_NEW_ORDER}
              description={SETTINGS_LABELS.NOTIFY_NEW_ORDER_DESC}
            />

            <Switch
              id="nf-overdue"
              checked={notifyOverdue === 'true'}
              onChange={(val) =>
                setValue('notify_payment_overdue', val ? 'true' : 'false', {
                  shouldDirty: true,
                })
              }
              label={SETTINGS_LABELS.NOTIFY_PAYMENT_OVERDUE}
              description={SETTINGS_LABELS.NOTIFY_PAYMENT_OVERDUE_DESC}
            />

            <Switch
              id="nf-low-stock"
              checked={notifyLowStock === 'true'}
              onChange={(val) =>
                setValue('notify_low_stock', val ? 'true' : 'false', {
                  shouldDirty: true,
                })
              }
              label={SETTINGS_LABELS.NOTIFY_LOW_STOCK}
              description={SETTINGS_LABELS.NOTIFY_LOW_STOCK_DESC}
            />
          </div>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div className="form-field">
              <label htmlFor="nf-threshold">
                {SETTINGS_LABELS.LOW_STOCK_THRESHOLD}
              </label>
              <input
                id="nf-threshold"
                className={`field-input${errors.low_stock_threshold ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.LOW_STOCK_THRESHOLD}
                {...register('low_stock_threshold')}
              />
              {errors.low_stock_threshold && (
                <span className="field-error">
                  {errors.low_stock_threshold.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="nf-email">
                {SETTINGS_LABELS.NOTIFICATION_EMAIL}
              </label>
              <input
                id="nf-email"
                className={`field-input${errors.notification_email ? ' is-error' : ''}`}
                type="email"
                placeholder={SETTINGS_PLACEHOLDERS.NOTIFICATION_EMAIL}
                {...register('notification_email')}
              />
              {errors.notification_email && (
                <span className="field-error">
                  {errors.notification_email.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              disabled={isSubmitting || !isDirty}
              onClick={() => settings && reset()}
            >
              {SETTINGS_LABELS.BTN_UNDO}
            </Button>
            <button
              className="primary-button btn-standard"
              type="submit"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting
                ? SETTINGS_LABELS.BTN_SAVING
                : SETTINGS_LABELS.BTN_SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
