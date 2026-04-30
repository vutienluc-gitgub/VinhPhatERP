import { sumBy } from '@/shared/utils/array.util';

export function calculateReservedLengthM(
  rolls: Array<{ length_m?: number | null }> | null | undefined,
): number {
  return sumBy(rolls ?? [], (r) => r.length_m ?? 0);
}

export function calculateReservedWeightKg(
  rolls: Array<{ weight_kg?: number | null }> | null | undefined,
): number {
  return sumBy(rolls ?? [], (r) => r.weight_kg ?? 0);
}
