import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
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
          <span className="font-bold text-lg">{SETTINGS_LABELS.UI_TITLE}</span>
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
              <label htmlFor="ui-theme">{SETTINGS_LABELS.THEME_MODE}</label>
              <select
                id="ui-theme"
                className="field-select w-full"
                {...register('theme_mode')}
              >
                {THEME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="ui-lang">{SETTINGS_LABELS.LANGUAGE}</label>
              <select
                id="ui-lang"
                className="field-select w-full"
                {...register('language')}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="ui-brand">{SETTINGS_LABELS.BRAND_COLOR}</label>
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
                  className={`field-input flex-1${errors.brand_color ? ' is-error' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.BRAND_COLOR}
                  {...register('brand_color')}
                />
              </div>
              {errors.brand_color && (
                <span className="field-error">
                  {errors.brand_color.message}
                </span>
              )}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="ui-print-logo">
              {SETTINGS_LABELS.PRINT_LOGO_URL}
            </label>
            <input
              id="ui-print-logo"
              className={`field-input${errors.print_logo_url ? ' is-error' : ''}`}
              type="text"
              placeholder={SETTINGS_PLACEHOLDERS.PRINT_LOGO_URL}
              {...register('print_logo_url')}
            />
            {errors.print_logo_url && (
              <span className="field-error">
                {errors.print_logo_url.message}
              </span>
            )}
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
