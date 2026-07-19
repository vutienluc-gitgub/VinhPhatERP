/**
 * Maps roll status (raw / finished fabric) to Badge variant for consistent UI.
 * Extracted to shared utils — used by RawFabricList, FinishedFabricList, and others.
 */
import type { BadgeVariant } from '@/shared/components';
import type { RollStatus } from '@/schema/roll.schema';

const ROLL_STATUS_VARIANT_MAP: Record<RollStatus, BadgeVariant> = {
  in_stock: 'success',
  pending_qc: 'warning',
  reserved: 'info',
  in_process: 'purple',
  shipped: 'gray',
  damaged: 'danger',
  written_off: 'gray',
};

export function getRollStatusVariant(status: RollStatus): BadgeVariant {
  return ROLL_STATUS_VARIANT_MAP[status] ?? 'gray';
}
