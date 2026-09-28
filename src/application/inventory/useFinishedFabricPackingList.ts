import { useQuery } from '@tanstack/react-query';

import { fetchFinishedFabricAll } from '@/api/finished-fabric.api';
import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import type {
  FinishedFabricFilter,
  FinishedFabricRoll,
} from '@/domain/inventory/finished-fabric.types';

/**
 * Maps a finished fabric roll row to the roll shape consumed by the
 * Fabric Roll Packing List (Bảng kê danh sách cây vải).
 */
export function mapRollToPackingItem(
  roll: FinishedFabricRoll,
  index: number,
): FabricRollPackingItem {
  return {
    id: roll.id,
    roll_code: roll.roll_number,
    roll_sequence: index + 1,
    weight_kg: roll.weight_kg ?? 0,
    fabric_type: roll.fabric_type,
    color_name: roll.color_name ?? undefined,
    color_code: roll.color_code,
    lot_number: roll.lot_number,
    width_inch: roll.width_cm != null ? roll.width_cm / 2.54 : null,
    length_meters: roll.length_m,
    grade: roll.quality_grade ?? undefined,
    status: roll.status,
    notes: roll.notes,
  };
}

export function useFinishedFabricPackingList(
  filters: FinishedFabricFilter = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ['finished-fabric', 'packing-list', filters],
    enabled,
    queryFn: async (): Promise<FabricRollPackingItem[]> => {
      const rolls = await fetchFinishedFabricAll(filters);
      return rolls.map(mapRollToPackingItem);
    },
  });
}
