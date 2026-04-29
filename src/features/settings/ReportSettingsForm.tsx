import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import {
  reportSettingsSchema,
  reportSettingsDefaults,
  type ReportSettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdatePartialSettings,
} from '@/application/settings';

import {
  SETTINGS_LABELS,
  SETTINGS_MESSAGES,
  SETTINGS_PLACEHOLDERS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
} from './settings.constants';

export function ReportSettingsForm() {
  const { data: settings } = useCompanySettings();
  const mutation = useUpdatePartialSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ReportSettingsFormValues>({
    resolver: zodResolver(reportSettingsSchema),
    defaultValues: reportSettingsDefaults,
  });

  useEffect(() => {
    if (settings) {
      reset({
        timezone: settings.timezone || reportSettingsDefaults.timezone,
        fiscal_year_start:
          settings.fiscal_year_start ||
          reportSettingsDefaults.fiscal_year_start,
        date_format:
          (settings.date_format as ReportSettingsFormValues['date_format']) ||
          reportSettingsDefaults.date_format,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: ReportSettingsFormValues) {
    await mutation.mutateAsync(values as Record<string, string>);
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
            <Icon name="BarChart3" size={20} strokeWidth={1.5} />
          </div>
          <span className="font-bold text-lg">
            {SETTINGS_LABELS.REPORT_TITLE}
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

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <div className="form-field">
              <label htmlFor="rp-timezone">{SETTINGS_LABELS.TIMEZONE}</label>
              <select
                id="rp-timezone"
                className="field-select w-full"
                {...register('timezone')}
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="rp-fiscal">
                {SETTINGS_LABELS.FISCAL_YEAR_START}
              </label>
              <input
                id="rp-fiscal"
                className={`field-input${errors.fiscal_year_start ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.FISCAL_YEAR_START}
                {...register('fiscal_year_start')}
              />
              {errors.fiscal_year_start && (
                <span className="field-error">
                  {errors.fiscal_year_start.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="rp-date-fmt">{SETTINGS_LABELS.DATE_FORMAT}</label>
              <select
                id="rp-date-fmt"
                className="field-select w-full"
                {...register('date_format')}
              >
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
