import toast from 'react-hot-toast';

import type {
  FabricCatalog,
  FabricVariant,
} from '@/domain/settings/fabric-catalog.types';
import {
  PUBLIC_PAGE_LABELS as LABELS,
  LEAD_TIME_UNIT_MAP,
  HOTLINE,
} from '@/features/fabric-catalog/fabric-catalog.constants';

/**
 * Compute lowest visible price label from pricing tiers.
 */
export function getLowestPriceLabel(
  tiers: Array<{ unit_price: number; is_public_visible?: boolean }> | undefined,
): number | null {
  if (!tiers || tiers.length === 0) return null;
  const publicTiers = tiers.filter((t) => t.is_public_visible !== false);
  if (publicTiers.length === 0) return null;
  return Math.min(...publicTiers.map((t) => t.unit_price));
}

export function useFabricDisplayLogic(
  fabric: Partial<FabricCatalog> | null | undefined,
  variants: FabricVariant[] | undefined,
  activeColorName: string | null,
) {
  const activeVariant = variants?.find((v) => v.color_name === activeColorName);
  const override = activeVariant?.commercial_override;

  const displayMOQ = override
    ? override.minimum_stock_order
      ? `${override.minimum_stock_order} ${fabric?.commercial?.minimum_order_unit || fabric?.unit || 'kg'} (Hàng sẵn)`
      : override.minimum_custom_order
        ? `${override.minimum_custom_order} ${fabric?.commercial?.minimum_order_unit || fabric?.unit || 'kg'} (Đặt sản xuất)`
        : LABELS.na
    : fabric?.commercial?.minimum_order_qty_kg
      ? `${fabric.commercial.minimum_order_qty_kg} kg`
      : fabric?.commercial?.minimum_order_qty
        ? `${fabric.commercial.minimum_order_qty} ${fabric.commercial.minimum_order_unit || fabric.unit || 'kg'}`
        : LABELS.na;

  const displayLeadTime = override
    ? override.lead_time_stock
      ? `${override.lead_time_stock} ${LEAD_TIME_UNIT_MAP[override.lead_time_unit || 'day'] || override.lead_time_unit} (Hàng sẵn)`
      : override.lead_time_custom
        ? `${override.lead_time_custom} ${LEAD_TIME_UNIT_MAP[override.lead_time_unit || 'day'] || override.lead_time_unit} (Sản xuất)`
        : LABELS.na
    : fabric?.commercial?.lead_time_days
      ? `${fabric.commercial.lead_time_days} ngày`
      : fabric?.commercial?.lead_time_min
        ? `${fabric.commercial.lead_time_min}-${fabric.commercial.lead_time_max} ${LEAD_TIME_UNIT_MAP[fabric.commercial.lead_time_unit || 'day'] || fabric.commercial.lead_time_unit}`
        : LABELS.na;

  const handleShare = () => {
    if (!fabric) return;
    const shareText = `${fabric.code} | ${fabric.name}\n- Thành phần: ${fabric.composition || 'N/A'}\n- Khổ: ${fabric.target_width_cm || ''}cm\n- Định lượng: ${fabric.target_gsm || ''}gsm\nLink: ${window.location.href}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${fabric.code} - ${fabric.name}`,
          text: shareText,
          url: window.location.href,
        })
        .catch((err) => {
          // If user cancels or browser blocks share sheet, fallback to copy
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error('[ShareError]', err);
          }
          navigator.clipboard.writeText(shareText);
          toast.success(LABELS.copiedLink);
        });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success(LABELS.copiedLink);
    }
  };

  const getZaloQuoteUrl = () => {
    if (!fabric) return '';
    const msg = `Xin chào,\nTôi muốn nhận báo giá:\n- Mã vải: ${fabric.code}\n- Tên: ${fabric.name}\n- Màu: ${activeColorName || 'Tất cả màu'}\n- MOQ: ${displayMOQ}\nVui lòng tư vấn giúp.`;
    return `https://zalo.me/${HOTLINE}?text=${encodeURIComponent(msg)}`;
  };

  return {
    activeVariant,
    displayMOQ,
    displayLeadTime,
    handleShare,
    getZaloQuoteUrl,
  };
}
