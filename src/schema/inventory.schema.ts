import { z } from 'zod';

export const inventoryAdjustmentSchema = z.object({
  adjustmentDate: z.string().trim().min(1),
  itemType: z.enum(['yarn', 'raw_fabric', 'finished_fabric']),
  referenceId: z.string().uuid(),
  adjustmentType: z.enum([
    'PHYSICAL_COUNT',
    'DAMAGE',
    'QUALITY_REJECTION',
    'SAMPLE_USAGE',
    'PRODUCTION_CONSUMPTION',
    'SYSTEM_CORRECTION',
  ]),
  mode: z.enum(['quick', 'physical']),
  systemQty: z.number().optional(),
  actualQty: z.number().optional(),
  adjustmentQty: z.number(),
  reason: z.string().trim().min(3),
  notes: z.string().optional(),
});

export type InventoryAdjustmentFormValues = z.infer<
  typeof inventoryAdjustmentSchema
>;
