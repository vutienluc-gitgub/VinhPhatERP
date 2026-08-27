import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon, NotificationSettingsCard } from '@/shared/components';
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
          <div className="w-10 h-10 rounded-xl bg-danger-soft/10 text-danger flex items-center justify-center shrink-0">
            <Icon name="Bell" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-bold text-lg text-foreground block">
              {SETTINGS_LABELS.NOTIFICATION_TITLE}
            </span>
            <span className="text-xs text-muted">
              {SETTINGS_LABELS.NOTIFICATION_SUBTITLE}
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-6"
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

          {/* Clean Architecture Device Push Management Card */}
          <NotificationSettingsCard />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border/60 bg-surface-secondary/30 flex flex-col justify-between">
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
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-surface-secondary/30 flex flex-col justify-between">
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
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-surface-secondary/30 flex flex-col justify-between">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-field">
              <label
                htmlFor="nf-threshold"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.LOW_STOCK_THRESHOLD}
              </label>
              <div className="relative flex items-center">
                <input
                  id="nf-threshold"
                  className={`field-input pr-10 w-full${errors.low_stock_threshold ? ' border-danger ring-1 ring-danger' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.LOW_STOCK_THRESHOLD}
                  {...register('low_stock_threshold')}
                />
                <span className="pointer-events-none absolute right-3 text-xs font-semibold text-muted select-none">
                  kg
                </span>
              </div>
              {errors.low_stock_threshold && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.low_stock_threshold.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="nf-email"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.NOTIFICATION_EMAIL}
              </label>
              <div className="relative flex items-center">
                <input
                  id="nf-email"
                  className={`field-input pl-9 w-full${errors.notification_email ? ' border-danger ring-1 ring-danger' : ''}`}
                  type="email"
                  placeholder={SETTINGS_PLACEHOLDERS.NOTIFICATION_EMAIL}
                  {...register('notification_email')}
                />
                <div className="pointer-events-none absolute left-3 text-muted">
                  <Icon name="Mail" size={16} />
                </div>
              </div>
              {errors.notification_email && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.notification_email.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
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
