import { z } from 'zod'

export const inventoryAdjustmentSchema = z.object({
  adjustmentDate: z.string().trim().min(1),
  itemType: z.enum(['yarn', 'raw_fabric', 'finished_fabric']),
  referenceId: z.string().uuid().optional().or(z.literal('')),
  adjustmentType: z.enum(['increase', 'decrease', 'correction']),
  quantityDelta: z.number(),
  reason: z.string().trim().min(3),
})

export type InventoryAdjustmentFormValues = z.infer<typeof inventoryAdjustmentSchema>
