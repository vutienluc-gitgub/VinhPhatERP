import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button, Icon, VPSelect } from '@/shared/components';
import {
  uiSettingsSchema,
  uiSettingsDefaults,
  type UiSettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdatePartialSettings,
} from '@/application/settings';

import {
  SETTINGS_LABELS,
  SETTINGS_MESSAGES,
  SETTINGS_PLACEHOLDERS,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
} from './settings.constants';

export function UiSettingsForm() {
  const { data: settings } = useCompanySettings();
  const mutation = useUpdatePartialSettings();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UiSettingsFormValues>({
    resolver: zodResolver(uiSettingsSchema),
    defaultValues: uiSettingsDefaults,
  });

  const currentBrandColor = watch('brand_color');

  useEffect(() => {
    if (settings) {
      reset({
        theme_mode:
          (settings.theme_mode as UiSettingsFormValues['theme_mode']) ||
          uiSettingsDefaults.theme_mode,
        language:
          (settings.language as UiSettingsFormValues['language']) ||
          uiSettingsDefaults.language,
        print_logo_url:
          settings.print_logo_url || uiSettingsDefaults.print_logo_url,
        brand_color: settings.brand_color || uiSettingsDefaults.brand_color,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: UiSettingsFormValues) {
    await mutation.mutateAsync(values as Record<string, string>);
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
            <Icon name="Palette" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-bold text-lg text-foreground block">
              {SETTINGS_LABELS.UI_TITLE}
            </span>
            <span className="text-xs text-muted">
              {SETTINGS_LABELS.UI_SUBTITLE}
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
                htmlFor="ui-theme"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.THEME_MODE}
              </label>
              <Controller
                name="theme_mode"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    id="ui-theme"
                    options={THEME_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={!!errors.theme_mode}
                    className="w-full"
                  />
                )}
              />
              {errors.theme_mode && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.theme_mode.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="ui-lang"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.LANGUAGE}
              </label>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    id="ui-lang"
                    options={LANGUAGE_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={!!errors.language}
                    className="w-full"
                  />
                )}
              />
              {errors.language && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.language.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="ui-brand"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.BRAND_COLOR}
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="ui-brand-picker"
                  type="color"
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer shrink-0 p-0"
                  value={currentBrandColor}
                  onChange={(e) =>
                    setValue('brand_color', e.target.value, {
                      shouldDirty: true,
                    })
                  }
                />
                <input
                  id="ui-brand"
                  className={`field-input flex-1${errors.brand_color ? ' border-danger ring-1 ring-danger' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.BRAND_COLOR}
                  {...register('brand_color')}
                />
              </div>
              {errors.brand_color && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.brand_color.message}
                </span>
              )}
            </div>
          </div>

          <div className="form-field">
            <label
              htmlFor="ui-print-logo"
              className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
            >
              {SETTINGS_LABELS.PRINT_LOGO_URL}
            </label>
            <input
              id="ui-print-logo"
              className={`field-input w-full${errors.print_logo_url ? ' border-danger ring-1 ring-danger' : ''}`}
              type="text"
              placeholder={SETTINGS_PLACEHOLDERS.PRINT_LOGO_URL}
              {...register('print_logo_url')}
            />
            {errors.print_logo_url && (
              <span className="field-error text-xs text-danger mt-1 block">
                {errors.print_logo_url.message}
              </span>
            )}
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
