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

  const handleShare = async () => {
    if (!fabric) return;

    const lines = [`${fabric.code} | ${fabric.name}`, ''];
    if (fabric.composition) lines.push(`✓ ${fabric.composition}`);
    if (fabric.target_width_cm)
      lines.push(`✓ Khổ: ${fabric.target_width_cm} cm`);
    if (fabric.target_gsm) lines.push(`✓ Định lượng: ${fabric.target_gsm} gsm`);
    if (displayMOQ && displayMOQ !== LABELS.na)
      lines.push(`✓ MOQ: ${displayMOQ}`);
    if (displayLeadTime && displayLeadTime !== LABELS.na)
      lines.push(`✓ Lead Time: ${displayLeadTime}`);

    lines.push('');
    lines.push('👉 Xem đầy đủ thông số, nhận mẫu và báo giá:');
    lines.push(window.location.href);

    const shareText = lines.join('\n');

    if (navigator.share) {
      const shareData: ShareData = {
        title: `${fabric.code} - ${fabric.name}`,
        text: shareText,
        url: window.location.href,
      };

      // Attempt to fetch and attach image thumbnail
      const targetImageUrl =
        activeVariant?.public_image_url || fabric.image_url;
      if (targetImageUrl) {
        try {
          const response = await fetch(targetImageUrl);
          if (response.ok) {
            const blob = await response.blob();
            // Determine extension from type, default to jpg
            const ext = blob.type.split('/')[1] || 'jpg';
            const shareFile = new File([blob], `${fabric.code}.${ext}`, {
              type: blob.type,
            });

            // Check if browser supports sharing files
            if (
              navigator.canShare &&
              navigator.canShare({ files: [shareFile] })
            ) {
              shareData.files = [shareFile];
            }
          }
        } catch (e) {
          console.warn('Failed to fetch image for share:', e);
        }
      }

      navigator.share(shareData).catch((err) => {
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

  const displayYieldMetersPerKg =
    fabric?.target_gsm && fabric?.target_width_cm
      ? (1000 / ((fabric.target_width_cm / 100) * fabric.target_gsm)).toFixed(1)
      : null;

  return {
    activeVariant,
    displayMOQ,
    displayLeadTime,
    displayYieldMetersPerKg,
    handleShare,
    getZaloQuoteUrl,
  };
}
