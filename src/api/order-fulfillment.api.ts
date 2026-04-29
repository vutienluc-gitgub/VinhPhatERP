/**
 * Order Fulfillment API
 *
 * Đọc dữ liệu từ v_order_fulfillment view để tổng hợp
 * tỉ lệ hoàn thành đơn hàng.
 */
import { untypedDb } from '@/services/supabase/untyped';

export interface OrderFulfillment {
  order_id: string;
  order_number: string;
  order_status: string;
  order_date: string | null;
  delivery_date: string | null;
  customer_name: string | null;
  total_ordered_qty: number;
  total_amount: number;
  wo_count: number;
  wo_completed: number;
  total_target_m: number;
  total_produced_m: number;
  fulfillment_pct: number;
  total_stages: number;
  completed_stages: number;
  is_overdue: boolean;
}

export interface FulfillmentSummary {
  totalOrders: number;
  fulfilledOrders: number;
  overdueOrders: number;
  avgFulfillmentPct: number;
  totalProducedM: number;
  totalTargetM: number;
}

export async function fetchOrderFulfillment(): Promise<{
  data: OrderFulfillment[];
  summary: FulfillmentSummary;
}> {
  const { data, error } = await untypedDb
    .from('v_order_fulfillment')
    .select('*')
    .order('order_date', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as OrderFulfillment[];

  const summary: FulfillmentSummary = {
    totalOrders: rows.length,
    fulfilledOrders: rows.filter((r) => r.fulfillment_pct >= 100).length,
    overdueOrders: rows.filter((r) => r.is_overdue).length,
    avgFulfillmentPct:
      rows.length > 0
        ? Math.round(
            rows.reduce((sum, r) => sum + r.fulfillment_pct, 0) / rows.length,
          )
        : 0,
    totalProducedM: rows.reduce((sum, r) => sum + r.total_produced_m, 0),
    totalTargetM: rows.reduce((sum, r) => sum + r.total_target_m, 0),
  };

  return { data: rows, summary };
}
