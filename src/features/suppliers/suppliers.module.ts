import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import type { Supplier, SupplierInsert, SupplierUpdate } from '@/models';
import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_STATUSES,
  SUPPLIER_STATUS_LABELS,
  supplierDefaults,
  supplierSchema,
} from '@/schema/supplier.schema';

export {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_STATUSES,
  SUPPLIER_STATUS_LABELS,
  supplierDefaults,
  supplierSchema,
};
export type { Supplier, SupplierInsert, SupplierUpdate };
export type { SupplierFormValues } from '@/schema/supplier.schema';

export const suppliersFeature: FeatureDefinition = {
  key: 'suppliers',
  route: '/suppliers',
  title: 'Nhà cung cấp',
  badge: 'Core',
  description:
    'Quản lý thông tin đối tác cung ứng, phân loại nhóm hàng và đánh giá chất lượng.',
  summary: [
    {
      label: 'Tổng đối tác',
      value: '45',
    },
    {
      label: 'Nhóm vật tư',
      value: '12',
    },
  ],
  highlights: [
    'Phân loại NCC Sợi/Hóa chất/Phụ kiện.',
    'Quản lý công nợ NCC tập trung.',
    'Theo dõi đánh giá định kỳ.',
  ],
  entities: ['suppliers'],
  nextMilestones: [
    'Tích hợp portal cho NCC.',
    'Theo doi lead time va do tin cay nha cung cap.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const suppliersPlugin: FeaturePlugin = {
  key: 'suppliers',
  route: 'suppliers',
  label: 'Nhà cung cấp',
  shortLabel: 'NCC',
  description: 'Tra cứu và quản lý danh sách nhà cung cấp, đối tác gia công.',
  icon: 'users',
  requiredRoles: ['admin', 'manager'],
  group: 'master-data',
  order: 50,
  component: () =>
    import('./SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
};

export default createModule(suppliersFeature);
