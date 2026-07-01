import * as React from 'react';

import { Icon } from '@/shared/components/Icon';
import type { IconName } from '@/shared/components/Icon';
import { WeightText, QuantityText, MoneyText } from '@/shared/value';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

type FabricPublicPreviewProps = {
  imageUrl: string | null | undefined;
  code: string;
  name: string;
  composition: string | string[] | undefined;
  targetWidthCm: number | null | undefined;
  targetGsm: number | null | undefined;
  technique: string | null | undefined;
  category?: string;
  moq?: number | null;
  leadTimeDays?: number | null;
  capacityMonthlyTons?: number | null;
  trustHasSample?: boolean;
  trustFastDelivery?: boolean;
  trustTechSupport?: boolean;
  publicStockDisplay?: 'none' | 'status' | 'quantity' | null;
  lowestPrice?: number | null;
  standardConsumptionKg?: number | null;
  onNavigate?: (section: string) => void;
};

/**
 * Mini card giả lập trang công khai mà khách hàng sẽ thấy khi quét QR.
 * Hiển thị live-preview dựa trên dữ liệu form đang nhập.
 */
export function FabricPublicPreview({
  imageUrl,
  code,
  name,
  composition,
  targetWidthCm,
  targetGsm,
  technique,
  category,
  moq,
  leadTimeDays,
  capacityMonthlyTons,
  trustHasSample,
  trustFastDelivery,
  trustTechSupport,
  publicStockDisplay,
  lowestPrice,
  standardConsumptionKg,
  onNavigate,
}: FabricPublicPreviewProps) {
  const [device, setDevice] = React.useState<'mobile' | 'desktop'>('mobile');

  const specs = [
    targetWidthCm
      ? `${LABELS.WIDTH} ${targetWidthCm} ${LABELS.PREVIEW_WIDTH_UNIT}`
      : null,
    targetGsm ? `${LABELS.GSM} ${targetGsm} ${LABELS.PREVIEW_GSM_UNIT}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const displayComposition = Array.isArray(composition)
    ? composition.join(', ')
    : composition;

  const trustSignals = [
    trustHasSample
      ? { label: LABELS.PREVIEW_TRUST_SAMPLE, icon: 'CheckCircle2' }
      : null,
    trustFastDelivery
      ? { label: LABELS.PREVIEW_TRUST_FAST, icon: 'Truck' }
      : null,
    trustTechSupport
      ? { label: LABELS.PREVIEW_TRUST_TECH, icon: 'Wrench' }
      : null,
  ].filter(Boolean) as { label: string; icon: IconName }[];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="font-semibold text-sm text-slate-700">
          {LABELS.PREVIEW_TITLE}
        </p>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border">
          <button
            type="button"
            className={`p-1 rounded-md transition-colors ${device === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setDevice('desktop')}
            title={LABELS.PREVIEW_DESKTOP}
          >
            <Icon name="Monitor" size={14} />
          </button>
          <button
            type="button"
            className={`p-1 rounded-md transition-colors ${device === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setDevice('mobile')}
            title={LABELS.PREVIEW_MOBILE}
          >
            <Icon name="Smartphone" size={14} />
          </button>
        </div>
      </div>

      <div
        className={`fabric-preview-card transition-all duration-300 mx-auto ${device === 'mobile' ? 'w-[320px]' : 'w-full'}`}
      >
        <div className="fabric-preview-card__body">
          {/* Image */}
          <div
            className="fabric-preview-card__image group relative cursor-pointer"
            onClick={() => onNavigate?.('gallery')}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={name || code} />
            ) : (
              <div className="fabric-preview-card__image-placeholder">
                <Icon name="Image" size={24} className="text-muted" />
                <span>{LABELS.PREVIEW_NO_IMAGE}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-xs font-medium flex items-center gap-1">
                <Icon name="ImagePlus" size={14} /> {LABELS.PREVIEW_GALLERY}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="fabric-preview-card__info">
            <span className="fabric-preview-card__code">
              {code || LABELS.NA}
            </span>
            <span className="fabric-preview-card__name">
              {name || LABELS.NA}
            </span>

            {category && (
              <span className="fabric-preview-card__meta">{category}</span>
            )}

            {technique && (
              <span className="fabric-preview-card__meta">{technique}</span>
            )}

            {displayComposition && (
              <span className="fabric-preview-card__meta">
                {displayComposition}
              </span>
            )}

            {specs && (
              <span className="fabric-preview-card__meta fabric-preview-card__specs">
                {specs}
              </span>
            )}

            {/* Trust Signals */}
            {trustSignals.length > 0 && (
              <div
                className="flex flex-wrap gap-x-3 gap-y-2 mt-2 cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded"
                onClick={() => onNavigate?.('customer')}
              >
                {trustSignals.map((sig, i) => (
                  <span
                    key={i}
                    className="text-[11px] text-slate-700 font-medium flex items-center gap-1"
                  >
                    <Icon
                      name={sig.icon}
                      size={12}
                      className="text-emerald-500"
                    />
                    {sig.label}
                  </span>
                ))}
              </div>
            )}

            {/* KPI Grid */}
            <div
              className="preview-kpi-grid cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => onNavigate?.('planner')}
            >
              <div className="preview-kpi-item">
                <span className="preview-kpi-label">
                  {LABELS.PREVIEW_KPI_MOQ}
                </span>
                <WeightText className="preview-kpi-value" value={moq ?? 100} />
              </div>
              <div className="preview-kpi-item">
                <span className="preview-kpi-label">
                  {LABELS.PREVIEW_KPI_LEAD_TIME}
                </span>
                <QuantityText
                  className="preview-kpi-value"
                  value={leadTimeDays ?? 7}
                  suffix={LABELS.PREVIEW_UNIT_DAY}
                />
              </div>
              <div className="preview-kpi-item">
                <span className="preview-kpi-label">
                  {LABELS.PREVIEW_KPI_CAPACITY}
                </span>
                <WeightText
                  className="preview-kpi-value"
                  value={capacityMonthlyTons ?? 20}
                  suffix={LABELS.PREVIEW_UNIT_CAPACITY}
                />
              </div>
              <div className="preview-kpi-item">
                <span className="preview-kpi-label">
                  {LABELS.PREVIEW_KPI_CONSUMPTION}
                </span>
                <WeightText
                  className="preview-kpi-value"
                  value={standardConsumptionKg ?? 0.25}
                  suffix={LABELS.PREVIEW_UNIT_CONSUMPTION}
                />
              </div>
            </div>

            {/* Stock display badge simulation */}
            {publicStockDisplay && publicStockDisplay !== 'none' && (
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                {publicStockDisplay === 'quantity'
                  ? LABELS.PREVIEW_STOCK_QUANTITY.replace('{qty}', '150')
                  : LABELS.PREVIEW_STOCK_STATUS}
              </div>
            )}

            {/* Lowest price */}
            {lowestPrice != null && (
              <div
                className="text-sm font-bold text-primary mt-2 cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded"
                onClick={() => onNavigate?.('pricing')}
              >
                {LABELS.PREVIEW_PRICE_PREFIX} <MoneyText value={lowestPrice} />/
                {LABELS.PREVIEW_UNIT_KG}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
