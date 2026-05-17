import type { GreigeCostEstimation } from '@/domain/production/ProductionDomain';

export interface CostingYarnItem {
  id: string; // from bom_yarn_items
  yarn_catalog_id: string;
  yarn_code: string;
  yarn_name: string;
  ratio_pct: number;
  consumption_kg_per_m: number;
  base_price: number; // Tự động load từ phiếu nhập
  override_price: number | null; // Giá nhập tay (nếu có)
  is_override: boolean;
}

export interface CostingSimulationState {
  bom_template_id: string | null;
  bom_code: string | null;
  target_quantity_m: number;
  standard_loss_pct: number;
  weaving_unit_price: number;
  weaving_price_unit: 'kg' | 'm';
  profitMarginPct: number;
  yarnItems: CostingYarnItem[];
}

export interface CostBreakdownItem {
  key: string;
  label: string;
  amount: number;
  percentage: number;
  type: 'yarn' | 'processing' | 'waste' | 'additional';
}

export interface CostingResult extends GreigeCostEstimation {
  breakdown: CostBreakdownItem[];
  suggestedPricePerM: number;
}
