import { useMemo } from 'react';

import { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

export type ReadinessCheck = {
  id: string;
  label: string;
  points: number;
  passed: boolean;
};

export function useFabricReadinessScore(formValues: FabricCatalogFormValues) {
  return useMemo(() => {
    const checks: ReadinessCheck[] = [
      {
        id: 'image',
        label: LABELS.SCORE_CHECK_IMAGE,
        points: 20,
        passed: !!formValues.image_url,
      },
      {
        id: 'planner',
        label: LABELS.SCORE_CHECK_PLANNER,
        points: 20,
        passed:
          formValues.b2b_planner?.minimum_order_qty_kg !== undefined &&
          formValues.b2b_planner?.lead_time_days !== undefined,
      },
      {
        id: 'moq',
        label: LABELS.SCORE_CHECK_MOQ,
        points: 15,
        passed: (formValues.b2b_planner?.minimum_order_qty_kg || 0) > 0,
      },
      {
        id: 'seo',
        label: LABELS.SCORE_CHECK_SEO,
        points: 15,
        passed: !!formValues.slug,
      },
      {
        id: 'gallery',
        label: LABELS.SCORE_CHECK_GALLERY,
        points: 15,
        passed: (formValues.images?.length || 0) > 0,
      },
      {
        id: 'pricing',
        label: LABELS.SCORE_CHECK_PRICING,
        points: 15,
        passed: (formValues.pricing_tiers?.length || 0) > 0,
      },
    ];

    let score = 0;
    checks.forEach((check) => {
      score += check.passed ? check.points : 0;
    });

    return { score, checks };
  }, [formValues]);
}
