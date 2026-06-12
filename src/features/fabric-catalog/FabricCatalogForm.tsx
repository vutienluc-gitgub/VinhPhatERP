import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { ImagePicker } from '@/shared/components/ImagePicker';
import { Switch } from '@/shared/components/Switch';
import { Badge } from '@/shared/components/Badge';
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

import type { FabricCatalog } from './types';
import { LABELS } from './fabric-catalog.constants';

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
    target_width_cm: catalog.target_width_cm,
    target_gsm: catalog.target_gsm,
    unit: catalog.unit,
    notes: catalog.notes ?? '',
    status: catalog.status,
    image_url: catalog.image_url ?? null,
    is_public: catalog.is_public ?? false,
    slug: catalog.slug ?? '',
    color: catalog.color ?? null,
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

  const isCustomSlug = useRef(isEditing && Boolean(catalog?.slug));

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
  }, [catalog, isEditing, reset]);

  const currentImageUrl = watch('image_url');
  const watchCode = watch('code');
  const watchSlug = watch('slug');
  const watchIsPublic = watch('is_public');
  const watchName = watch('name');

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
      // Lỗi hiện qua mutationError bên dưới
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
    const canvas = document.querySelector(
      '#qr-container canvas',
    ) as HTMLCanvasElement;
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>In QR Mẫu Vải</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; }
              .container { display: inline-block; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
              img { width: 200px; height: 200px; }
              h2 { margin: 10px 0 5px; font-size: 18px; }
              p { margin: 0; color: #555; }
              .domain { margin-top: 15px; font-size: 12px; color: #888; }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${imgData}" alt="QR Code" />
              <h2>${watchCode}</h2>
              <p>${watchName}</p>
              <div class="domain">${window.location.host}</div>
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch (e) {
      console.error(e);
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

      <form
        id="fabric-catalog-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-8 pb-8"
      >
        {/* THÔNG TIN CƠ BẢN */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Thông tin cơ bản
          </h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Ảnh mẫu vải</label>
              <ImagePicker
                value={currentImageUrl}
                onUpload={(file) =>
                  uploadImageMutation.mutate(file, {
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
          </div>
        </section>

        <hr className="border-border" />

        {/* THÔNG TIN KỸ THUẬT */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Thông tin kỹ thuật
          </h3>
          <div className="form-grid">
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
                <label htmlFor="fc-composition">Thành phần</label>
                <input
                  id="fc-composition"
                  className="field-input"
                  type="text"
                  placeholder="VD: 65% Polyester, 35% Cotton"
                  {...register('composition')}
                />
              </div>

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

              <div className="form-field">
                <label htmlFor="fc-color">Màu sắc</label>
                <input
                  id="fc-color"
                  className={`field-input${errors.color ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: Trắng, Đen, Melange Grey"
                  {...register('color')}
                />
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
          </div>
        </section>

        <hr className="border-border" />

        {/* CÔNG KHAI */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Công khai
          </h3>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">
                  Công khai cho khách hàng (Public)
                </p>
                <p className="text-sm text-muted">
                  Bật để khách hàng có thể quét QR và xem thông tin trực tuyến
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={watchIsPublic ? 'success' : 'gray'}>
                  {watchIsPublic ? '🟢 Đang công khai' : '🔴 Chưa công khai'}
                </Badge>
                <Controller
                  name="is_public"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="form-field">
                <label htmlFor="fc-slug">Đường dẫn tĩnh (Slug)</label>
                <div className="flex gap-2">
                  <input
                    id="fc-slug"
                    className={`field-input flex-1${errors.slug ? ' is-error' : ''}`}
                    type="text"
                    placeholder="VD: fc-001"
                    readOnly={!isCustomSlug.current}
                    {...register('slug')}
                  />
                  {!isCustomSlug.current && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        isCustomSlug.current = true;
                      }}
                    >
                      Tùy chỉnh URL
                    </Button>
                  )}
                </div>
                {errors.slug && (
                  <span className="field-error">{errors.slug.message}</span>
                )}
                <div className="mt-2 text-sm text-muted flex items-center gap-2">
                  <span>🌐 Trang công khai: {publicUrl}</span>
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

              {watchIsPublic && watchSlug && (
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-6">
                  <div
                    id="qr-container"
                    className="bg-white p-2 rounded-lg border border-border"
                  >
                    <QRCodeDisplay value={publicUrl} size={150} />
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
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
            </div>
          </div>
        </section>

        <hr className="border-border" />

        {/* QUẢN TRỊ */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Quản trị
          </h3>
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

            <div className="form-field col-span-full">
              <label htmlFor="fc-notes">Ghi chú</label>
              <textarea
                id="fc-notes"
                className="field-textarea"
                rows={2}
                placeholder="Ghi chú nội bộ..."
                {...register('notes')}
              />
            </div>
          </div>
        </section>
      </form>
    </AdaptiveSheet>
  );
}
