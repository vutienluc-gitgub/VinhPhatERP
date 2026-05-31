import { useFormContext } from 'react-hook-form';

import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';

type StepGeneralInfoProps = {
  hidden: boolean;
  isEditing: boolean;
};

export function StepGeneralInfo({ hidden, isEditing }: StepGeneralInfoProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<YarnCatalogFormValues>();

  return (
    <div className={hidden ? 'hidden' : 'block'}>
      <div className="form-grid">
        <fieldset className="form-section">
          <legend className="form-section-title">Thông tin chung</legend>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="code">
                Mã sợi <span className="field-required">*</span>
              </label>
              <input
                id="code"
                className={`field-input${errors.code ? ' is-error' : ''}`}
                type="text"
                placeholder="VD: YS-001"
                readOnly={!isEditing}
                {...register('code')}
              />
              {errors.code && (
                <span className="field-error">{errors.code.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="name">
                Tên loại sợi <span className="field-required">*</span>
              </label>
              <input
                id="name"
                className={`field-input${errors.name ? ' is-error' : ''}`}
                type="text"
                placeholder="VD: DTY 150D/48F SD"
                {...register('name')}
              />
              {errors.name && (
                <span className="field-error">{errors.name.message}</span>
              )}
            </div>
          </div>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="composition">Thành phần</label>
              <input
                id="composition"
                className="field-input"
                type="text"
                placeholder="VD: 100% Polyester"
                {...register('composition')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="origin">Xuất xứ</label>
              <input
                id="origin"
                className="field-input"
                type="text"
                placeholder="VD: Trung Quốc, Đài Loan..."
                {...register('origin')}
              />
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
