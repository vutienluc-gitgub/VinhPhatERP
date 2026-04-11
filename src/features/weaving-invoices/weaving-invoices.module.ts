import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export {
  WEAVING_STATUS_LABELS,
  QUALITY_GRADES,
  QUALITY_GRADE_LABELS,
  weavingRollSchema,
  weavingInvoiceHeaderSchema,
  weavingInvoiceFormSchema,
  weavingInvoiceDefaults,
} from '@/schema/weaving-invoice.schema';
export type {
  WeavingRollFormValues,
  WeavingInvoiceHeaderFormValues,
  WeavingInvoiceFormValues,
} from '@/schema/weaving-invoice.schema';

export const weavingInvoicesPlugin: FeaturePlugin = {
  key: 'weaving-invoices',
  route: 'weaving-invoices',
  label: 'Phiếu gia công',
  shortLabel: 'Gia công',
  description:
    'Quản lý phiếu gia công dệt theo lô — tính công nợ nhà dệt tự động.',
  icon: 'Receipt',
  group: 'production',
  order: 57,
  component: () =>
    import('./index').then((m) => ({ default: m.WeavingInvoicesPage })),
};
