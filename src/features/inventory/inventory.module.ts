import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

export const inventoryAdjustmentSchema = z.object({
  adjustmentDate: z.string().trim().min(1),
  itemType: z.enum(['yarn', 'raw_fabric', 'finished_fabric']),
  referenceId: z.string().uuid().optional().or(z.literal('')),
  adjustmentType: z.enum(['increase', 'decrease', 'correction']),
  quantityDelta: z.number(),
  reason: z.string().trim().min(3),
})

export type InventoryAdjustmentFormValues = z.infer<typeof inventoryAdjustmentSchema>

export const inventoryFeature: FeatureDefinition = {
  key: 'inventory',
  route: '/inventory',
  title: 'Tồn kho',
  badge: 'Scaffolded',
  description:
    'Inventory tập trung vào movement, available stock và reservations để tránh over-selling.',
  summary: [
    { label: 'Nguồn sự thật', value: 'Movements' },
    { label: 'View mode', value: 'Cards + Table' },
    { label: 'Alerts', value: 'Low stock' },
  ],
  highlights: [
    'Tồn có sẵn và tồn đã giữ chỗ cần hiển thị tách biệt.',
    'Cảnh báo tồn thấp theo item type.',
    'Mobile card list, desktop rich table.',
  ],
  resources: [
    'Bang inventory_adjustments.',
    'View inventory available va ready to ship.',
    'Badge canh bao o navigation sau khi co data that.',
  ],
  entities: ['Stock card', 'Movement', 'Adjustment', 'Reservation'],
  nextMilestones: [
    'Hop nhat ton soi, vai moc va thanh pham.',
    'Tao card canh bao low stock va aging stock.',
    'Bo sung inventory history theo reference item.',
  ],
}