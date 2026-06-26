import { Icon } from '@/shared/components/Icon';
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
}: FabricPublicPreviewProps) {
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
    trustHasSample ? LABELS.PREVIEW_TRUST_SAMPLE : null,
    trustFastDelivery ? LABELS.PREVIEW_TRUST_FAST : null,
    trustTechSupport ? LABELS.PREVIEW_TRUST_TECH : null,
  ].filter(Boolean);

  return (
    <div className="fabric-preview-card">
      <p className="fabric-preview-card__title">{LABELS.PREVIEW_TITLE}</p>

      <div className="fabric-preview-card__body">
        {/* Image */}
        <div className="fabric-preview-card__image">
          {imageUrl ? (
            <img src={imageUrl} alt={name || code} />
          ) : (
            <div className="fabric-preview-card__image-placeholder">
              <Icon name="Image" size={24} className="text-muted" />
              <span>{LABELS.PREVIEW_NO_IMAGE}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="fabric-preview-card__info">
          <span className="fabric-preview-card__code">{code || LABELS.NA}</span>
          <span className="fabric-preview-card__name">{name || LABELS.NA}</span>

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
            <div className="text-xs text-emerald-600 font-semibold flex flex-wrap gap-x-2 gap-y-1 mt-1">
              {trustSignals.map((sig, i) => (
                <span key={i}>{sig}</span>
              ))}
            </div>
          )}

          {/* KPI Grid */}
          <div className="preview-kpi-grid">
            <div className="preview-kpi-item">
              <span className="preview-kpi-label">
                {LABELS.PREVIEW_KPI_MOQ}
              </span>
              <span className="preview-kpi-value">
                {moq ?? 100} {LABELS.PREVIEW_UNIT_KG}
              </span>
            </div>
            <div className="preview-kpi-item">
              <span className="preview-kpi-label">
                {LABELS.PREVIEW_KPI_LEAD_TIME}
              </span>
              <span className="preview-kpi-value">
                {leadTimeDays ?? 7} {LABELS.PREVIEW_UNIT_DAY}
              </span>
            </div>
            <div className="preview-kpi-item">
              <span className="preview-kpi-label">
                {LABELS.PREVIEW_KPI_CAPACITY}
              </span>
              <span className="preview-kpi-value">
                {capacityMonthlyTons ?? 20}
                {LABELS.PREVIEW_UNIT_CAPACITY}
              </span>
            </div>
            <div className="preview-kpi-item">
              <span className="preview-kpi-label">
                {LABELS.PREVIEW_KPI_CONSUMPTION}
              </span>
              <span className="preview-kpi-value">
                {standardConsumptionKg ?? 0.25}{' '}
                {LABELS.PREVIEW_UNIT_CONSUMPTION}
              </span>
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
            <div className="text-sm font-bold text-primary mt-1">
              {LABELS.PREVIEW_PRICE_PREFIX}{' '}
              {lowestPrice.toLocaleString('vi-VN')} {LABELS.PREVIEW_PRICE_UNIT}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
