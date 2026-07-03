import { useMemo } from 'react';

import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import type { PublicViewerPermissions } from '@/features/fabric-catalog/hooks/usePublicViewer';

/**
 * A single CTA button configuration computed by the engine.
 */
export interface CTAButtonConfig {
  id: string;
  label: string;
  icon: string;
  action: 'rfq' | 'sample' | 'call' | 'order' | 'erp';
  variant: 'primary' | 'secondary' | 'tertiary';
  href?: string;
}

interface UseCTAEngineParams {
  permissions: PublicViewerPermissions;
  fabric: Partial<FabricCatalog> | null | undefined;
  hasPricingTiers: boolean;
  slug?: string;
  code?: string;
}

const MOQ_PROJECT_THRESHOLD = 5000;

/**
 * Dynamic CTA Priority Engine.
 *
 * Computes the optimal set of 3 CTA buttons based on:
 * - Login state & role (permissions)
 * - Product pricing availability
 * - MOQ threshold
 *
 * Returns an ordered array of CTAButtonConfig (index 0 = highest priority).
 */
export function useCTAEngine({
  permissions,
  fabric,
  hasPricingTiers,
  slug,
  code,
}: UseCTAEngineParams): CTAButtonConfig[] {
  return useMemo(() => {
    const moqKg = fabric?.commercial?.minimum_order_qty_kg ?? 0;

    // --- Determine primary RFQ label based on context ---
    let rfqLabel = 'Yêu cầu báo giá';
    if (!hasPricingTiers) {
      rfqLabel = 'Liên hệ nhận giá';
    }
    if (moqKg >= MOQ_PROJECT_THRESHOLD) {
      rfqLabel = 'Trao đổi dự án';
    }

    const rfqButton: CTAButtonConfig = {
      id: 'rfq',
      label: rfqLabel,
      icon: 'FileText',
      action: 'rfq',
      variant: 'primary',
    };

    const sampleButton: CTAButtonConfig = {
      id: 'sample',
      label: 'Nhận mẫu',
      icon: 'Package',
      action: 'sample',
      variant: 'secondary',
    };

    const callButton: CTAButtonConfig = {
      id: 'call',
      label: 'Gọi ngay',
      icon: 'Phone',
      action: 'call',
      variant: 'tertiary',
    };

    const orderButton: CTAButtonConfig = {
      id: 'order',
      label: 'Đặt hàng',
      icon: 'ShoppingCart',
      action: 'order',
      variant: 'primary',
      href: `/portal/fabric-catalog?search=${code ?? ''}`,
    };

    const erpButton: CTAButtonConfig = {
      id: 'erp',
      label: 'Mở trong ERP',
      icon: 'ExternalLink',
      action: 'erp',
      variant: 'primary',
      href: `/fabric-catalog/${slug ?? ''}`,
    };

    // --- Priority rules ---
    if (permissions.canOpenERP) {
      return [erpButton, { ...rfqButton, variant: 'secondary' }, sampleButton];
    }

    if (permissions.canOrder) {
      return [
        orderButton,
        { ...rfqButton, variant: 'secondary' },
        sampleButton,
      ];
    }

    // Anonymous or basic viewer
    return [rfqButton, sampleButton, callButton];
  }, [permissions, fabric, hasPricingTiers, slug, code]);
}
