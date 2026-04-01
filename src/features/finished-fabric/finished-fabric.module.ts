import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

export const finishedFabricSchema = z.object({
  rollNumber: z.string().trim().min(3),
  rawRollId: z.string().uuid().optional().or(z.literal('')),
  fabricType: z.string().trim().min(2),
  colorName: z.string().trim().max(120).optional().or(z.literal('')),
  lengthM: z.number().positive().optional(),
  qualityGrade: z.enum(['A', 'B', 'C']).optional(),
})

export type FinishedFabricFormValues = z.infer<typeof finishedFabricSchema>

export const finishedFabricFeature: FeatureDefinition = {
  key: 'finished-fabric',
  route: '/finished-fabric',
  title: 'Vải thành phẩm',
  badge: 'Scaffolded',
  description:
    'Nhập vải thành phẩm sau xử lý, liên kết lô mộc, nhà nhuộm và inventory thành phẩm khả dụng.',
  highlights: [
    'Mapping từ raw fabric sang finished fabric.',
    'Hỗ trợ qty, lot, màu, kho và status sản xuất.',
    'Sẵn sàng phục vụ order reservation và shipment.',
  ],
  resources: [
    'Bang finished_fabric_rolls.',
    'Update inventory available theo lot.',
    'View phuc vu report san luong va ton kho.',
  ],
  entities: ['Finished roll', 'Color lot', 'Reservation', 'Shipment source'],
  nextMilestones: [
    'Tao inventory cards theo fabric type va color.',
    'Them reserve/unreserve flow theo order.',
    'Kiem tra trace tu raw roll den shipment.',
  ],
}