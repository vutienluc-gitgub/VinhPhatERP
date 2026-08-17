import { InvalidStateTransitionError } from '@/domain/core/errors/ConcurrencyErrors';
import type { FinishedFabricRoll } from '@/domain/inventory/finished-fabric.types';
import { assertSingleMutation } from '@/lib/db-mutation-guard';
import { supabase } from '@/services/supabase/client';

const TABLE = 'finished_fabric_rolls';

type AvailableRollRow = Pick<
  FinishedFabricRoll,
  | 'id'
  | 'roll_number'
  | 'fabric_type'
  | 'color_name'
  | 'length_m'
  | 'weight_kg'
  | 'quality_grade'
  | 'warehouse_location'
>;

export type ReservedRoll = AvailableRollRow & { status: string };

export async function fetchAvailableRolls(
  fabricType: string,
  colorName: string | null,
): Promise<AvailableRollRow[]> {
  let query = supabase
    .from(TABLE)
    .select(
      'id, roll_number, fabric_type, color_name, length_m, weight_kg, quality_grade, warehouse_location',
    )
    .eq('status', 'in_stock')
    .ilike('fabric_type', fabricType)
    .order('roll_number')
    .limit(200);

  if (colorName) {
    query = query.ilike('color_name', colorName);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AvailableRollRow[];
}

export async function fetchReservedRollsForOrder(
  orderId: string,
): Promise<ReservedRoll[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      'id, roll_number, fabric_type, color_name, length_m, weight_kg, quality_grade, warehouse_location, status',
    )
    .eq('reserved_for_order_id', orderId)
    .eq('status', 'reserved')
    .order('roll_number');
  if (error) throw error;
  return (data ?? []) as ReservedRoll[];
}

export async function reserveRoll(
  rollId: string,
  orderId: string,
): Promise<void> {
  const { error } = await supabase.rpc('rpc_reserve_finished_roll', {
    p_roll_id: rollId,
    p_order_id: orderId,
  });

  if (error) {
    if (error.message?.includes('ROLL_ALREADY_RESERVED_OR_UNAVAILABLE')) {
      throw new InvalidStateTransitionError(
        'in_stock',
        'reserve',
        'Cuộn vải này đã bị người khác đặt trước hoặc không còn trong kho. Vui lòng chọn cuộn khác.',
      );
    }
    if (error.message?.includes('ROLL_NOT_FOUND')) {
      throw new Error('Không tìm thấy cuộn vải này.');
    }
    throw error;
  }
}

export async function unreserveRoll(rollId: string): Promise<void> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'in_stock',
      reserved_for_order_id: null,
    })
    .eq('id', rollId)
    .eq('status', 'reserved')
    .select()
    .single();
  assertSingleMutation(data, error, {
    entityName: 'Cuộn vải thành phẩm',
    expectedStatus: 'reserved',
    transitionName: 'hủy giữ chỗ',
  });
}

export async function releaseAllReserved(orderId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: 'in_stock',
      reserved_for_order_id: null,
    })
    .eq('reserved_for_order_id', orderId)
    .eq('status', 'reserved');
  if (error) throw error;
}
