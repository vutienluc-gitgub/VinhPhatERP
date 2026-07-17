import { COSTING_LABELS } from '@/features/costing/costing.constants';
import { fetchBomById } from '@/api/bom.api';
import { fetchLatestYarnPrices } from '@/api/yarn-receipts.api';
import { calculateGreigeCostEstimation } from '@/domain/production/ProductionDomain';
import type {
  CostingSimulationState,
  CostingResult,
  CostingYarnItem,
  CostBreakdownItem,
} from '@/features/costing/types/greige-costing.type';

export class GreigeCostingService {
  /**
   * Load BOM and latest yarn prices to initialize the simulation state.
   */
  static async loadSimulationStateFromBom(
    bomId: string,
  ): Promise<CostingSimulationState> {
    const bom = await fetchBomById(bomId);
    if (!bom) throw new Error('BOM not found');

    const yarnItems = bom.bom_yarn_items || [];
    const catalogIds = yarnItems
      .map((item) => item.yarn_catalog_id)
      .filter(Boolean) as string[];

    let yarnPrices: Record<string, number> = {};
    if (catalogIds.length > 0) {
      yarnPrices = await fetchLatestYarnPrices(catalogIds);
    }

    const yarnItemsMapped: CostingYarnItem[] = yarnItems.map((item) => ({
      id: item.id,
      yarn_catalog_id: item.yarn_catalog_id ?? '',
      yarn_code: item.yarn_catalogs?.code ?? '',
      yarn_name: item.yarn_catalogs?.name ?? '',
      ratio_pct: item.ratio_pct,
      consumption_kg_per_m: item.consumption_kg_per_m ?? 0,
      base_price: yarnPrices[item.yarn_catalog_id ?? ''] || 0,
      override_price: null,
      is_override: false,
    }));

    return {
      bom_template_id: bom.id,
      bom_code: bom.code,
      target_quantity_m: 1000, // Default for simulation
      standard_loss_pct: bom.standard_loss_pct ?? 0,
      weaving_unit_price: 0,
      weaving_price_unit: 'kg',
      profitMarginPct: 15,
      yarnItems: yarnItemsMapped,
    };
  }

  /**
   * Execute the cost engine calculation based on the simulation state.
   */
  static calculate(state: CostingSimulationState): CostingResult | null {
    if (state.yarnItems.length === 0 || state.target_quantity_m <= 0)
      return null;

    let directYarnCost = 0;
    let targetWeightKg = 0;
    const breakdown: CostBreakdownItem[] = [];

    // 1. Calculate Yarn Cost based on BOM consumption and selected prices
    for (const item of state.yarnItems) {
      const activePrice = item.is_override
        ? (item.override_price ?? item.base_price)
        : item.base_price;

      // required kg for this yarn to produce target_quantity_m (without waste, waste added later)
      const requiredKg = state.target_quantity_m * item.consumption_kg_per_m;
      targetWeightKg += requiredKg;
      const cost = activePrice * requiredKg;
      directYarnCost += cost;

      if (cost > 0) {
        breakdown.push({
          key: `yarn_${item.yarn_catalog_id}`,
          label: `${COSTING_LABELS.YARN_PREFIX}${item.yarn_code}`,
          amount: cost,
          percentage: 0, // calculated later
          type: 'yarn',
        });
      }
    }

    // 2. Core Estimation
    const weavingQty =
      state.weaving_price_unit === 'kg'
        ? targetWeightKg
        : state.target_quantity_m;
    const estimation = calculateGreigeCostEstimation(
      directYarnCost,
      state.standard_loss_pct,
      state.weaving_unit_price,
      weavingQty,
      state.profitMarginPct,
    );

    // 3. Add to breakdown
    if (estimation.processingCost > 0) {
      breakdown.push({
        key: 'processing',
        label: COSTING_LABELS.WEAVING_COST_LABEL,
        amount: estimation.processingCost,
        percentage: 0,
        type: 'processing',
      });
    }

    // Note: in ProductionDomain, wasteCost is purely for reporting and not double-counted into totalCost
    // But for a cost breakdown table representing 100% of the total, we only include directYarnCost and processingCost.

    // Calculate percentages
    breakdown.forEach((item) => {
      item.percentage =
        estimation.totalCost > 0
          ? (item.amount / estimation.totalCost) * 100
          : 0;
    });

    const suggestedPricePerM = estimation.finalPrice / state.target_quantity_m;

    return {
      ...estimation,
      breakdown,
      suggestedPricePerM,
    };
  }
}
