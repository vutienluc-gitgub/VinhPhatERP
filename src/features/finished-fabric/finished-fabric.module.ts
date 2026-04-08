import type { FeatureDefinition } from '@/shared/types/feature';

export {
  QUALITY_GRADES,
  ROLL_STATUSES,
  QUALITY_GRADE_LABELS,
  ROLL_STATUS_LABELS,
  formatBulkRollNumber,
  findDuplicateRollNumbers,
  finishedFabricSchema,
  finishedFabricDefaults,
  bulkFinishedRollRowSchema,
  bulkFinishedInputSchema,
  bulkFinishedInputDefaults,
} from '@/schema/finished-fabric.schema';
export type {
  FinishedFabricFormValues,
  BulkFinishedRollRow,
  BulkFinishedInputFormValues,
} from '@/schema/finished-fabric.schema';

export const finishedFabricFeature: FeatureDefinition = {
  key: 'finished-fabric',
  route: '/finished-fabric',
  title: 'Vải thành phẩm',
  badge: 'Beta',
  description:
    'Nhập cuộn vải thành phẩm sau xử lý, liên kết cuộn mộc nguồn, quản lý tồn kho theo trạng thái và phục vụ xuất hàng.',
  highlights: [
    'Nhập từng cuộn thành phẩm với đầy đủ thông số.',
    'Liên kết cuộn mộc nguồn để truy vết chất lượng.',
    'Quản lý trạng thái: trong kho, đã đặt, đã xuất.',
  ],
  resources: [
    'Bảng finished_fabric_rolls.',
    'View v_finished_fabric_inventory.',
    'Nguồn hàng cho module Shipments.',
  ],
  entities: ['Finished roll', 'Reservation', 'Shipment source'],
  nextMilestones: [
    'Reserve/unreserve flow theo đơn hàng.',
    'Inventory cards theo loại vải và màu.',
    'Trace từ raw roll sang shipment.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const finishedFabricPlugin: FeaturePlugin = {
  key: 'finished-fabric',
  route: 'finished-fabric',
  label: 'Vải thành phẩm',
  shortLabel: 'Finished',
  description: 'Nhập thành phẩm và cập nhật sản lượng đã xử lý.',
  icon: 'check-square',
  group: 'production',
  order: 60,
  component: () =>
    import('./index').then((m) => ({ default: m.FinishedFabricPage })),
};
