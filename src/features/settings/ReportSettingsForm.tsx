import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button, Icon, VPSelect } from '@/shared/components';
import {
  reportSettingsSchema,
  reportSettingsDefaults,
  type ReportSettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdatePartialSettings,
} from '@/application/settings';

import { PanelIcon } from './PanelIcon';
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
    control,
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
          <PanelIcon name="BarChart3" variant="info" />
          <div>
            <span className="font-bold text-lg text-foreground block">
              {SETTINGS_LABELS.REPORT_TITLE}
            </span>
            <span className="text-xs text-foreground/75 font-medium">
              {SETTINGS_LABELS.REPORT_SUBTITLE}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="form-field">
              <label
                htmlFor="rp-timezone"
                className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.TIMEZONE}
              </label>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    id="rp-timezone"
                    options={TIMEZONE_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={!!errors.timezone}
                    className="w-full"
                  />
                )}
              />
              {errors.timezone && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.timezone.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="rp-fiscal"
                className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.FISCAL_YEAR_START}
              </label>
              <input
                id="rp-fiscal"
                className={`field-input w-full${errors.fiscal_year_start ? ' border-danger ring-1 ring-danger' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.FISCAL_YEAR_START}
                {...register('fiscal_year_start')}
              />
              {errors.fiscal_year_start && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.fiscal_year_start.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="rp-date-fmt"
                className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DATE_FORMAT}
              </label>
              <Controller
                name="date_format"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    id="rp-date-fmt"
                    options={DATE_FORMAT_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={!!errors.date_format}
                    className="w-full"
                  />
                )}
              />
              {errors.date_format && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.date_format.message}
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
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting
                ? SETTINGS_LABELS.BTN_SAVING
                : SETTINGS_LABELS.BTN_SAVE}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
