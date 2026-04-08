import type { FeatureDefinition } from '@/shared/types/feature';

export {
  DOC_STATUSES,
  DOC_STATUS_LABELS,
  yarnReceiptItemSchema,
  yarnReceiptsSchema,
  emptyYarnReceiptItem,
  yarnReceiptsDefaultValues,
} from '@/schema/yarn-receipt.schema';
export type {
  DocStatus,
  YarnReceiptItemFormValues,
  YarnReceiptsFormValues,
} from '@/schema/yarn-receipt.schema';

// Legacy compat alias
export { emptyYarnReceiptItem as emptyItem } from '@/schema/yarn-receipt.schema';

export const yarnReceiptsFeature: FeatureDefinition = {
  key: 'yarn-receipts',
  route: '/yarn-receipts',
  title: 'Nhập sợi',
  badge: 'Active',
  description:
    'Module đầu chuỗi nghiệp vụ — ghi nhận phiếu nhập sợi từ nhà cung cấp.',
  summary: [
    {
      label: 'Loại chứng từ',
      value: 'Receipt',
    },
    {
      label: 'Mobile form',
      value: '1 flow',
    },
    {
      label: 'Offline draft',
      value: 'Planned',
    },
  ],
  highlights: [
    'Form mobile-first, nhập nhanh số lượng và đơn giá.',
    'Line items cho từng lô sợi.',
    'Sinh movement in cho kho nguyên liệu.',
  ],
  resources: [
    'Bảng yarn_receipts và yarn_receipt_items.',
    'Validation số lượng, giá và nhà cung cấp.',
    'Autosave draft và retry khi offline.',
  ],
  entities: [
    'Receipt header',
    'Receipt item',
    'Supplier',
    'Inventory movement',
  ],
  nextMilestones: [
    'Tạo receipt list theo ngày và supplier.',
    'Thêm line item repeater với totals realtime.',
    'Ghi inventory movement sau khi confirm.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const yarnReceiptsPlugin: FeaturePlugin = {
  key: 'yarn-receipts',
  route: 'yarn-receipts',
  label: 'Nhập sợi',
  shortLabel: 'Yarn',
  description: 'Nhập nguyên liệu sợi và tạo phiếu nhập kho.',
  icon: 'package-plus',
  group: 'production',
  order: 40,
  component: () =>
    import('./index').then((m) => ({ default: m.YarnReceiptsPage })),
};
