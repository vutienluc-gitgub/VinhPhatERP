import { z } from 'zod';

/* ── Percent validation primitive ── */

const percentSchema = z
  .number()
  .min(0, 'Phan tram phai >= 0')
  .max(100, 'Phan tram phai <= 100');

/* ── Additional Cost Component (Open/Closed extensibility) ── */

export const additionalCostSchema = z.object({
  /** Unique identifier for the cost component (e.g. 'dyeing', 'finishing') */
  key: z.string().min(1),
  /** Human-readable label */
  label: z.string().min(1),
  /** Cost amount in VND */
  amount: z.number().nonnegative('Chi phi phai >= 0'),
});

export type AdditionalCost = z.infer<typeof additionalCostSchema>;

/* ── Calculation Input ── */

export const calculatePriceInputSchema = z.object({
  /** Weight of fabric in kilograms */
  weightKg: z.number().positive('Khoi luong phai > 0'),
  /** Fabric width in centimeters */
  widthCm: z.number().positive('Kho vai phai > 0'),
  /** Unit price per kilogram (VND/kg) */
  unitPricePerKg: z.number().nonnegative('Don gia phai >= 0'),
  /** Optional processing cost (chi phi gia cong) */
  processingCost: z.number().nonnegative().default(0),
  /** Optional transport cost */
  transportCost: z.number().nonnegative().default(0),
  /** Waste percentage applied on weight (0-100) */
  wastePercent: percentSchema.default(0),
  /** Profit margin percentage applied after total cost (0-100) */
  profitMarginPercent: percentSchema.default(0),
  /** Extensible: additional cost components (dyeing, finishing, etc.) */
  additionalCosts: z.array(additionalCostSchema).default([]),
});

export type CalculatePriceInput = z.input<typeof calculatePriceInputSchema>;

/* ── Calculation Result ── */

export interface CalculatePriceResult {
  /** Base material cost = effectiveWeight * unitPricePerKg */
  baseCost: number;
  /** Waste cost = weight * (wastePercent/100) * unitPricePerKg */
  wasteCost: number;
  /** Effective weight after waste = weightKg * (1 + wastePercent/100) */
  effectiveWeightKg: number;
  /** Sum of processing + transport + additional costs */
  additionalCostTotal: number;
  /** Breakdown of each additional cost component */
  additionalCostBreakdown: AdditionalCost[];
  /** Total cost before profit = baseCost + wasteCost + additionalCostTotal */
  totalCost: number;
  /** Final price after profit margin = totalCost * (1 + profitMarginPercent/100) */
  finalPrice: number;
  /** Price per meter (estimated via width) = finalPrice / estimatedMeters */
  pricePerMeter: number | null;
}
