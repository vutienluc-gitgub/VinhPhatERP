import type { FinishedFabricRoll } from './types';

export function calculateMedian(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function groupRollsByLot(rolls: FinishedFabricRoll[]) {
  const map = new Map<string, FinishedFabricRoll[]>();
  rolls.forEach((roll) => {
    const key = roll.lot_number || 'KHÔNG CÓ LÔ';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(roll);
  });
  return Array.from(map.entries()).map(([lot, items]) => {
    const weights = items
      .map((r) => r.weight_kg)
      .filter((w): w is number => w != null && w > 0);
    return {
      lot,
      rolls: items,
      fabricType: items[0]?.fabric_type,
      colorName: items[0]?.color_name,
      standardWeightKg: calculateMedian(weights),
    };
  });
}
