import { useEffect } from 'react';
import {
  UseFormSetValue,
  UseFormWatch,
  UseFieldArrayReplace,
} from 'react-hook-form';

import { fetchBomById } from '@/api/bom.api';

import type { CreateWorkOrderInput } from './work-orders.module';

interface UseWorkOrderLogicParams {
  watch: UseFormWatch<CreateWorkOrderInput>;
  setValue: UseFormSetValue<CreateWorkOrderInput>;
  replace: UseFieldArrayReplace<CreateWorkOrderInput, 'yarn_requirements'>;
  isEditing: boolean;
  initialBomId?: string;
  initialQty?: number;
}

/**
 * Domain hook: Handles BOM-based auto-calculation logic for Work Orders.
 *
 * Responsibilities:
 * - Watch `bom_template_id`, `target_quantity_m`, `standard_loss_pct`
 * - Auto-populate yarn requirements from BOM
 * - Auto-calculate `target_weight_kg` from consumption rates
 * - Recalculate kg when quantity changes during edit
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
  const watchedQty = watch('target_quantity_m');
  const watchedLoss = watch('standard_loss_pct');

  useEffect(() => {
    if (!watchedBomId || watchedQty <= 0) return;

    const fetchAndPopulate = async () => {
      try {
        const bom = await fetchBomById(watchedBomId);
        if (!bom) return;

        const yarns = bom.bom_yarn_items || [];
        const loss = bom.standard_loss_pct || 0;

        // Update loss pct if it's a new order or BOM changed
        if (!isEditing || watchedBomId !== initialBomId) {
          setValue('standard_loss_pct', loss);
        }

        // Calculate target weight from consumption rates
        const totalConsumptionPerM = yarns.reduce(
          (sum, y) => sum + (y.consumption_kg_per_m || 0),
          0,
        );
        const targetKg = watchedQty * totalConsumptionPerM;
        setValue('target_weight_kg', Number(targetKg.toFixed(2)));

        // Calculate total yarn required (accounting for loss)
        const currentLoss = watch('standard_loss_pct') || loss;
        const totalRequiredYarnKg = targetKg / (1 - currentLoss / 100);

        const newRequirements = yarns.map((y) => ({
          yarn_catalog_id: y.yarn_catalog_id,
          bom_ratio_pct: y.ratio_pct,
          required_kg: Number(
            (totalRequiredYarnKg * (y.ratio_pct / 100)).toFixed(2),
          ),
        }));

        // Auto-replace only if Creating OR if BOM changed during Edit
        if (!isEditing || watchedBomId !== initialBomId) {
          replace(newRequirements);
        } else if (isEditing && watchedQty !== initialQty) {
          // If only quantity changed during edit, recalculate kg for existing lines
          const currentReqs = watch('yarn_requirements');
          const updatedReqs = currentReqs.map((r) => ({
            ...r,
            required_kg: Number(
              (totalRequiredYarnKg * (r.bom_ratio_pct / 100)).toFixed(2),
            ),
          }));
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
