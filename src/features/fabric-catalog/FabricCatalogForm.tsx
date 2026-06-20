import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
  AdaptiveSheet,
  Button,
  Combobox,
  Icon,
  ImagePicker,
  Switch,
  TabSwitcher,
  TagInput,
} from '@/shared/components';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import {
  useCreateFabricCatalog,
  useNextFabricCatalogCode,
  useUpdateFabricCatalog,
  useFabricCategories,
} from '@/application/settings';
import {
  useUploadFabricImage,
  useDeleteFabricImage,
} from '@/application/inventory/useFabricImage';
import {
  fabricCatalogDefaultValues,
  fabricCatalogSchema,
  FABRIC_CATALOG_STATUS_LABELS,
} from '@/schema/fabric-catalog.schema';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { getErrorMessage } from '@/shared/utils/error';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { FABRIC_SAMPLE_HORIZONTAL_CSS } from '@/shared/lib/print-template.css';

import type { FabricCatalog } from './types';
import { LABELS } from './fabric-catalog.constants';
import { FabricPublicPreview } from './components/FabricPublicPreview';
import { QRFabricLabel } from './components/QRFabricLabel';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'm', label: 'mét (m)' },
  { value: 'cuộn', label: 'cuộn' },
];

const STATUS_OPTIONS = (['active', 'inactive'] as const).map((s) => ({
  value: s,
  label: FABRIC_CATALOG_STATUS_LABELS[s],
}));

const TECHNIQUE_OPTIONS = [
  { value: 'Single Jersey', label: 'Single Jersey' },
  { value: 'Interlock', label: 'Interlock' },
  { value: 'Rib', label: 'Rib' },
  { value: 'Pique', label: 'Pique' },
  { value: 'French Terry', label: 'French Terry' },
  { value: 'Fleece', label: 'Fleece' },
  { value: 'Polar Fleece', label: 'Polar Fleece' },
  { value: 'Waffle', label: 'Waffle' },
  { value: 'Jacquard', label: 'Jacquard' },
];

type FormTab = 'info' | 'public' | 'admin';

const FORM_TABS: { key: FormTab; label: string }[] = [
  { key: 'info', label: LABELS.TAB_INFO },
  { key: 'public', label: LABELS.TAB_PUBLIC },
  { key: 'admin', label: LABELS.TAB_ADMIN },
];

type FabricCatalogFormProps = {
  catalog: FabricCatalog | null;
  onClose: () => void;
};

function catalogToFormValues(catalog: FabricCatalog): FabricCatalogFormValues {
  const base = {
    category_id: catalog.category_id ?? null,
    code: catalog.code,
    name: catalog.name,
    composition: catalog.composition ?? '',
    composition_tags: catalog.composition_tags ?? [],
    target_width_cm: catalog.target_width_cm,
    target_gsm: catalog.target_gsm,
    unit: catalog.unit,
    notes: catalog.notes ?? '',
    status: catalog.status,
    image_url: catalog.image_url ?? null,
    is_public: catalog.is_public ?? false,
    slug: catalog.slug ?? '',
    color: catalog.color ?? null,
    color_tags: catalog.color_tags ?? [],
    technique: catalog.technique ?? null,
  };

  if (catalog.fabric_type === 'woven') {
    return {
      ...base,
      fabric_type: 'woven',
      warp_count: catalog.warp_count ?? null,
      weft_count: catalog.weft_count ?? null,
      epi: catalog.epi ?? null,
      ppi: catalog.ppi ?? null,
      weave_pattern: catalog.weave_pattern ?? null,
    };
  }

  return {
    ...base,
    fabric_type: 'knitted',
    gauge: catalog.gauge ?? null,
    diameter: catalog.diameter ?? null,
    machine_type: catalog.machine_type ?? null,
    needle_count: catalog.needle_count ?? null,
  };
}

export function FabricCatalogForm({
  catalog,
  onClose,
}: FabricCatalogFormProps) {
  const isEditing = catalog !== null;
  const createMutation = useCreateFabricCatalog();
  const updateMutation = useUpdateFabricCatalog();
  const uploadImageMutation = useUploadFabricImage();
  const deleteImageMutation = useDeleteFabricImage();
  const { data: nextCode } = useNextFabricCatalogCode();
  const { data: categories } = useFabricCategories();

  const [activeTab, setActiveTab] = useState<FormTab>('info');
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const isCustomSlug = useRef(isEditing && Boolean(catalog?.slug));
  const printAreaRef = useRef<HTMLDivElement>(null);

  const categoryOptions =
    categories?.map((c) => ({
      value: c.id,
      label: c.name,
    })) ?? [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FabricCatalogFormValues>({
    resolver: zodResolver(fabricCatalogSchema),
    defaultValues: isEditing
      ? catalogToFormValues(catalog)
      : fabricCatalogDefaultValues,
  });

  useEffect(() => {
    reset(
      isEditing ? catalogToFormValues(catalog) : fabricCatalogDefaultValues,
    );
    isCustomSlug.current = isEditing && Boolean(catalog?.slug);
    setIsSlugEditing(false);
  }, [catalog, isEditing, reset]);

  const currentImageUrl = watch('image_url');
  const watchCode = watch('code');
  const watchSlug = watch('slug');
  const watchIsPublic = watch('is_public');
  const watchName = watch('name');
  const watchComposition = watch('composition_tags');
  const watchWidthCm = watch('target_width_cm');
  const watchGsm = watch('target_gsm');
  const watchTechnique = watch('technique');
  const watchCategoryId = watch('category_id');

  const selectedCategory = categories?.find((c) => c.id === watchCategoryId);

  useEffect(() => {
    if (!isEditing && nextCode && !watchCode) {
      setValue('code', nextCode);
    }
  }, [isEditing, nextCode, setValue, watchCode]);

  useEffect(() => {
    if (!isCustomSlug.current && watchCode) {
      const autoSlug = watchCode.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
      setValue('slug', autoSlug, { shouldValidate: true });
    }
  }, [watchCode, setValue]);

  async function onSubmit(values: FabricCatalogFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: catalog.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch {
      // Error shown via mutationError below
    }
  }

  const handleDownloadQR = () => {
    const canvas = document.querySelector(
      '#qr-container canvas',
    ) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `fabric-${watchCode || 'qr'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handlePrintQR = () => {
    openPrintWindow(printAreaRef.current, {
      title: 'In QR Mẫu Vải',
      css: FABRIC_SAMPLE_HORIZONTAL_CSS,
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('[CopyLinkError]', message);
    }
  };

  const handleSlugEditStart = () => {
    isCustomSlug.current = true;
    setIsSlugEditing(true);
  };

  const handleSlugEditCancel = () => {
    setIsSlugEditing(false);
    // Reset to auto-generated slug
    if (watchCode) {
      isCustomSlug.current = false;
      const autoSlug = watchCode.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
      setValue('slug', autoSlug, { shouldValidate: true });
    }
  };

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const publicUrl = `${window.location.origin}/p/fabric/${watchSlug}`;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={isEditing ? `Sửa: ${catalog.name}` : 'Thêm loại vải'}
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
            form="fabric-catalog-form"
            isLoading={isPending}
          >
            {isEditing ? 'Cập nhật' : 'Thêm loại vải'}
          </Button>
        </>
      }
    >
      {mutationError && (
        <p className="error-inline mb-4">
          Lỗi: {getErrorMessage(mutationError)}
        </p>
      )}

      {/* Tab Switcher */}
      <div className="mb-4">
        <TabSwitcher
          tabs={FORM_TABS}
          active={activeTab}
          onChange={setActiveTab}
          variant="pill"
        />
      </div>

      <form
        id="fabric-catalog-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-6 pb-4"
      >
        {/* ── TAB: Thong tin ── */}
        {activeTab === 'info' && (
          <>
            {/* Image */}
            <div className="form-field">
              <label>Ảnh mẫu vải</label>
              <ImagePicker
                value={currentImageUrl}
                onUpload={(file: File) =>
                  uploadImageMutation.mutateAsync(file, {
                    onSuccess: (url) => setValue('image_url', url),
                  })
                }
                onRemove={() => {
                  const currentUrl = currentImageUrl;
                  setValue('image_url', null);
                  if (currentUrl) {
                    deleteImageMutation.mutate(currentUrl);
                  }
                }}
                isUploading={uploadImageMutation.isPending}
                error={
                  uploadImageMutation.error instanceof Error
                    ? uploadImageMutation.error.message
                    : uploadImageMutation.error
                      ? String(uploadImageMutation.error)
                      : null
                }
              />
            </div>

            {/* Code + Name */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label htmlFor="fc-code">
                  Mã vải <span className="field-required">*</span>
                </label>
                <input
                  id="fc-code"
                  className={`field-input${errors.code ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: FC-001"
                  readOnly={!isEditing}
                  {...register('code')}
                />
                {errors.code && (
                  <span className="field-error">{errors.code.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="fc-name">
                  Tên vải <span className="field-required">*</span>
                </label>
                <input
                  id="fc-name"
                  className={`field-input${errors.name ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: Cotton TC 65/35"
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
                  <span className="field-error">
                    {errors.category_id.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label>Thành phần</label>
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
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label htmlFor="fc-target-width">Khổ chuẩn (cm)</label>
                <input
                  id="fc-target-width"
                  className={`field-input${errors.target_width_cm ? ' is-error' : ''}`}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 160"
                  {...register('target_width_cm', { valueAsNumber: true })}
                />
                {errors.target_width_cm && (
                  <span className="field-error">
                    {errors.target_width_cm.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="fc-target-weight">K/L chuẩn (gsm)</label>
                <input
                  id="fc-target-weight"
                  className={`field-input${errors.target_gsm ? ' is-error' : ''}`}
                  type="number"
                  step="1"
                  min="0"
                  placeholder="VD: 250"
                  {...register('target_gsm', { valueAsNumber: true })}
                />
                {errors.target_gsm && (
                  <span className="field-error">
                    {errors.target_gsm.message}
                  </span>
                )}
              </div>
            </div>

            {/* Color + Technique */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label>Màu sắc</label>
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
                  (!watch('color_tags') ||
                    watch('color_tags')?.length === 0) && (
                    <p className="text-xs text-muted mt-1">
                      {LABELS.OLD_DATA_HINT}
                      {catalog.color}
                    </p>
                  )}
              </div>

              <div className="form-field">
                <label>Kỹ thuật</label>
                <Controller
                  name="technique"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={TECHNIQUE_OPTIONS}
                      value={field.value ?? undefined}
                      onChange={(val) => field.onChange(val || null)}
                      placeholder="Chọn kỹ thuật dệt..."
                    />
                  )}
                />
              </div>
            </div>

            {/* Unit */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label htmlFor="fc-unit">
                  Đơn vị <span className="field-required">*</span>
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
                      placeholder="Chọn..."
                    />
                  )}
                />
                {errors.unit && (
                  <span className="field-error">{errors.unit.message}</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── TAB: Cong khai ── */}
        {activeTab === 'public' && (
          <div className="space-y-5">
            {/* Public toggle */}
            <div className="public-toggle-section">
              <div className="public-toggle-section__text">
                <p className="public-toggle-section__title">
                  {LABELS.PUBLIC_TITLE}
                </p>
                <p className="public-toggle-section__desc">
                  {LABELS.PUBLIC_DESC}
                </p>
              </div>
              <div className="public-toggle-section__controls">
                <span
                  className={`public-status-dot${watchIsPublic ? ' is-active' : ''}`}
                >
                  {watchIsPublic ? LABELS.PUBLIC_ON : LABELS.PUBLIC_OFF}
                </span>
                <Controller
                  name="is_public"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            {/* Slug */}
            <div className="form-field">
              <label>{LABELS.SLUG_LABEL}</label>

              {!isSlugEditing ? (
                /* Locked slug display */
                <div className="slug-locked">
                  <Icon name="Lock" size={14} className="slug-locked__icon" />
                  <span className="slug-locked__value">
                    {watchSlug || LABELS.NA}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSlugEditStart}
                  >
                    {LABELS.SLUG_EDIT}
                  </Button>
                </div>
              ) : (
                /* Editable slug input */
                <div className="flex gap-2">
                  <input
                    id="fc-slug"
                    className={`field-input flex-1${errors.slug ? ' is-error' : ''}`}
                    type="text"
                    placeholder="VD: fc-001"
                    {...register('slug')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSlugEditCancel}
                  >
                    {LABELS.SLUG_CANCEL}
                  </Button>
                </div>
              )}

              {!isSlugEditing && (
                <p className="text-xs text-muted mt-1">
                  {LABELS.SLUG_AUTO_HINT}
                </p>
              )}

              {errors.slug && (
                <span className="field-error">{errors.slug.message}</span>
              )}

              {/* URL preview */}
              <div className="mt-2 text-sm text-muted flex items-center gap-2 flex-wrap">
                <span>
                  {LABELS.PUBLIC_PAGE_LABEL}: {publicUrl}
                </span>
                {watchIsPublic && watchSlug && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                    >
                      Sao chép
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(publicUrl, '_blank')}
                    >
                      Mở trang
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* QR + Actions */}
            {watchIsPublic && watchSlug && (
              <div className="qr-section">
                <div id="qr-container" className="qr-section__code">
                  <QRCodeDisplay value={publicUrl} size={160} />
                </div>
                <div className="qr-section__actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDownloadQR}
                  >
                    Tải QR (.png)
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePrintQR}
                  >
                    In Tem Mẫu
                  </Button>
                </div>
              </div>
            )}

            {/* Public Preview Card */}
            {watchIsPublic && (
              <FabricPublicPreview
                imageUrl={currentImageUrl}
                code={watchCode}
                name={watchName}
                composition={watchComposition}
                targetWidthCm={watchWidthCm}
                targetGsm={watchGsm}
                technique={watchTechnique}
                category={selectedCategory?.name}
              />
            )}
          </div>
        )}

        {/* ── TAB: Quan tri ── */}
        {activeTab === 'admin' && (
          <div className="space-y-4">
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label>Trạng thái</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={STATUS_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.status}
                    />
                  )}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="fc-notes">Ghi chú</label>
              <textarea
                id="fc-notes"
                className="field-textarea"
                rows={4}
                placeholder="Ghi chú nội bộ..."
                {...register('notes')}
              />
            </div>
          </div>
        )}
      </form>
      <div style={{ display: 'none' }}>
        <div ref={printAreaRef}>
          <QRFabricLabel
            code={watchCode}
            name={watchName}
            qrValue={publicUrl}
          />
        </div>
      </div>
    </AdaptiveSheet>
  );
}
