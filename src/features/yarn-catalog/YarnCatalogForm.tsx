import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { ComboboxField } from '@/shared/components/ComboboxField';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import {
  useCreateYarnCatalog,
  useNextYarnCatalogCode,
  useUpdateYarnCatalog,
} from '@/application/settings';
import {
  yarnCatalogDefaultValues,
  yarnCatalogSchema,
  YARN_CATALOG_STATUS_LABELS,
} from '@/schema/yarn-catalog.schema';
import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';
import {
  YARN_CATEGORY_OPTIONS,
  YARN_TYPE_OPTIONS,
  YARN_DENIER_OPTIONS,
  YARN_FILAMENT_OPTIONS,
  YARN_FINISH_OPTIONS,
  YARN_COLOR_STATUS_OPTIONS,
  YARN_NE_COUNT_OPTIONS,
  YARN_SPINNING_METHOD_OPTIONS,
  YARN_TWIST_TYPE_OPTIONS,
  YARN_CERTIFICATION_OPTIONS,
} from '@/shared/constants/yarn-classification';
import { getErrorMessage } from '@/shared/utils/error';

import type { YarnCatalog } from './types';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'cuộn', label: 'cuộn' },
  { value: 'tấn', label: 'tấn' },
];

const STATUS_OPTIONS = (['active', 'inactive'] as const).map((s) => ({
  value: s,
  label: YARN_CATALOG_STATUS_LABELS[s],
}));

/** Categories that use Ne (English Count) instead of Denier */
const SPUN_YARN_CATEGORIES = new Set(['Cotton', 'Rayon', 'Blend']);

type YarnCatalogFormProps = {
  catalog: YarnCatalog | null;
  onClose: () => void;
};

function catalogToFormValues(catalog: YarnCatalog): YarnCatalogFormValues {
  return {
    code: catalog.code,
    name: catalog.name,
    composition: catalog.composition ?? '',
    color_name: catalog.color_name ?? '',
    tensile_strength: catalog.tensile_strength ?? '',
    origin: catalog.origin ?? '',
    lot_no: catalog.lot_no ?? '',
    grade: catalog.grade ?? '',
    category: catalog.category ?? '',
    yarn_type: catalog.yarn_type ?? '',
    denier: catalog.denier ?? '',
    filament_count: catalog.filament_count ?? '',
    finish: catalog.finish ?? '',
    color_status: catalog.color_status ?? '',
    count_ne: catalog.count_ne ?? '',
    spinning_method: catalog.spinning_method ?? '',
    twist_type: catalog.twist_type ?? '',
    certifications: catalog.certifications ?? [],
    is_fancy: catalog.is_fancy ?? false,
    fancy_details: catalog.fancy_details ?? '',
    unit: catalog.unit,
    notes: catalog.notes ?? '',
    status: catalog.status,
  };
}

export function YarnCatalogForm({ catalog, onClose }: YarnCatalogFormProps) {
  const isEditing = catalog !== null;
  const createMutation = useCreateYarnCatalog();
  const updateMutation = useUpdateYarnCatalog();
  const { data: nextCode } = useNextYarnCatalogCode();
  const { data: colorOptions = [] } = useColorOptions();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<YarnCatalogFormValues>({
    resolver: zodResolver(yarnCatalogSchema),
    defaultValues: isEditing
      ? catalogToFormValues(catalog)
      : yarnCatalogDefaultValues,
  });

  const watchedCategory = useWatch({ control, name: 'category' });
  const watchedIsFancy = useWatch({ control, name: 'is_fancy' });
  const isSpunYarn = SPUN_YARN_CATEGORIES.has(watchedCategory ?? '');

  useEffect(() => {
    reset(isEditing ? catalogToFormValues(catalog) : yarnCatalogDefaultValues);
  }, [catalog, isEditing, reset]);

  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode);
    }
  }, [isEditing, nextCode, setValue]);

  async function onSubmit(values: YarnCatalogFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: catalog.id, values });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch {
      // Lỗi hiện qua mutationError bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={isEditing ? `Sửa: ${catalog.name}` : 'Thêm loại sợi'}
      maxWidth={720}
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="yarn-catalog-form"
            isLoading={isPending}
          >
            {isEditing ? 'Cập nhật' : 'Thêm loại sợi'}
          </Button>
        </>
      }
    >
      {mutationError && (
        <p className="error-inline mb-4" role="alert">
          Lỗi: {getErrorMessage(mutationError)}
        </p>
      )}

      <form id="yarn-catalog-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* ═══ Section 1: Thông tin chung ═══ */}
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

          {/* ═══ Section 2: Phân loại kỹ thuật ═══ */}
          <fieldset className="form-section">
            <legend className="form-section-title">Phân loại kỹ thuật</legend>

            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              <ComboboxField
                name="category"
                control={control}
                options={YARN_CATEGORY_OPTIONS}
                label="Chất liệu (Level 1)"
                allowInput
                placeholder="VD: Polyester, Cotton..."
              />
              <ComboboxField
                name="yarn_type"
                control={control}
                options={YARN_TYPE_OPTIONS}
                label="Loại sợi (Level 2)"
                allowInput
                placeholder="VD: DTY, FDY, CM..."
              />
            </div>

            {/* Dynamic: Filament metrics (Polyester/Nylon) vs Spun metrics (Cotton/Rayon) */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
              {isSpunYarn ? (
                <>
                  <ComboboxField
                    name="count_ne"
                    control={control}
                    options={YARN_NE_COUNT_OPTIONS}
                    label="Chi số (Ne)"
                    allowInput
                    placeholder="VD: Ne 30"
                  />
                  <ComboboxField
                    name="spinning_method"
                    control={control}
                    options={YARN_SPINNING_METHOD_OPTIONS}
                    label="Phương pháp kéo sợi"
                    allowInput
                    placeholder="VD: Ring Spun"
                  />
                </>
              ) : (
                <>
                  <ComboboxField
                    name="denier"
                    control={control}
                    options={YARN_DENIER_OPTIONS}
                    label="Denier"
                    allowInput
                    placeholder="VD: 150D"
                  />
                  <ComboboxField
                    name="filament_count"
                    control={control}
                    options={YARN_FILAMENT_OPTIONS}
                    label="Filament"
                    allowInput
                    placeholder="VD: 48F"
                  />
                </>
              )}
              <div className="form-field">
                <label htmlFor="tensile_strength">Cường lực</label>
                <input
                  id="tensile_strength"
                  className="field-input"
                  type="text"
                  placeholder="VD: 18 cN/tex"
                  {...register('tensile_strength')}
                />
              </div>
            </div>

            {/* Twist type — available for all categories */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              <ComboboxField
                name="twist_type"
                control={control}
                options={YARN_TWIST_TYPE_OPTIONS}
                label="Hướng xoắn / Kiểu xoắn"
                allowInput
                placeholder="VD: S-Twist"
              />
              <div className="form-field flex items-end gap-2 pb-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="field-checkbox"
                    {...register('is_fancy')}
                  />
                  <span>Sợi Fancy (Slub, Injection...)</span>
                </label>
              </div>
            </div>

            {watchedIsFancy && (
              <div className="form-field">
                <label htmlFor="fancy_details">Chi tiết Fancy</label>
                <input
                  id="fancy_details"
                  className="field-input"
                  type="text"
                  placeholder="VD: Random slub 3-7cm, thick/thin variation"
                  {...register('fancy_details')}
                />
              </div>
            )}
          </fieldset>

          {/* ═══ Section 3: Hiệu ứng & Trạng thái màu ═══ */}
          <fieldset className="form-section">
            <legend className="form-section-title">Hiệu ứng & Màu sắc</legend>

            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              <ComboboxField
                name="finish"
                control={control}
                options={YARN_FINISH_OPTIONS}
                label="Finish (Bề mặt)"
                allowInput
                placeholder="VD: Semi Dull"
              />
              <ComboboxField
                name="color_status"
                control={control}
                options={YARN_COLOR_STATUS_OPTIONS}
                label="Trạng thái màu"
                allowInput
                placeholder="VD: Raw White"
              />
              <ComboboxField
                name="color_name"
                control={control}
                options={toColorComboboxOptions(colorOptions)}
                label="Màu mặc định"
                placeholder="Chọn hoặc nhập màu..."
              />
            </div>
          </fieldset>

          {/* ═══ Section 4: Chứng chỉ ═══ */}
          <fieldset className="form-section">
            <legend className="form-section-title">Chứng chỉ quốc tế</legend>
            <CertificationsCheckboxGroup
              control={control}
              setValue={setValue}
            />
          </fieldset>

          {/* ═══ Section 5: Thông tin bổ sung ═══ */}
          <fieldset className="form-section">
            <legend className="form-section-title">Thông tin bổ sung</legend>

            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
              <div className="form-field">
                <label htmlFor="lot_no">Mã lô (Lot No)</label>
                <input
                  id="lot_no"
                  className="field-input"
                  type="text"
                  placeholder="VD: PT40092"
                  {...register('lot_no')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="grade">Phân loại (Grade)</label>
                <input
                  id="grade"
                  className="field-input"
                  type="text"
                  placeholder="VD: A, B, C..."
                  {...register('grade')}
                />
              </div>

              <ComboboxField
                name="unit"
                control={control}
                options={UNIT_OPTIONS}
                label="Đơn vị *"
                hasError={!!errors.unit}
                placeholder="Chọn..."
              />

              <ComboboxField
                name="status"
                control={control}
                options={STATUS_OPTIONS}
                label="Trạng thái"
                hasError={!!errors.status}
              />
            </div>

            {errors.unit && (
              <span className="field-error">{errors.unit.message}</span>
            )}

            <div className="form-field">
              <label htmlFor="notes">Ghi chú</label>
              <textarea
                id="notes"
                className="field-textarea"
                rows={2}
                placeholder="Ghi chú về loại sợi..."
                {...register('notes')}
              />
            </div>
          </fieldset>
        </div>
      </form>
    </AdaptiveSheet>
  );
}

type CertificationsCheckboxGroupProps = {
  control: Control<YarnCatalogFormValues>;
  setValue: UseFormSetValue<YarnCatalogFormValues>;
};

function CertificationsCheckboxGroup({
  control,
  setValue,
}: CertificationsCheckboxGroupProps) {
  const currentCerts = useWatch({ control, name: 'certifications' }) ?? [];

  return (
    <div className="flex flex-wrap gap-3">
      {YARN_CERTIFICATION_OPTIONS.map((cert) => {
        const isChecked = currentCerts.includes(cert.value);
        return (
          <label
            key={cert.value}
            className="inline-flex items-center gap-1.5 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              className="field-checkbox"
              checked={isChecked}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...currentCerts, cert.value]
                  : currentCerts.filter((c: string) => c !== cert.value);
                setValue('certifications', next, { shouldDirty: true });
              }}
            />
            <span>{cert.label}</span>
          </label>
        );
      })}
    </div>
  );
}
