import type { FeatureDefinition } from '@/shared/types/feature'

export {
  QUALITY_GRADES,
  ROLL_STATUSES,
  QUALITY_GRADE_LABELS,
  ROLL_STATUS_LABELS,
  formatBulkRollNumber,
  findDuplicateRollNumbers,
  rawFabricSchema,
  rawFabricDefaults,
  bulkRollRowSchema,
  bulkInputSchema,
  bulkInputDefaults,
  generateBarcode,
} from '@/schema/raw-fabric.schema'
export type {
  RawFabricFormValues,
  BulkRollRow,
  BulkInputFormValues,
} from '@/schema/raw-fabric.schema'

export const rawFabricFeature: FeatureDefinition = {
  key: 'raw-fabric',
  route: '/raw-fabric',
  title: 'Nhập vải mộc',
  badge: 'Production',
  description: 'Theo dõi lô vải mộc và mapping với nguyên liệu, nhà dệt.',
  highlights: [
    'Nhập từng cuộn vải mộc từ nhà dệt.',
    'Liên kết lô sợi, nhà dệt và lệnh sản xuất.',
    'Mã vạch Code128 cho mỗi cuộn.',
  ],
  resources: ['raw_fabric_rolls'],
  entities: ['Raw roll', 'Lot', 'Barcode'],
  nextMilestones: ['Scan mã vạch khi nhập kho.'],
}