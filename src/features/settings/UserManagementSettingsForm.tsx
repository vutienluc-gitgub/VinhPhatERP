import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import { Switch } from '@/shared/components/Switch';
import {
  userMgmtSettingsSchema,
  userMgmtSettingsDefaults,
  type UserMgmtSettingsFormValues,
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

export function UserManagementSettingsForm() {
  const { data: settings } = useCompanySettings();
  const mutation = useUpdatePartialSettings();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserMgmtSettingsFormValues>({
    resolver: zodResolver(userMgmtSettingsSchema),
    defaultValues: userMgmtSettingsDefaults,
  });

  const allowSignup = watch('allow_self_signup');
  const requireApproval = watch('require_account_approval');

  useEffect(() => {
    if (settings) {
      reset({
        allow_self_signup:
          (settings.allow_self_signup as 'true' | 'false') ||
          userMgmtSettingsDefaults.allow_self_signup,
        require_account_approval:
          (settings.require_account_approval as 'true' | 'false') ||
          userMgmtSettingsDefaults.require_account_approval,
        session_timeout_minutes:
          settings.session_timeout_minutes ||
          userMgmtSettingsDefaults.session_timeout_minutes,
        max_concurrent_devices:
          settings.max_concurrent_devices ||
          userMgmtSettingsDefaults.max_concurrent_devices,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: UserMgmtSettingsFormValues) {
    await mutation.mutateAsync(values as Record<string, string>);
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
            <Icon name="Users" size={20} strokeWidth={1.5} />
          </div>
          <span className="font-bold text-lg">
            {SETTINGS_LABELS.USER_MGMT_TITLE}
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
              id="um-signup"
              checked={allowSignup === 'true'}
              onChange={(val) =>
                setValue('allow_self_signup', val ? 'true' : 'false', {
                  shouldDirty: true,
                })
              }
              label={SETTINGS_LABELS.ALLOW_SELF_SIGNUP}
              description={SETTINGS_LABELS.ALLOW_SELF_SIGNUP_DESC}
            />

            <Switch
              id="um-approval"
              checked={requireApproval === 'true'}
              onChange={(val) =>
                setValue('require_account_approval', val ? 'true' : 'false', {
                  shouldDirty: true,
                })
              }
              label={SETTINGS_LABELS.REQUIRE_APPROVAL}
              description={SETTINGS_LABELS.REQUIRE_APPROVAL_DESC}
            />
          </div>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div className="form-field">
              <label htmlFor="um-timeout">
                {SETTINGS_LABELS.SESSION_TIMEOUT}
              </label>
              <input
                id="um-timeout"
                className={`field-input${errors.session_timeout_minutes ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.SESSION_TIMEOUT}
                {...register('session_timeout_minutes')}
              />
              {errors.session_timeout_minutes && (
                <span className="field-error">
                  {errors.session_timeout_minutes.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="um-devices">{SETTINGS_LABELS.MAX_DEVICES}</label>
              <input
                id="um-devices"
                className={`field-input${errors.max_concurrent_devices ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.MAX_DEVICES}
                {...register('max_concurrent_devices')}
              />
              {errors.max_concurrent_devices && (
                <span className="field-error">
                  {errors.max_concurrent_devices.message}
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
