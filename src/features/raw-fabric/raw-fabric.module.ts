import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const rawFabricFeature: FeatureDefinition = {
  key: 'raw-fabric',
  route: '/raw-fabric',
  title: 'Kho Vải mộc',
  badge: 'Storage',
  description:
    'Quản lý vải mộc sau khi dệt xong, chờ gửi đi nhuộm hoặc xả kho bán mộc.',
  summary: [
    {
      label: 'Tổng cây vải',
      value: '4.2k',
    },
    {
      label: 'Đang đi nhuộm',
      value: '1.1k',
    },
  ],
  highlights: [
    'Kiểm soát QR Code từng cây vải.',
    'Theo dõi hao hụt dệt.',
    'Quản lý vị trí lưu kho.',
  ],
  entities: ['raw_fabric_rolls', 'warehouse_locations'],
  nextMilestones: [
    'Cảnh báo tồn kho vải mộc quá lâu.',
    'Tối ưu hoá sơ đồ kho vải mộc.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const rawFabricPlugin: FeaturePlugin = {
  key: 'raw-fabric',
  route: 'raw-fabric',
  label: 'Kho Vải mộc',
  shortLabel: 'Mộc',
  description: 'Quản lý vải mộc từ lệnh dệt về kho và xuất đi nhuộm.',
  icon: 'layers',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'inventory',
  order: 25,
  component: () =>
    import('./RawFabricPage').then((m) => ({ default: m.RawFabricPage })),
};

export default createModule(rawFabricFeature);
