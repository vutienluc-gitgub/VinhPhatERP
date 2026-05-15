import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

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
    >
      {mutationError && (
        <p className="error-inline mb-4">
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
            <legend className="form-section-title">Thông tin kỹ thuật</legend>

            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              <ComboboxField
                name="category"
                control={control}
                options={YARN_CATEGORY_OPTIONS}
                label="Chất liệu (Level 1)"
                allowInput
                placeholder="VD: Polyester, Nylon..."
              />
              <ComboboxField
                name="yarn_type"
                control={control}
                options={YARN_TYPE_OPTIONS}
                label="Loại sợi (Level 2)"
                allowInput
                placeholder="VD: DTY, FDY, SCY..."
              />
            </div>

            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
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

          {/* ═══ Section 4: Thông tin bổ sung ═══ */}
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

        <div className="modal-footer mt-6 p-0 border-none">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <button
            className="primary-button btn-standard"
            type="submit"
            disabled={isPending}
          >
            {isPending
              ? 'Đang lưu...'
              : isEditing
                ? 'Cập nhật'
                : 'Thêm loại sợi'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
