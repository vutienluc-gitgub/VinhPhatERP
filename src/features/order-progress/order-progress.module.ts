import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import type { OrderProgress, OrderProgressWithOrder } from '@/models';
import {
  PRODUCTION_STAGES,
  STAGE_LABELS,
  STAGE_STATUS_LABELS,
} from '@/schema/order-progress.schema';

export type { OrderProgress, OrderProgressWithOrder };
export { PRODUCTION_STAGES, STAGE_LABELS, STAGE_STATUS_LABELS };

export const orderProgressFeature: FeatureDefinition = {
  key: 'order-progress',
  route: '/order-progress',
  title: 'Theo dõi tiến độ',
  badge: 'Premium',
  description:
    'Bảng theo dõi trạng thái đơn hàng từ Sợi -> Dệt -> Nhuộm -> Kho -> Ship.',
  summary: [
    {
      label: 'Đang sản xuất',
      value: '85',
    },
    {
      label: 'Chậm tiến độ',
      value: '12',
    },
  ],
  highlights: [
    'Visualization Gantt Chart đơn giản.',
    'Thông báo tự động khi trễ stage.',
    'Dashboard tổng quan cho quản lý.',
  ],
  entities: ['order_progress', 'progress_audit_log'],
  nextMilestones: ['Dự báo ngày hoàn thiện dựa trên hiệu suất quá khứ.'],
};

export const orderProgressPlugin: FeaturePlugin = {
  key: 'order-progress',
  route: 'order-progress',
  label: 'Bảng tiến độ',
  shortLabel: 'Tiến độ',
  description: 'Theo dõi quy trình sản xuất các đơn hàng đang triển khai.',
  icon: 'package',
  requiredRoles: ['admin', 'manager'],
  group: 'production',
  order: 90,
  component: () =>
    import('./OrderProgressPage').then((m) => ({
      default: m.OrderProgressPage,
    })),
};

export default createModule(orderProgressFeature);
