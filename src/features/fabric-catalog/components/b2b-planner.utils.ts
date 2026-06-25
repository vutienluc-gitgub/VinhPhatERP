/**
 * b2b-planner.utils.ts
 * Pure calculation functions for B2B Planner
 */

/**
 * Calculates estimated fabric length in meters.
 * formula: length (m) = (weight (kg) * 1000) / ((width (cm) / 100) * GSM)
 */
export function calculateFabricLength(
  weightKg: number,
  gsm: number | null | undefined,
  widthCm: number | null | undefined,
): number | null {
  if (
    !weightKg ||
    weightKg <= 0 ||
    !gsm ||
    gsm <= 0 ||
    !widthCm ||
    widthCm <= 0
  ) {
    return null;
  }
  const length = (weightKg * 1000) / ((widthCm / 100) * gsm);
  return Math.round(length);
}

/**
 * Calculates estimated garment production quantity.
 * formula: quantity = floor(weight (kg) / (avg_consumption_kg * yield_factor))
 */
export function calculateGarmentProduction(
  weightKg: number,
  avgConsumptionKg: number,
  yieldFactor: number = 1.0,
): number {
  if (
    !weightKg ||
    weightKg <= 0 ||
    !avgConsumptionKg ||
    avgConsumptionKg <= 0
  ) {
    return 0;
  }
  const effectiveYieldFactor = yieldFactor > 0 ? yieldFactor : 1.0;
  const quantity = Math.floor(
    weightKg / (avgConsumptionKg * effectiveYieldFactor),
  );
  return quantity;
}
