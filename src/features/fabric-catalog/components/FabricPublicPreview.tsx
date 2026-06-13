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
        </div>
      </div>
    </div>
  );
}
