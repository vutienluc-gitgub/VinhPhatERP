/**
 * Yarn Reservation API
 *
 * Quản lý soft-lock nguyên liệu:
 * - Kiểm tra tồn kho khả dụng
 * - Reserve sợi khi WO xuất sợi
 * - Release khi WO bị hủy
 * - Consume khi WO hoàn thành
 */
import { supabase } from '@/services/supabase/client';

export interface YarnAvailability {
  id: string;
  code: string;
  name: string;
  color_name: string | null;
  unit: string;
  total_stock_qty: number;
  reserved_qty: number;
  available_qty: number;
}

export interface ReserveYarnItem {
  yarn_catalog_id: string;
  reserved_kg: number;
}

export interface ReserveYarnResult {
  ok: boolean;
  reason?: string;
}

/**
 * Lấy danh sách tồn kho khả dụng cho tất cả loại sợi.
 */
export async function fetchYarnAvailability(): Promise<YarnAvailability[]> {
  const { data, error } = await supabase
    .from('v_yarn_availability')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;
  return (data ?? []) as YarnAvailability[];
}

/**
 * Lấy tồn kho khả dụng cho 1 loại sợi cụ thể.
 */
export async function fetchYarnAvailabilityById(
  yarnCatalogId: string,
): Promise<YarnAvailability | null> {
  const { data, error } = await supabase
    .from('v_yarn_availability')
    .select('*')
    .eq('id', yarnCatalogId)
    .maybeSingle();

  if (error) throw error;
  return data as YarnAvailability | null;
}

/**
 * Reserve sợi cho Work Order (atomic).
 * Trả về { ok: true } hoặc { ok: false, reason: '...' }.
 */
export async function reserveYarn(
  workOrderId: string,
  items: ReserveYarnItem[],
): Promise<ReserveYarnResult> {
  const { data, error } = await supabase.rpc('rpc_reserve_yarn', {
    p_work_order_id: workOrderId,
    p_items: items as never,
  });

  if (error) throw error;

  const result = data as unknown as ReserveYarnResult;
  return result;
}

/**
 * Giải phóng reservation khi WO bị hủy.
 */
export async function releaseYarnReservation(
  workOrderId: string,
): Promise<void> {
  const { error } = await supabase.rpc('rpc_release_yarn_reservation', {
    p_work_order_id: workOrderId,
  });
  if (error) throw error;
}

/**
 * Chuyển reservation sang consumed khi WO hoàn thành.
 */
export async function consumeYarnReservation(
  workOrderId: string,
): Promise<void> {
  const { error } = await supabase.rpc('rpc_consume_yarn_reservation', {
    p_work_order_id: workOrderId,
  });
  if (error) throw error;
}
