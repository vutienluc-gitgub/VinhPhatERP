import { useMemo } from 'react';

import type {
  FabricCatalog,
  FabricVariant,
} from '@/domain/settings/fabric-catalog.types';
import {
  calculateFabricLength,
  calculateGarmentProduction,
  calculateFabricWeightFromLength,
  calculateFabricWeightFromGarments,
} from '@/features/fabric-catalog/components/b2b-planner.utils';
import { useGarmentConversionRules } from '@/application/settings/useFabricCatalog';

export type B2BInputMode = 'weight' | 'length' | 'garment';

export interface B2BPlannerState {
  mode: B2BInputMode;
  value: string;
  garmentRuleId: string;
}

export function useB2BPlannerLogic(
  fabric: Partial<FabricCatalog>,
  state: B2BPlannerState,
  activeVariant?: FabricVariant,
) {
  const { data: garmentRules } = useGarmentConversionRules();

  // Phase 2: Yield Factor is fixed at 1.05 (5% waste) based on user confirmation
  const yieldFactor = 1.05;

  // 1. Calculate anchor weightKg based on input mode
  const weightKg = useMemo(() => {
    const numValue = Number(state.value) || 0;
    if (numValue <= 0) return 0;

    switch (state.mode) {
      case 'weight':
        return numValue;
      case 'length':
        return (
          calculateFabricWeightFromLength(
            numValue,
            fabric.target_gsm,
            fabric.target_width_cm,
          ) || 0
        );
      case 'garment': {
        const selectedRule = garmentRules?.find(
          (r) => r.id === state.garmentRuleId,
        );
        if (!selectedRule) return 0;
        return calculateFabricWeightFromGarments(
          numValue,
          selectedRule.avg_consumption_kg,
          yieldFactor,
        );
      }
      default:
        return 0;
    }
  }, [
    state.mode,
    state.value,
    state.garmentRuleId,
    garmentRules,
    fabric.target_gsm,
    fabric.target_width_cm,
  ]);

  // 2. Derive commercial validations
  const moq =
    fabric.commercial?.minimum_order_qty_kg ||
    fabric.commercial?.minimum_order_qty ||
    0;

  const isMoqMet = weightKg > 0 && weightKg >= moq;

  const leadTimeDays = fabric.commercial?.lead_time_days || 7;
  const expectedDeliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + leadTimeDays);
    return date.toLocaleDateString('vi-VN');
  }, [leadTimeDays]);

  const capacityTons =
    fabric.commercial?.production_capacity_monthly_tons || 20;
  const capacityUtilizationPct = useMemo(() => {
    if (capacityTons <= 0) return 0;
    const capacityKg = capacityTons * 1000;
    return (weightKg / capacityKg) * 100;
  }, [weightKg, capacityTons]);

  // 3. Phase 2: Inventory & Production Timeline
  const inventoryAvailableKg = activeVariant?.available_kg || 0;
  const needsProduction = weightKg > inventoryAvailableKg;
  const missingProductionKg = needsProduction
    ? weightKg - inventoryAvailableKg
    : 0;

  const deliveryTimeline = useMemo(() => {
    if (!needsProduction) return null;
    return [
      {
        step: 'Dệt mộc',
        percentage: 30,
        days: Math.max(1, Math.round(leadTimeDays * 0.3)),
      },
      {
        step: 'Nhuộm',
        percentage: 40,
        days: Math.max(1, Math.round(leadTimeDays * 0.4)),
      },
      {
        step: 'Hoàn thiện & KCS',
        percentage: 20,
        days: Math.max(1, Math.round(leadTimeDays * 0.2)),
      },
      {
        step: 'Giao hàng',
        percentage: 10,
        days: Math.max(1, Math.round(leadTimeDays * 0.1)),
      },
    ];
  }, [needsProduction, leadTimeDays]);

  // 4. Phase 2: Yield Analysis
  // If weightKg is Gross Weight (Khối lượng đặt mua), then Net Weight (Vải thực dùng) is:
  const netWeightKg = weightKg > 0 ? weightKg / yieldFactor : 0;
  const wasteKg = weightKg > 0 ? weightKg - netWeightKg : 0;

  // 5. Phase 2: Roll Estimation
  // Fallback to 20kg/roll if roll_count data is missing
  const avgRollWeight =
    inventoryAvailableKg > 0 &&
    activeVariant?.roll_count &&
    activeVariant.roll_count > 0
      ? inventoryAvailableKg / activeVariant.roll_count
      : 20;
  const estimatedRolls = weightKg > 0 ? Math.ceil(weightKg / avgRollWeight) : 0;

  // 6. Derive estimations
  const lengthMeters = useMemo(
    () =>
      calculateFabricLength(
        weightKg,
        fabric.target_gsm,
        fabric.target_width_cm,
      ),
    [weightKg, fabric.target_gsm, fabric.target_width_cm],
  );

  const isMissingSpecs =
    weightKg > 0 && (!fabric.target_gsm || !fabric.target_width_cm);

  const estimatedGarments = useMemo(() => {
    if (!garmentRules || garmentRules.length === 0 || weightKg <= 0) return [];

    return garmentRules.map((rule) => ({
      ...rule,
      estimatedQty: calculateGarmentProduction(
        weightKg,
        rule.avg_consumption_kg,
        yieldFactor,
      ),
    }));
  }, [garmentRules, weightKg]);

  // Context for RFQ auto-fill
  const plannerContext = useMemo(() => {
    return {
      weightKg,
      lengthMeters,
      estimatedGarments:
        state.mode === 'garment'
          ? Number(state.value)
          : estimatedGarments[0]?.estimatedQty || 0,
      leadTimeDays,
    };
  }, [
    weightKg,
    lengthMeters,
    state.mode,
    state.value,
    estimatedGarments,
    leadTimeDays,
  ]);

  return {
    weightKg,
    moq,
    isMoqMet,
    leadTimeDays,
    expectedDeliveryDate,
    capacityTons,
    capacityUtilizationPct,
    lengthMeters,
    isMissingSpecs,
    estimatedGarments,
    garmentRules,
    plannerContext,
    // Phase 2 Returns
    inventoryAvailableKg,
    needsProduction,
    missingProductionKg,
    deliveryTimeline,
    netWeightKg,
    wasteKg,
    estimatedRolls,
    yieldFactor,
  };
}
