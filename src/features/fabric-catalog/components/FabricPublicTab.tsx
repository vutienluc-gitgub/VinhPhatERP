import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';

import { Button, Icon, Switch, } from '@/shared/components';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { getLowestPrice } from '@/features/fabric-catalog/fabric-catalog.utils';

import { FabricPublicPreview } from './FabricPublicPreview';

type FabricPublicTabProps = {
  
  
  publicUrl: string;
  isSlugEditing: boolean;
  handleSlugEditStart: () => void;
  handleSlugEditCancel: () => void;
  handleCopyLink: () => void;
  handleDownloadQR: () => void;
  handlePrintQR: () => void;
  
  selectedCategoryName?: string;
};

export function FabricPublicTab({
  
  
  publicUrl,
  isSlugEditing,
  handleSlugEditStart,
  handleSlugEditCancel,
  handleCopyLink,
  handleDownloadQR,
  handlePrintQR,
  
  selectedCategoryName,
}: FabricPublicTabProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

  const [expandedSections, setExpandedSections] = React.useState<string[]>(
    ['pricing', 'planner', 'trust', 'inventory', 'public_page']
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const {
    fields: pricingTiers,
    append: appendTier,
    remove: removeTier,
  } = useFieldArray({
    control,
    name: 'pricing_tiers',
  });

  const watchIsPublic = watch('is_public');
  const watchSlug = watch('slug');
  const watchCode = watch('code');
  const watchName = watch('name');
  const watchComposition = watch('composition_tags');
  const watchWidthCm = watch('target_width_cm');
  const watchGsm = watch('target_gsm');
  const watchTechnique = watch('technique');
  
  const currentImageUrl = watch('image_url');
  const lowestPrice = getLowestPrice(pricingTiers);

  return (
    <>

            <div className="space-y-4">
              {/* Accordion 1: Công khai khách hàng */}
              <div
                className={`accordion-section${expandedSections.includes('customer') ? ' is-expanded' : ''}`}
              >
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleSection('customer')}
                >
                  <div className="accordion-header-title">
                    <Icon
                      name="ChevronDown"
                      className="accordion-header-chevron w-4 h-4"
                    />
                    <span>{LABELS.SECTION_CUSTOMER}</span>
                  </div>
                </button>
                {expandedSections.includes('customer') && (
                  <div className="accordion-content space-y-4">
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
                            <Switch
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Stock Display Mode */}
                    <div className="form-field">
                      <label className="font-semibold block mb-2">
                        {LABELS.STOCK_DISPLAY_LABEL}
                      </label>
                      <div className="stock-display-radio">
                        <label className="stock-display-radio-label">
                          <input
                            type="radio"
                            value="none"
                            checked={
                              watch('b2b_planner.public_stock_display') ===
                              'none'
                            }
                            onChange={() =>
                              setValue(
                                'b2b_planner.public_stock_display',
                                'none',
                              )
                            }
                          />
                          <span>{LABELS.STOCK_DISPLAY_NONE}</span>
                        </label>
                        <label className="stock-display-radio-label">
                          <input
                            type="radio"
                            value="status"
                            checked={
                              watch('b2b_planner.public_stock_display') ===
                              'status'
                            }
                            onChange={() =>
                              setValue(
                                'b2b_planner.public_stock_display',
                                'status',
                              )
                            }
                          />
                          <span>{LABELS.STOCK_DISPLAY_STATUS}</span>
                        </label>
                        <label className="stock-display-radio-label">
                          <input
                            type="radio"
                            value="quantity"
                            checked={
                              watch('b2b_planner.public_stock_display') ===
                              'quantity'
                            }
                            onChange={() =>
                              setValue(
                                'b2b_planner.public_stock_display',
                                'quantity',
                              )
                            }
                          />
                          <span>{LABELS.STOCK_DISPLAY_QUANTITY}</span>
                        </label>
                      </div>
                    </div>

                    {/* Trust Signals */}
                    <div className="form-field">
                      <label className="font-semibold block mb-2">
                        {LABELS.TRUST_SIGNALS_LABEL}
                      </label>
                      <div className="trust-signals-row">
                        <label className="trust-signal-checkbox-label">
                          <input
                            type="checkbox"
                            checked={
                              watch('b2b_planner.trust_has_sample') || false
                            }
                            onChange={(e) =>
                              setValue(
                                'b2b_planner.trust_has_sample',
                                e.target.checked,
                              )
                            }
                          />
                          <span>{LABELS.TRUST_HAS_SAMPLE}</span>
                        </label>
                        <label className="trust-signal-checkbox-label">
                          <input
                            type="checkbox"
                            checked={
                              watch('b2b_planner.trust_fast_delivery') || false
                            }
                            onChange={(e) =>
                              setValue(
                                'b2b_planner.trust_fast_delivery',
                                e.target.checked,
                              )
                            }
                          />
                          <span>{LABELS.TRUST_FAST_DELIVERY}</span>
                        </label>
                        <label className="trust-signal-checkbox-label">
                          <input
                            type="checkbox"
                            checked={
                              watch('b2b_planner.trust_tech_support') || false
                            }
                            onChange={(e) =>
                              setValue(
                                'b2b_planner.trust_tech_support',
                                e.target.checked,
                              )
                            }
                          />
                          <span>{LABELS.TRUST_TECH_SUPPORT}</span>
                        </label>
                      </div>
                    </div>

                    {/* Xem trang công khai */}
                    {watchIsPublic && watchSlug && (
                      <Button
                        type="button"
                        variant="primary"
                        className="view-public-btn"
                        onClick={() => window.open(publicUrl, '_blank')}
                      >
                        <Icon name="ExternalLink" className="w-4 h-4 mr-1" />
                        {LABELS.VIEW_PUBLIC_PAGE}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 2: Thông số Planner */}
              <div
                className={`accordion-section${expandedSections.includes('planner') ? ' is-expanded' : ''}`}
              >
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleSection('planner')}
                >
                  <div className="accordion-header-title">
                    <Icon
                      name="ChevronDown"
                      className="accordion-header-chevron w-4 h-4"
                    />
                    <span>{LABELS.SECTION_PLANNER}</span>
                  </div>
                </button>
                {expandedSections.includes('planner') && (
                  <div className="accordion-content space-y-4">
                    <div>
                      <div className="planner-group-label">
                        {LABELS.PLANNER_REQUIRED}
                      </div>
                      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                        <div className="form-field">
                          <label htmlFor="b2b-moq">{LABELS.MOQ_LABEL}</label>
                          <input
                            id="b2b-moq"
                            className={`field-input${errors.b2b_planner?.minimum_order_qty_kg ? ' is-error' : ''}`}
                            type="number"
                            min="0"
                            {...register('b2b_planner.minimum_order_qty_kg', {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="b2b-lead-time">
                            Giao hàng (ngày)
                          </label>
                          <input
                            id="b2b-lead-time"
                            className={`field-input${errors.b2b_planner?.lead_time_days ? ' is-error' : ''}`}
                            type="number"
                            min="0"
                            {...register('b2b_planner.lead_time_days', {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="b2b-capacity">
                            Năng lực SX (tấn/tháng)
                          </label>
                          <input
                            id="b2b-capacity"
                            className={`field-input${errors.b2b_planner?.production_capacity_monthly_tons ? ' is-error' : ''}`}
                            type="number"
                            min="0"
                            {...register(
                              'b2b_planner.production_capacity_monthly_tons',
                              {
                                valueAsNumber: true,
                              },
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="planner-group-label">
                        {LABELS.PLANNER_ADVANCED}
                      </div>
                      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                        <div className="form-field">
                          <label htmlFor="b2b-yield">
                            Hệ số hao hụt (0.5 - 2.0)
                          </label>
                          <input
                            id="b2b-yield"
                            className={`field-input${errors.b2b_planner?.yield_factor ? ' is-error' : ''}`}
                            type="number"
                            step="0.01"
                            min="0.5"
                            max="2.0"
                            {...register('b2b_planner.yield_factor', {
                              valueAsNumber: true,
                            })}
                          />
                          {errors.b2b_planner?.yield_factor && (
                            <span className="field-error">
                              {errors.b2b_planner.yield_factor.message}
                            </span>
                          )}
                        </div>
                        <div className="form-field">
                          <label htmlFor="b2b-standard-consumption">
                            {LABELS.STANDARD_CONSUMPTION_LABEL}
                          </label>
                          <input
                            id="b2b-standard-consumption"
                            className={`field-input${errors.b2b_planner?.standard_consumption_kg ? ' is-error' : ''}`}
                            type="number"
                            step="0.01"
                            min="0.05"
                            max="2.0"
                            placeholder={
                              LABELS.STANDARD_CONSUMPTION_PLACEHOLDER
                            }
                            {...register(
                              'b2b_planner.standard_consumption_kg',
                              {
                                valueAsNumber: true,
                              },
                            )}
                          />
                          {errors.b2b_planner?.standard_consumption_kg && (
                            <span className="field-error">
                              {
                                errors.b2b_planner.standard_consumption_kg
                                  .message
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Bảng giá */}
              <div
                className={`accordion-section${expandedSections.includes('pricing') ? ' is-expanded' : ''}`}
              >
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleSection('pricing')}
                >
                  <div className="accordion-header-title">
                    <Icon
                      name="ChevronDown"
                      className="accordion-header-chevron w-4 h-4"
                    />
                    <span>{LABELS.SECTION_PRICING}</span>
                    {lowestPrice !== null && (
                      <span className="lowest-price-badge">
                        {LABELS.PRICING_LOWEST_PREFIX}{' '}
                        {lowestPrice.toLocaleString('vi-VN')}đ/kg
                      </span>
                    )}
                  </div>
                </button>
                {expandedSections.includes('pricing') && (
                  <div className="accordion-content space-y-4">
                    {pricingTiers.length > 0 && (
                      <div className="pricing-tier-preview">
                        {pricingTiers.map((tier, index) => (
                          <div
                            className="pricing-tier-preview-card"
                            key={tier.id || index}
                          >
                            <div className="pricing-tier-preview-qty">
                              {tier.min_quantity}
                              {tier.max_quantity
                                ? `–${tier.max_quantity}`
                                : '+'}{' '}
                              kg
                            </div>
                            <div className="pricing-tier-preview-price">
                              {Number(tier.unit_price).toLocaleString('vi-VN')}{' '}
                              đ
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 mb-2">
                      <h4 className="font-semibold text-sm">
                        Chỉnh sửa chi tiết bậc giá
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          appendTier({
                            min_quantity: 0,
                            max_quantity: null,
                            unit_price: 0,
                            currency: 'VND',
                            display_label: '',
                            is_public_visible: true,
                          })
                        }
                      >
                        <Icon name="Plus" className="w-4 h-4 mr-1" /> Thêm bậc
                        giá
                      </Button>
                    </div>

                    {pricingTiers.length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                              <th className="p-3 w-32">{LABELS.PRICING_COL_MIN}</th>
                              <th className="p-3 w-32">{LABELS.PRICING_COL_MAX}</th>
                              <th className="p-3 w-40">{LABELS.PRICING_COL_PRICE}</th>
                              <th className="p-3">{LABELS.PRICING_COL_LABEL}</th>
                              <th className="p-3 w-20 text-center">{LABELS.PRICING_COL_PUBLIC}</th>
                              <th className="p-3 w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pricingTiers.map((field, index) => (
                              <tr key={field.id} className="bg-white">
                                <td className="p-2">
                                  <input
                                    className="field-input text-sm px-2 py-1.5 w-full"
                                    type="number"
                                    min="0"
                                    {...register(
                                      `pricing_tiers.${index}.min_quantity`,
                                      {
                                        valueAsNumber: true,
                                      },
                                    )}
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    className="field-input text-sm px-2 py-1.5 w-full"
                                    type="number"
                                    min="0"
                                    placeholder={LABELS.PRICING_MAX_PLACEHOLDER}
                                    {...register(
                                      `pricing_tiers.${index}.max_quantity`,
                                      {
                                        setValueAs: (v) =>
                                          v === '' ? null : Number(v),
                                      },
                                    )}
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    className="field-input text-sm px-2 py-1.5 w-full"
                                    type="number"
                                    min="0"
                                    {...register(
                                      `pricing_tiers.${index}.unit_price`,
                                      {
                                        valueAsNumber: true,
                                      },
                                    )}
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    className="field-input text-sm px-2 py-1.5 w-full"
                                    type="text"
                                    placeholder={LABELS.PRICING_LABEL_PLACEHOLDER}
                                    {...register(
                                      `pricing_tiers.${index}.display_label`,
                                    )}
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <Controller
                                    name={`pricing_tiers.${index}.is_public_visible`}
                                    control={control}
                                    render={({ field: switchField }) => (
                                      <Switch
                                        checked={switchField.value}
                                        onChange={switchField.onChange}
                                      />
                                    )}
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    className="text-red-500 hover:text-red-700 p-1"
                                    onClick={() => removeTier(index)}
                                    title="Xóa bậc giá"
                                  >
                                    <Icon name="Trash2" className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-muted text-sm bg-slate-50">
                        {LABELS.PRICING_EMPTY}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 4: SEO & QR */}
              <div
                className={`accordion-section${expandedSections.includes('seo') ? ' is-expanded' : ''}`}
              >
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleSection('seo')}
                >
                  <div className="accordion-header-title">
                    <Icon
                      name="ChevronDown"
                      className="accordion-header-chevron w-4 h-4"
                    />
                    <span>{LABELS.SECTION_SEO_QR}</span>
                  </div>
                </button>
                {expandedSections.includes('seo') && (
                  <div className="accordion-content space-y-4">
                    {/* Slug */}
                    <div className="form-field">
                      <label>{LABELS.SLUG_LABEL}</label>

                      {!isSlugEditing ? (
                        /* Locked slug display */
                        <div className="slug-locked">
                          <Icon
                            name="Lock"
                            size={14}
                            className="slug-locked__icon"
                          />
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
                            placeholder={LABELS.SLUG_PLACEHOLDER}
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
                        <span className="field-error">
                          {errors.slug.message}
                        </span>
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
                  </div>
                )}
              </div>

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
                  category={selectedCategoryName}
                  moq={watch('b2b_planner.minimum_order_qty_kg')}
                  leadTimeDays={watch('b2b_planner.lead_time_days')}
                  capacityMonthlyTons={watch(
                    'b2b_planner.production_capacity_monthly_tons',
                  )}
                  trustHasSample={watch('b2b_planner.trust_has_sample')}
                  trustFastDelivery={watch('b2b_planner.trust_fast_delivery')}
                  trustTechSupport={watch('b2b_planner.trust_tech_support')}
                  publicStockDisplay={watch('b2b_planner.public_stock_display')}
                  lowestPrice={lowestPrice}
                  standardConsumptionKg={watch(
                    'b2b_planner.standard_consumption_kg',
                  )}
                />
              )}
            </div>


    </>
  );
}
