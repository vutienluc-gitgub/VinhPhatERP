import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import {
  emptyYarnReceiptItem as emptyItem,
  yarnReceiptsDefaultValues,
  yarnReceiptsSchema,
  DOC_STATUS_LABELS,
} from '@/schema/yarn-receipt.schema';

export {
  emptyItem,
  yarnReceiptsDefaultValues,
  yarnReceiptsSchema,
  DOC_STATUS_LABELS,
};
export type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';

export const yarnReceiptsFeature: FeatureDefinition = {
  key: 'yarn-receipts',
  route: '/yarn-receipts',
  title: 'Nhập kho sợi',
  badge: 'Inbound',
  description:
    'Quy trình nhập kho sợi từ nhà cung cấp, kiểm tra số lượng và lô sản xuất.',
  summary: [
    {
      label: 'Nhập trong tháng',
      value: '125 tấn',
    },
    {
      label: 'Phiếu chờ duyệt',
      value: '3',
    },
  ],
  highlights: [
    'Theo dõi số lô (lot).',
    'In nhãn mã vạch kiện sợi.',
    'Tự động cập nhật công nợ NCC.',
  ],
  entities: ['yarn_receipts', 'yarn_receipt_items', 'inventory_stocks'],
  nextMilestones: ['Tích hợp cân điện tử tự động nhập khối lượng.'],
};

export const yarnReceiptsPlugin: FeaturePlugin = {
  key: 'yarn-receipts',
  route: 'yarn-receipts',
  label: 'Nhập kho Sợi',
  shortLabel: 'Nhập Sợi',
  description: 'Quản lý phiếu nhập kho sợi từ nhà cung cấp về kho nguyên liệu.',
  icon: 'PackageOpen',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 10,
  routes: [
    {
      path: 'yarn-receipts',
      component: () =>
        import('./YarnReceiptsPage').then((m) => ({
          default: m.YarnReceiptsPage,
        })),
    },
  ],
};

export default createModule(yarnReceiptsFeature);
