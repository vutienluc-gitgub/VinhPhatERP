import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import { Switch } from '@/shared/components/Switch';
import {
  companySettingsSchema,
  companySettingsDefaultValues,
  type CompanySettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from '@/application/settings';

import {
  SETTINGS_LABELS,
  SETTINGS_MESSAGES,
  SETTINGS_PLACEHOLDERS,
  USER_ROLE_OPTIONS,
} from './settings.constants';

type Props = {
  isAdmin: boolean;
  fluidLayout: boolean;
  onFluidLayoutChange: (val: boolean) => void;
};

export function CompanySettingsForm({
  isAdmin,
  fluidLayout,
  onFluidLayoutChange,
}: Props) {
  const { data: settings } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: companySettingsDefaultValues,
  });

  // Populate form when data is loaded
  useEffect(() => {
    if (settings) {
      reset(settings as CompanySettingsFormValues);
    }
  }, [settings, reset]);

  async function onSubmit(values: CompanySettingsFormValues) {
    await updateMutation.mutateAsync(values);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* ── Thông tin công ty ── */}
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Icon name="Building2" size={20} strokeWidth={1.5} />
            </div>
            <span className="font-bold text-lg">
              {SETTINGS_LABELS.COMPANY_INFO_TITLE}
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="form-grid gap-4">
            {/* Success / Error feedback */}
            {updateMutation.isSuccess && (
              <div className="success-inline">
                <Icon name="CheckCircle2" size={16} strokeWidth={2} />
                {SETTINGS_MESSAGES.SAVE_SUCCESS}
              </div>
            )}

            {updateMutation.error && (
              <p className="error-inline">
                {SETTINGS_MESSAGES.SAVE_ERROR}{' '}
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : String(updateMutation.error)}
              </p>
            )}

            {/* Tên công ty + MST */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <div className="form-field">
                <label htmlFor="cs-company-name">
                  {SETTINGS_LABELS.COMPANY_NAME}{' '}
                  <span className="field-required">*</span>
                </label>
                <input
                  id="cs-company-name"
                  className={`field-input${errors.company_name ? ' is-error' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.COMPANY_NAME}
                  {...register('company_name')}
                />
                {errors.company_name && (
                  <span className="field-error">
                    {errors.company_name.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="cs-tax-code">{SETTINGS_LABELS.TAX_CODE}</label>
                <input
                  id="cs-tax-code"
                  className={`field-input${errors.tax_code ? ' is-error' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.TAX_CODE}
                  {...register('tax_code')}
                />
                {errors.tax_code && (
                  <span className="field-error">{errors.tax_code.message}</span>
                )}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="form-field">
              <label htmlFor="cs-address">
                {SETTINGS_LABELS.ADDRESS}{' '}
                <span className="field-required">*</span>
              </label>
              <input
                id="cs-address"
                className={`field-input${errors.address ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.ADDRESS}
                {...register('address')}
              />
              {errors.address && (
                <span className="field-error">{errors.address.message}</span>
              )}
            </div>

            {/* SĐT + Email */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <div className="form-field">
                <label htmlFor="cs-phone">{SETTINGS_LABELS.PHONE}</label>
                <input
                  id="cs-phone"
                  className={`field-input${errors.phone ? ' is-error' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.PHONE}
                  {...register('phone')}
                />
                {errors.phone && (
                  <span className="field-error">{errors.phone.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="cs-email">{SETTINGS_LABELS.EMAIL}</label>
                <input
                  id="cs-email"
                  className={`field-input${errors.email ? ' is-error' : ''}`}
                  type="email"
                  placeholder={SETTINGS_PLACEHOLDERS.EMAIL}
                  {...register('email')}
                />
                {errors.email && (
                  <span className="field-error">{errors.email.message}</span>
                )}
              </div>
            </div>

            {/* Website + Logo */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <div className="form-field">
                <label htmlFor="cs-website">{SETTINGS_LABELS.WEBSITE}</label>
                <input
                  id="cs-website"
                  className="field-input"
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.WEBSITE}
                  {...register('website')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="cs-logo">{SETTINGS_LABELS.LOGO_URL}</label>
                <input
                  id="cs-logo"
                  className="field-input"
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.LOGO_URL}
                  {...register('logo_url')}
                />
              </div>
            </div>

            {/* Bank info */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <div className="form-field">
                <label htmlFor="cs-bank-name">
                  {SETTINGS_LABELS.BANK_NAME}
                </label>
                <input
                  id="cs-bank-name"
                  className="field-input"
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.BANK_NAME}
                  {...register('bank_name')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="cs-bank-account">
                  {SETTINGS_LABELS.BANK_ACCOUNT}
                </label>
                <input
                  id="cs-bank-account"
                  className="field-input"
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.BANK_ACCOUNT}
                  {...register('bank_account')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hiển thị hệ thống ── */}
      {isAdmin && (
        <div className="panel-card card-flush">
          <div className="card-header-area">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Icon name="LayoutTemplate" size={20} strokeWidth={1.5} />
              </div>
              <span className="font-bold text-lg">
                {SETTINGS_LABELS.SYSTEM_DISPLAY_TITLE}
              </span>
            </div>
          </div>
          <div className="p-6 flex flex-col gap-6">
            <div className="max-w-lg">
              <Switch
                id="layout-mode-switch"
                checked={fluidLayout}
                onChange={onFluidLayoutChange}
                label={SETTINGS_LABELS.FLUID_LAYOUT_LABEL}
                description={SETTINGS_LABELS.FLUID_LAYOUT_DESC}
              />
            </div>

            <div className="form-field max-w-lg">
              <label htmlFor="cs-default-role">
                {SETTINGS_LABELS.DEFAULT_USER_ROLE}
              </label>
              <select
                id="cs-default-role"
                className={`field-select w-full ${errors.default_user_role ? 'is-error' : ''}`}
                {...register('default_user_role')}
              >
                {USER_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.default_user_role && (
                <p className="field-error">
                  {errors.default_user_role.message}
                </p>
              )}
              <p className="text-xs text-muted mt-1 italic">
                {SETTINGS_MESSAGES.DEFAULT_ROLE_HINT}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          variant="secondary"
          type="button"
          className="w-full sm:w-auto"
          disabled={isSubmitting || !isDirty}
          onClick={() =>
            settings && reset(settings as CompanySettingsFormValues)
          }
        >
          {SETTINGS_LABELS.BTN_UNDO}
        </Button>
        <button
          className="primary-button btn-standard w-full sm:w-auto"
          type="submit"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? SETTINGS_LABELS.BTN_SAVING : SETTINGS_LABELS.BTN_SAVE}
        </button>
      </div>
    </form>
  );
}
