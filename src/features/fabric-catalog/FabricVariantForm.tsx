import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import {
  useCreateFabricVariant,
  useUpdateFabricVariant,
} from '@/application/settings';
import {
  fabricVariantSchema,
  fabricVariantDefaultValues,
  FABRIC_VARIANT_STATUS_LABELS,
  FABRIC_VARIANT_STATUSES,
  FABRIC_UOM_OPTIONS,
} from '@/schema/fabric-variant.schema';
import type { FabricVariantFormValues } from '@/schema/fabric-variant.schema';
import type { FabricVariant } from '@/domain/settings/fabric-catalog.types';
import { getErrorMessage } from '@/shared/utils/error';

const STATUS_OPTIONS = FABRIC_VARIANT_STATUSES.map((s) => ({
  value: s,
  label: FABRIC_VARIANT_STATUS_LABELS[s],
}));

type FabricVariantFormProps = {
  variant: FabricVariant | null;
  fabricCatalogId: string;
  parentCode: string;
  onClose: () => void;
};

function variantToFormValues(v: FabricVariant): FabricVariantFormValues {
  return {
    color_name: v.color_name,
    color_hex: v.color_hex,
    actual_width_cm: v.actual_width_cm,
    actual_gsm: v.actual_gsm,
    shrinkage_rate_warp: v.shrinkage_rate_warp,
    shrinkage_rate_weft: v.shrinkage_rate_weft,
    base_uom: v.base_uom,
    conversion_rate: v.conversion_rate,
    lot_number: v.lot_number,
    supplier_id: v.supplier_id,
    sku: v.sku,
    barcode: v.barcode,
    moq: v.moq,
    purchase_price: v.purchase_price,
    selling_price: v.selling_price,
    status: v.status,
    image_url: v.image_url,
    notes: v.notes,
  };
}

export function FabricVariantForm({
  variant,
  fabricCatalogId,
  parentCode,
  onClose,
}: FabricVariantFormProps) {
  const isEditing = variant !== null;
  const createMutation = useCreateFabricVariant();
  const updateMutation = useUpdateFabricVariant();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FabricVariantFormValues>({
    resolver: zodResolver(fabricVariantSchema),
    defaultValues: isEditing
      ? variantToFormValues(variant)
      : fabricVariantDefaultValues,
  });

  useEffect(() => {
    reset(
      isEditing ? variantToFormValues(variant) : fabricVariantDefaultValues,
    );
  }, [variant, isEditing, reset]);

  // Auto-calculate conversion rate when GSM or width changes
  const actualGsm = watch('actual_gsm');
  const actualWidth = watch('actual_width_cm');
  useEffect(() => {
    if (actualGsm && actualWidth && actualGsm > 0 && actualWidth > 0) {
      const widthM = actualWidth / 100;
      const rate = Math.round((1000 / (actualGsm * widthM)) * 1000) / 1000;
      setValue('conversion_rate', rate);
    }
  }, [actualGsm, actualWidth, setValue]);

  async function onSubmit(values: FabricVariantFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: variant.id,
          parentCode,
          values,
        });
      } else {
        await createMutation.mutateAsync({
          fabricCatalogId,
          parentCode,
          values,
        });
      }
      onClose();
    } catch {
      // Error displayed via mutationError below
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={
        isEditing
          ? `Sửa biến thể: ${variant.variant_code}`
          : `Thêm biến thể — ${parentCode}`
      }
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
          <button
            className="primary-button btn-standard"
            type="submit"
            form="fabric-variant-form"
            disabled={isPending}
          >
            {isPending
              ? 'Đang lưu...'
              : isEditing
                ? 'Cập nhật'
                : 'Thêm biến thể'}
          </button>
        </>
      }
    >
      {mutationError && (
        <p className="error-inline mb-4">
          Lỗi: {getErrorMessage(mutationError)}
        </p>
      )}

      <form
        id="fabric-variant-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="form-grid">
          {/* ── Section: Màu sắc ── */}
          <fieldset className="form-section">
            <legend className="form-section-title">Màu sắc</legend>
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label htmlFor="fv-color-name">
                  Tên màu <span className="field-required">*</span>
                </label>
                <input
                  id="fv-color-name"
                  className={`field-input${errors.color_name ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: Đen, Trắng, Navy..."
                  {...register('color_name')}
                />
                {errors.color_name && (
                  <span className="field-error">
                    {errors.color_name.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="fv-color-hex">Mã hex</label>
                <div className="flex gap-2 items-center">
                  <input
                    id="fv-color-hex"
                    className={`field-input flex-1${errors.color_hex ? ' is-error' : ''}`}
                    type="text"
                    placeholder="#000000"
                    {...register('color_hex')}
                  />
                  {watch('color_hex') &&
                    /^#[0-9a-fA-F]{6}$/.test(watch('color_hex') ?? '') && (
                      <div
                        className="w-8 h-8 rounded border border-border shrink-0"
                        style={{ backgroundColor: watch('color_hex') ?? '' }}
                      />
                    )}
                </div>
                {errors.color_hex && (
                  <span className="field-error">
                    {errors.color_hex.message}
                  </span>
                )}
              </div>
            </div>
          </fieldset>

          {/* ── Section: Quy cách thực tế ── */}
          <fieldset className="form-section">
            <legend className="form-section-title">
              Quy cách thực tế (sau nhuộm)
            </legend>
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
              <div className="form-field">
                <label htmlFor="fv-actual-width">Khổ thực tế (cm)</label>
                <input
                  id="fv-actual-width"
                  className={`field-input${errors.actual_width_cm ? ' is-error' : ''}`}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 150"
                  {...register('actual_width_cm', { valueAsNumber: true })}
                />
                {errors.actual_width_cm && (
                  <span className="field-error">
                    {errors.actual_width_cm.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="fv-actual-gsm">K/L thực tế (gsm)</label>
                <input
                  id="fv-actual-gsm"
                  className={`field-input${errors.actual_gsm ? ' is-error' : ''}`}
                  type="number"
                  step="1"
                  min="0"
                  placeholder="VD: 175"
                  {...register('actual_gsm', { valueAsNumber: true })}
                />
                {errors.actual_gsm && (
                  <span className="field-error">
                    {errors.actual_gsm.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="fv-shrink-warp">Rút dọc (%)</label>
                <input
                  id="fv-shrink-warp"
                  className={`field-input${errors.shrinkage_rate_warp ? ' is-error' : ''}`}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="VD: 3.5"
                  {...register('shrinkage_rate_warp', { valueAsNumber: true })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="fv-shrink-weft">Rút ngang (%)</label>
                <input
                  id="fv-shrink-weft"
                  className={`field-input${errors.shrinkage_rate_weft ? ' is-error' : ''}`}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="VD: 2.0"
                  {...register('shrinkage_rate_weft', { valueAsNumber: true })}
                />
              </div>
            </div>
          </fieldset>

          {/* ── Section: Đơn vị tính & Quy đổi ── */}
          <fieldset className="form-section">
            <legend className="form-section-title">
              Đơn vị tính & Quy đổi
            </legend>
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label>Đơn vị cơ sở</label>
                <Controller
                  name="base_uom"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={[...FABRIC_UOM_OPTIONS]}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.base_uom}
                    />
                  )}
                />
              </div>

              <div className="form-field">
                <label htmlFor="fv-conversion-rate">
                  Hệ số quy đổi (mét/kg)
                </label>
                <input
                  id="fv-conversion-rate"
                  className="field-input field-input--readonly"
                  type="number"
                  step="0.001"
                  readOnly
                  {...register('conversion_rate', { valueAsNumber: true })}
                />
                <span className="text-xs text-muted italic">
                  Tự tính: 1000 / (GSM x Khổ_m)
                </span>
              </div>
            </div>
          </fieldset>

          {/* ── Section: Truy xuất nguồn ── */}
          <fieldset className="form-section">
            <legend className="form-section-title">Truy xuất nguồn</legend>
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label htmlFor="fv-lot">Số lô nhuộm</label>
                <input
                  id="fv-lot"
                  className="field-input"
                  type="text"
                  placeholder="VD: L2026-W20"
                  {...register('lot_number')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="fv-sku">SKU</label>
                <input
                  id="fv-sku"
                  className="field-input"
                  type="text"
                  placeholder="VD: 11070011.BLACK.L01"
                  {...register('sku')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="fv-barcode">Barcode</label>
                <input
                  id="fv-barcode"
                  className="field-input"
                  type="text"
                  placeholder="Mã vạch quét kho"
                  {...register('barcode')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="fv-moq">MOQ (kg tối thiểu)</label>
                <input
                  id="fv-moq"
                  className={`field-input${errors.moq ? ' is-error' : ''}`}
                  type="number"
                  step="1"
                  min="0"
                  placeholder="VD: 300"
                  {...register('moq', { valueAsNumber: true })}
                />
              </div>
            </div>
          </fieldset>

          {/* ── Section: Giá & Trạng thái ── */}
          <fieldset className="form-section">
            <legend className="form-section-title">Giá & Trạng thái</legend>
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              <div className="form-field">
                <label htmlFor="fv-purchase-price">Giá nhập (VNĐ/kg)</label>
                <input
                  id="fv-purchase-price"
                  className="field-input"
                  type="number"
                  step="100"
                  min="0"
                  placeholder="VD: 85000"
                  {...register('purchase_price', { valueAsNumber: true })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="fv-selling-price">Giá bán (VNĐ/kg)</label>
                <input
                  id="fv-selling-price"
                  className="field-input"
                  type="number"
                  step="100"
                  min="0"
                  placeholder="VD: 120000"
                  {...register('selling_price', { valueAsNumber: true })}
                />
              </div>

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
          </fieldset>

          {/* ── Notes ── */}
          <div className="form-field">
            <label htmlFor="fv-notes">Ghi chú</label>
            <textarea
              id="fv-notes"
              className="field-textarea"
              rows={2}
              placeholder="Ghi chú thêm..."
              {...register('notes')}
            />
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
