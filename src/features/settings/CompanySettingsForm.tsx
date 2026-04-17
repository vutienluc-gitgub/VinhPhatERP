import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import {
  companySettingsSchema,
  companySettingsDefaultValues,
  type CompanySettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from '@/application/settings';
import { Combobox } from '@/shared/components/Combobox';

export function CompanySettingsForm() {
  const { data: settings, isLoading, error: loadError } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  const {
    register,
    handleSubmit,
    reset,
    control,
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

  if (isLoading) {
    return (
      <div className="skeleton-list">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-block h-[56px]" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="error-inline">
        Không thể tải cài đặt: {(loadError as Error).message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Success feedback */}
      {updateMutation.isSuccess && (
        <div className="success-inline mb-4 px-4 py-3 rounded-lg bg-[var(--color-emerald-50,#ecfdf5)] text-[var(--color-emerald-700,#047857)] text-sm">
          ✅ Đã lưu thông tin công ty thành công!
        </div>
      )}

      {/* Error feedback */}
      {updateMutation.error && (
        <p className="error-inline mb-4">
          Lỗi: {(updateMutation.error as Error).message}
        </p>
      )}

      <div className="form-grid gap-4">
        {/* Tên công ty */}
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <div className="form-field">
            <label htmlFor="cs-company-name">
              Tên công ty <span className="field-required">*</span>
            </label>
            <input
              id="cs-company-name"
              className={`field-input${errors.company_name ? ' is-error' : ''}`}
              type="text"
              placeholder="VD: Công Ty TNHH Dệt May Vĩnh Phát"
              {...register('company_name')}
            />
            {errors.company_name && (
              <span className="field-error">{errors.company_name.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="cs-tax-code">Mã số thuế</label>
            <input
              id="cs-tax-code"
              className={`field-input${errors.tax_code ? ' is-error' : ''}`}
              type="text"
              placeholder="VD: 0312012012"
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
            Địa chỉ <span className="field-required">*</span>
          </label>
          <input
            id="cs-address"
            className={`field-input${errors.address ? ' is-error' : ''}`}
            type="text"
            placeholder="VD: 123 Đường Vĩnh Phát, Quận Tân Bình, TP.HCM"
            {...register('address')}
          />
          {errors.address && (
            <span className="field-error">{errors.address.message}</span>
          )}
        </div>

        {/* SĐT + Email */}
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <div className="form-field">
            <label htmlFor="cs-phone">Số điện thoại</label>
            <input
              id="cs-phone"
              className={`field-input${errors.phone ? ' is-error' : ''}`}
              type="text"
              placeholder="VD: 0909 123 456"
              {...register('phone')}
            />
            {errors.phone && (
              <span className="field-error">{errors.phone.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="cs-email">Email</label>
            <input
              id="cs-email"
              className={`field-input${errors.email ? ' is-error' : ''}`}
              type="email"
              placeholder="VD: info@vinhphat.com"
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
            <label htmlFor="cs-website">Website</label>
            <input
              id="cs-website"
              className="field-input"
              type="text"
              placeholder="VD: https://vinhphat.com"
              {...register('website')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="cs-logo">Link logo</label>
            <input
              id="cs-logo"
              className="field-input"
              type="text"
              placeholder="VD: https://cdn.example.com/logo.png"
              {...register('logo_url')}
            />
          </div>
        </div>

        {/* Bank info */}
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <div className="form-field">
            <label htmlFor="cs-bank-name">Tên ngân hàng</label>
            <input
              id="cs-bank-name"
              className="field-input"
              type="text"
              placeholder="VD: Vietcombank"
              {...register('bank_name')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="cs-bank-account">Số tài khoản</label>
            <input
              id="cs-bank-account"
              className="field-input"
              type="text"
              placeholder="VD: 0071001234567"
              {...register('bank_account')}
            />
          </div>
        </div>

        {/* Default User Role */}
        <div className="form-field">
          <label htmlFor="cs-default-role">
            Vai trò mặc định cho người dùng mới
          </label>
          <Controller
            name="default_user_role"
            control={control}
            render={({ field }) => (
              <Combobox
                options={[
                  {
                    value: 'admin',
                    label: 'Admin',
                    icon: 'Shield',
                  },
                  {
                    value: 'manager',
                    label: 'Manager',
                    icon: 'UserCog',
                  },
                  {
                    value: 'staff',
                    label: 'Staff',
                    icon: 'User',
                  },
                  {
                    value: 'viewer',
                    label: 'Viewer',
                    icon: 'Eye',
                  },
                  {
                    value: 'sale',
                    label: 'Sale',
                    icon: 'DollarSign',
                  },
                  {
                    value: 'customer',
                    label: 'Customer',
                    icon: 'Users',
                  },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <p className="text-xs text-muted mt-1 italic">
            Vai trò này sẽ được tự động gán cho những tài khoản mới đăng ký qua
            hệ thống.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="secondary"
          type="button"
          disabled={isSubmitting || !isDirty}
          onClick={() =>
            settings && reset(settings as CompanySettingsFormValues)
          }
        >
          {' '}
          Hoàn tác
        </Button>
        <button
          className="primary-button btn-standard"
          type="submit"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? 'Đang lưu...' : '💾 Lưu thông tin'}
        </button>
      </div>
    </form>
  );
}
