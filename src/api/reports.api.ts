import { supabase } from '@/services/supabase/client';

// ---------------------------------------------------------------------------
// Types — match SQL view columns
// ---------------------------------------------------------------------------

export type RevenueRow = {
  id: string;
  order_number: string;
  customer_name: string;
  order_date: string;
  delivery_date: string | null;
  status: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
};

export type DebtByCustomerRow = {
  customer_id: string;
  customer_name: string;
  customer_code: string;
  total_orders: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
};

export type InventoryRow = {
  fabric_type: string;
  color_name: string | null;
  color_code: string | null;
  quality_grade: string | null;
  roll_count: number;
  total_length_m: number;
  total_weight_kg: number;
};

export type OverdueOrderRow = {
  order_id: string;
  order_number: string;
  customer_name: string;
  order_date: string;
  delivery_date: string;
  days_overdue: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
};

export type InventorySummary = {
  raw: InventoryRow[];
  finished: InventoryRow[];
};

// --- Deep analytics types ---

export type DebtAgingRow = {
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  order_date: string;
  delivery_date: string | null;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  days_since_order: number;
  aging_bucket: '0-30' | '31-60' | '61-90' | '90+';
};

export type ProductionEfficiencyRow = {
  order_id: string;
  order_number: string;
  customer_name: string;
  stage: string;
  stage_status: string;
  planned_date: string | null;
  actual_date: string | null;
  deviation_days: number | null;
  is_late: boolean | null;
};

export type RevenueByFabricRow = {
  fabric_type: string;
  color_name: string | null;
  order_count: number;
  total_quantity: number;
  unit: string;
  total_revenue: number;
  avg_unit_price: number;
};

export type MonthlyRevenueRow = {
  month: string;
  order_count: number;
  total_revenue: number;
  total_collected: number;
  total_outstanding: number;
};

export type OnTimeDeliveryRow = {
  order_id: string;
  order_number: string;
  customer_name: string;
  delivery_date: string;
  status: string;
  is_on_time: boolean | null;
};

export type PaymentCollectionRow = {
  month: string;
  payment_method: string;
  payment_count: number;
  total_collected: number;
};

export type InventoryDemandRow = {
  fabric_type: string;
  color_name: string | null;
  demanded_qty: number;
  unit: string;
  available_rolls: number;
  available_length_m: number;
  reserved_rolls: number;
  reserved_length_m: number;
};

// ---------------------------------------------------------------------------
// Filter type used by report queries
// ---------------------------------------------------------------------------

export type ReportsFilter = {
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchRevenueSummary(
  filter: ReportsFilter = {},
): Promise<RevenueRow[]> {
  let query = supabase
    .from('v_order_summary')
    .select('*')
    .in('status', ['confirmed', 'in_progress', 'completed'])
    .order('order_date', { ascending: false });

  if (filter.dateFrom) query = query.gte('order_date', filter.dateFrom);
  if (filter.dateTo) query = query.lte('order_date', filter.dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as RevenueRow[];
}

export async function fetchDebtByCustomer(
  filter: ReportsFilter = {},
): Promise<DebtByCustomerRow[]> {
  let query = supabase
    .from('v_debt_by_customer')
    .select('*')
    .order('balance_due', { ascending: false });

  if (filter.customerId) query = query.eq('customer_id', filter.customerId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as DebtByCustomerRow[];
}

export async function fetchInventorySummary(): Promise<InventorySummary> {
  const [rawResult, finishedResult] = await Promise.all([
    supabase.from('v_raw_fabric_inventory').select('*').order('fabric_type'),
    supabase
      .from('v_finished_fabric_inventory')
      .select('*')
      .order('fabric_type'),
  ]);

  if (rawResult.error) throw rawResult.error;
  if (finishedResult.error) throw finishedResult.error;

  return {
    raw: (rawResult.data ?? []) as unknown as InventoryRow[],
    finished: (finishedResult.data ?? []) as unknown as InventoryRow[],
  };
}

export async function fetchOverdueOrders(): Promise<OverdueOrderRow[]> {
  const { data, error } = await supabase
    .from('v_overdue_orders')
    .select('*')
    .gt('days_overdue', 0)
    .order('days_overdue', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as OverdueOrderRow[];
}

// ---------------------------------------------------------------------------
// Deep analytics API functions
// ---------------------------------------------------------------------------

export async function fetchDebtAging(): Promise<DebtAgingRow[]> {
  const { data, error } = await supabase
    .from('v_debt_aging')
    .select('*')
    .order('days_since_order', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as DebtAgingRow[];
}

export async function fetchProductionEfficiency(): Promise<
  ProductionEfficiencyRow[]
> {
  const { data, error } = await supabase
    .from('v_production_efficiency')
    .select('*')
    .order('order_id');

  if (error) throw error;
  return (data ?? []) as unknown as ProductionEfficiencyRow[];
}

export async function fetchRevenueByFabric(): Promise<RevenueByFabricRow[]> {
  const { data, error } = await supabase
    .from('v_revenue_by_fabric')
    .select('*')
    .order('total_revenue', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as RevenueByFabricRow[];
}

export async function fetchMonthlyRevenue(): Promise<MonthlyRevenueRow[]> {
  const { data, error } = await supabase
    .from('v_monthly_revenue')
    .select('*')
    .order('month', { ascending: false })
    .limit(12);

  if (error) throw error;
  return (data ?? []) as unknown as MonthlyRevenueRow[];
}

export async function fetchOnTimeDelivery(): Promise<OnTimeDeliveryRow[]> {
  const { data, error } = await supabase.from('v_on_time_delivery').select('*');

  if (error) throw error;
  return (data ?? []) as unknown as OnTimeDeliveryRow[];
}

export async function fetchPaymentCollection(): Promise<
  PaymentCollectionRow[]
> {
  const { data, error } = await supabase
    .from('v_payment_collection')
    .select('*')
    .order('month', { ascending: false })
    .limit(24);

  if (error) throw error;
  return (data ?? []) as unknown as PaymentCollectionRow[];
}

export async function fetchInventoryDemand(): Promise<InventoryDemandRow[]> {
  const { data, error } = await supabase
    .from('v_inventory_demand')
    .select('*')
    .order('demanded_qty', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as InventoryDemandRow[];
}
