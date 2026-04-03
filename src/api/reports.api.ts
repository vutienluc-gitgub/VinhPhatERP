import { supabase } from '@/services/supabase/client'

// ---------------------------------------------------------------------------
// Types — match SQL view columns
// ---------------------------------------------------------------------------

export type RevenueRow = {
  id: string
  order_number: string
  customer_name: string
  order_date: string
  delivery_date: string | null
  status: string
  total_amount: number
  paid_amount: number
  balance_due: number
}

export type DebtByCustomerRow = {
  customer_id: string
  customer_name: string
  customer_code: string
  total_orders: number
  total_amount: number
  paid_amount: number
  balance_due: number
}

export type InventoryRow = {
  fabric_type: string
  color_name: string | null
  color_code: string | null
  quality_grade: string | null
  roll_count: number
  total_length_m: number
  total_weight_kg: number
}

export type OverdueOrderRow = {
  order_id: string
  order_number: string
  customer_name: string
  order_date: string
  delivery_date: string
  days_overdue: number
  total_amount: number
  paid_amount: number
  balance_due: number
  status: string
}

export type InventorySummary = {
  raw: InventoryRow[]
  finished: InventoryRow[]
}

// ---------------------------------------------------------------------------
// Filter type used by report queries
// ---------------------------------------------------------------------------

export type ReportsFilter = {
  dateFrom?: string
  dateTo?: string
  customerId?: string
}

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
    .order('order_date', { ascending: false })

  if (filter.dateFrom) query = query.gte('order_date', filter.dateFrom)
  if (filter.dateTo) query = query.lte('order_date', filter.dateTo)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as RevenueRow[]
}

export async function fetchDebtByCustomer(
  filter: ReportsFilter = {},
): Promise<DebtByCustomerRow[]> {
  let query = supabase
    .from('v_debt_by_customer')
    .select('*')
    .order('balance_due', { ascending: false })

  if (filter.customerId) query = query.eq('customer_id', filter.customerId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as DebtByCustomerRow[]
}

export async function fetchInventorySummary(): Promise<InventorySummary> {
  const [rawResult, finishedResult] = await Promise.all([
    supabase
      .from('v_raw_fabric_inventory')
      .select('*')
      .order('fabric_type'),
    supabase
      .from('v_finished_fabric_inventory')
      .select('*')
      .order('fabric_type'),
  ])

  if (rawResult.error) throw rawResult.error
  if (finishedResult.error) throw finishedResult.error

  return {
    raw: (rawResult.data ?? []) as unknown as InventoryRow[],
    finished: (finishedResult.data ?? []) as unknown as InventoryRow[],
  }
}

export async function fetchOverdueOrders(): Promise<OverdueOrderRow[]> {
  const { data, error } = await supabase
    .from('v_overdue_orders')
    .select('*')
    .gt('days_overdue', 0)
    .order('days_overdue', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as OverdueOrderRow[]
}
