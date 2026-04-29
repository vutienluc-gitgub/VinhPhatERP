import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import {
  integrationSettingsSchema,
  integrationSettingsDefaults,
  type IntegrationSettingsFormValues,
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

export function IntegrationSettingsForm() {
  const { data: settings } = useCompanySettings();
  const mutation = useUpdatePartialSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<IntegrationSettingsFormValues>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: integrationSettingsDefaults,
  });

  useEffect(() => {
    if (settings) {
      reset({
        webhook_url:
          settings.webhook_url || integrationSettingsDefaults.webhook_url,
        smtp_host: settings.smtp_host || integrationSettingsDefaults.smtp_host,
        smtp_port: settings.smtp_port || integrationSettingsDefaults.smtp_port,
        smtp_from_email:
          settings.smtp_from_email ||
          integrationSettingsDefaults.smtp_from_email,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: IntegrationSettingsFormValues) {
    await mutation.mutateAsync(values as Record<string, string>);
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <Icon name="Plug" size={20} strokeWidth={1.5} />
          </div>
          <span className="font-bold text-lg">
            {SETTINGS_LABELS.INTEGRATION_TITLE}
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

          <div className="form-field">
            <label htmlFor="ig-webhook">{SETTINGS_LABELS.WEBHOOK_URL}</label>
            <input
              id="ig-webhook"
              className={`field-input${errors.webhook_url ? ' is-error' : ''}`}
              type="text"
              placeholder={SETTINGS_PLACEHOLDERS.WEBHOOK_URL}
              {...register('webhook_url')}
            />
            <p className="text-xs text-muted mt-1 italic">
              {SETTINGS_LABELS.WEBHOOK_URL_DESC}
            </p>
            {errors.webhook_url && (
              <span className="field-error">{errors.webhook_url.message}</span>
            )}
          </div>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <div className="form-field">
              <label htmlFor="ig-smtp-host">{SETTINGS_LABELS.SMTP_HOST}</label>
              <input
                id="ig-smtp-host"
                className={`field-input${errors.smtp_host ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.SMTP_HOST}
                {...register('smtp_host')}
              />
              {errors.smtp_host && (
                <span className="field-error">{errors.smtp_host.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="ig-smtp-port">{SETTINGS_LABELS.SMTP_PORT}</label>
              <input
                id="ig-smtp-port"
                className={`field-input${errors.smtp_port ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.SMTP_PORT}
                {...register('smtp_port')}
              />
              {errors.smtp_port && (
                <span className="field-error">{errors.smtp_port.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="ig-smtp-email">
                {SETTINGS_LABELS.SMTP_FROM_EMAIL}
              </label>
              <input
                id="ig-smtp-email"
                className={`field-input${errors.smtp_from_email ? ' is-error' : ''}`}
                type="email"
                placeholder={SETTINGS_PLACEHOLDERS.SMTP_FROM_EMAIL}
                {...register('smtp_from_email')}
              />
              {errors.smtp_from_email && (
                <span className="field-error">
                  {errors.smtp_from_email.message}
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
