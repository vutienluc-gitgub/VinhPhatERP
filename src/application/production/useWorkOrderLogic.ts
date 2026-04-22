import { useEffect } from 'react';
import {
  UseFormSetValue,
  UseFormWatch,
  UseFieldArrayReplace,
} from 'react-hook-form';

import { fetchBomById } from '@/api/bom.api';
import {
  calculateTargetWeightKg,
  calculateYarnRequirements,
  recalculateRequirementKg,
} from '@/domain/production/ProductionDomain';
import type { BomYarnItem } from '@/domain/production/ProductionDomain';
import type { CreateWorkOrderInput } from '@/features/work-orders/work-orders.module';

interface UseWorkOrderLogicParams {
  watch: UseFormWatch<CreateWorkOrderInput>;
  setValue: UseFormSetValue<CreateWorkOrderInput>;
  replace: UseFieldArrayReplace<CreateWorkOrderInput, 'yarn_requirements'>;
  isEditing: boolean;
  initialBomId?: string;
  initialQty?: number;
}

/**
 * UI hook: Handles BOM-based auto-calculation logic for Work Orders.
 * Business logic delegated to ProductionDomain.
 */
export function useWorkOrderLogic({
  watch,
  setValue,
  replace,
  isEditing,
  initialBomId,
  initialQty,
}: UseWorkOrderLogicParams) {
  const watchedBomId = watch('bom_template_id');
  const watchedQty = watch('target_quantity');
  const watchedLoss = watch('standard_loss_pct');

  useEffect(() => {
    if (!watchedBomId || watchedQty <= 0) return;

    const fetchAndPopulate = async () => {
      try {
        const bom = await fetchBomById(watchedBomId);
        if (!bom) return;

        const bomYarns: BomYarnItem[] = (bom.bom_yarn_items || []).map((y) => ({
          yarn_catalog_id: y.yarn_catalog_id,
          ratio_pct: y.ratio_pct,
          consumption_kg_per_m: y.consumption_kg_per_m || 0,
        }));
        const bomLoss = bom.standard_loss_pct || 0;

        if (!isEditing || watchedBomId !== initialBomId) {
          setValue('standard_loss_pct', bomLoss);
        }

        const targetKg = calculateTargetWeightKg(watchedQty, bomYarns);
        setValue('target_weight_kg', targetKg);

        const currentLoss = watch('standard_loss_pct') || bomLoss;

        if (!isEditing || watchedBomId !== initialBomId) {
          const newReqs = calculateYarnRequirements(
            watchedQty,
            bomYarns,
            currentLoss,
          );
          replace(newReqs);
        } else if (isEditing && watchedQty !== initialQty) {
          const currentReqs = watch('yarn_requirements');
          const updatedReqs = recalculateRequirementKg(
            currentReqs,
            watchedQty,
            bomYarns,
            currentLoss,
          );
          replace(updatedReqs);
        }
      } catch (err) {
        console.error('Error auto-populating yarns:', err);
      }
    };

    void fetchAndPopulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedBomId, watchedQty, watchedLoss]);
}
