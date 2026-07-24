import { useFormContext, Controller } from 'react-hook-form';
import { UseMutationResult } from '@tanstack/react-query';

import { AdvancedImageUploader, Combobox, TagInput } from '@/shared/components';
import { LengthField, DensityField } from '@/shared/value';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import {
  LABELS,
  UNIT_OPTIONS,
  TECHNIQUE_OPTIONS,
  STRETCH_TYPE_MAP,
  THICKNESS_MAP,
  PUBLIC_PAGE_LABELS,
} from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalog } from '@/features/fabric-catalog/types';

const STRETCH_OPTIONS = Object.entries(STRETCH_TYPE_MAP).map(
  ([value, label]) => ({ value, label }),
);
const THICKNESS_OPTIONS = Object.entries(THICKNESS_MAP).map(
  ([value, label]) => ({ value, label }),
);

type FabricInfoTabProps = {
  catalog: FabricCatalog | null;
  isEditing: boolean;
  categoryOptions: { value: string; label: string }[];
  uploadImageMutation: UseMutationResult<string, Error, File>;
  deleteImageMutation: UseMutationResult<void, Error, string>;
};

export function FabricInfoTab({
  catalog,
  isEditing,
  categoryOptions,
  uploadImageMutation,
  deleteImageMutation,
}: FabricInfoTabProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

  const currentImageUrl = watch('image_url');

  return (
    <>
      {/* Image */}
      <div className="form-field mb-6">
        <label>{LABELS.LABEL_IMAGE}</label>
        <AdvancedImageUploader
          value={currentImageUrl}
          uploadFn={async (file) => uploadImageMutation.mutateAsync(file)}
          onSuccess={(url) => setValue('image_url', url)}
          onRemove={() => {
            const currentUrl = currentImageUrl;
            setValue('image_url', null);
            if (currentUrl) {
              deleteImageMutation.mutate(currentUrl);
            }
          }}
        />
      </div>

      {/* Code + Name */}
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="fc-code">
            {LABELS.CODE} <span className="field-required">*</span>
          </label>
          <input
            id="fc-code"
            className={`field-input${errors.code ? ' border-danger' : ''}`}
            type="text"
            placeholder={LABELS.CODE_PLACEHOLDER}
            readOnly={!isEditing}
            {...register('code')}
          />
          {errors.code && (
            <span className="field-error">{errors.code.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="fc-name">
            {LABELS.NAME} <span className="field-required">*</span>
          </label>
          <input
            id="fc-name"
            className={`field-input${errors.name ? ' border-danger' : ''}`}
            type="text"
            placeholder={LABELS.NAME_PLACEHOLDER}
            {...register('name')}
          />
          {errors.name && (
            <span className="field-error">{errors.name.message}</span>
          )}
        </div>
      </div>

      {/* Category + Composition */}
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label>{LABELS.CATEGORY}</label>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <Combobox
                options={categoryOptions}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                hasError={!!errors.category_id}
                placeholder={LABELS.CATEGORY_PLACEHOLDER}
              />
            )}
          />
          {errors.category_id && (
            <span className="field-error">{errors.category_id.message}</span>
          )}
        </div>

        <div className="form-field">
          <label>{LABELS.COMPOSITION}</label>
          <Controller
            name="composition_tags"
            control={control}
            render={({ field }) => (
              <TagInput
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder={LABELS.COMPOSITION_TAG_PLACEHOLDER}
              />
            )}
          />
          {catalog?.composition &&
            (!watch('composition_tags') ||
              watch('composition_tags')?.length === 0) && (
              <p className="text-xs text-muted mt-1">
                {LABELS.OLD_DATA_HINT}
                {catalog.composition}
              </p>
            )}
        </div>
      </div>

      {/* Width + GSM */}
      <div className="form-grid grid-cols-2">
        <LengthField
          control={control}
          name="target_width_cm"
          label={LABELS.WIDTH}
          suffix="cm"
          placeholder={LABELS.WIDTH_PLACEHOLDER}
          allowNegative={false}
        />

        <DensityField
          control={control}
          name="target_gsm"
          label={LABELS.GSM}
          placeholder={LABELS.GSM_PLACEHOLDER}
          allowNegative={false}
        />
      </div>

      {/* Color + Technique */}
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label>{LABELS.LABEL_COLOR}</label>
          <Controller
            name="color_tags"
            control={control}
            render={({ field }) => (
              <TagInput
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder={LABELS.COLOR_TAG_PLACEHOLDER}
              />
            )}
          />
          {catalog?.color &&
            (!watch('color_tags') || watch('color_tags')?.length === 0) && (
              <p className="text-xs text-muted mt-1">
                {LABELS.OLD_DATA_HINT}
                {catalog.color}
              </p>
            )}
        </div>

        <div className="form-field">
          <label>{LABELS.LABEL_TECHNIQUE}</label>
          <Controller
            name="technique"
            control={control}
            render={({ field }) => (
              <Combobox
                options={TECHNIQUE_OPTIONS}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                placeholder={LABELS.TECHNIQUE_PLACEHOLDER}
              />
            )}
          />
        </div>
      </div>

      {/* Stretch + Thickness */}
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label>{PUBLIC_PAGE_LABELS.stretch}</label>
          <Controller
            name="stretch_type"
            control={control}
            render={({ field }) => (
              <Combobox
                options={STRETCH_OPTIONS}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                placeholder="Chọn..."
              />
            )}
          />
        </div>

        <div className="form-field">
          <label>{PUBLIC_PAGE_LABELS.thickness}</label>
          <Controller
            name="thickness"
            control={control}
            render={({ field }) => (
              <Combobox
                options={THICKNESS_OPTIONS}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                placeholder="Chọn..."
              />
            )}
          />
        </div>
      </div>

      {/* Unit */}
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="fc-unit">
            {LABELS.UNIT} <span className="field-required">*</span>
          </label>
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <Combobox
                options={UNIT_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                hasError={!!errors.unit}
                placeholder={LABELS.COMBOBOX_DEFAULT_PLACEHOLDER}
              />
            )}
          />
          {errors.unit && (
            <span className="field-error">{errors.unit.message}</span>
          )}
        </div>
      </div>
    </>
  );
}
