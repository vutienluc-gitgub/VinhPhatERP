import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import type {
  Supplier,
  SupplierInsert,
  SupplierUpdate,
} from '@/features/procurement/suppliers/types';
import {
  SUPPLIER_STATUSES,
  SUPPLIER_STATUS_LABELS,
  supplierDefaults,
  supplierSchema,
} from '@/schema/supplier.schema';

import { SUPPLIER_LIST_LABELS as MSG } from './suppliers.constants';

export {
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
  title: MSG.MODULE_TITLE,
  badge: 'Core',
  description: MSG.MODULE_DESC,
  summary: [
    {
      label: MSG.KPI_PARTNERS,
      value: '45',
    },
    {
      label: MSG.KPI_CATEGORIES,
      value: '12',
    },
  ],
  highlights: [MSG.HIGHLIGHT_CAT, MSG.HIGHLIGHT_DEBT, MSG.HIGHLIGHT_RATING],
  entities: ['suppliers'],
  nextMilestones: [
    MSG.MILESTONE_PORTAL,
    'Theo doi lead time va do tin cay nha cung cap.',
  ],
};

export const suppliersPlugin: FeaturePlugin = {
  key: 'suppliers',
  route: 'suppliers',
  label: MSG.PLUGIN_LABEL,
  shortLabel: 'NCC',
  description: MSG.PLUGIN_DESC,
  icon: 'Handshake',
  requiredRoles: ['admin', 'manager'],
  group: 'master-data',
  order: 50,
  routes: [
    {
      path: 'suppliers',
      component: () =>
        import('./SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
    },
  ],
};

export default createModule(suppliersFeature);
