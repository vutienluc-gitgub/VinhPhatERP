import type { FeatureDefinition } from '@/shared/types/feature'

export {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_ICONS,
  DISCOUNT_TYPE_OPTIONS,
  VAT_RATE_OPTIONS,
  UNIT_OPTIONS,
  quotationItemSchema,
  quotationsSchema,
  emptyQuotationItem,
  quotationsDefaultValues,
  calculateQuotationTotals,
} from '@/schema/quotation.schema'
export type {
  QuotationStatus,
  DiscountType,
  UnitType,
  QuotationItemFormValues,
  QuotationsFormValues,
} from '@/schema/quotation.schema'

export const quotationsFeature: FeatureDefinition = {
  key: 'quotations',
  route: '/quotations',
  title: 'Báo giá',
  badge: 'New',
  description: 'Quản lý báo giá khách hàng với VAT, chiết khấu, revision và chuyển đổi sang đơn hàng.',
  summary: [
    { label: 'Status set', value: '6' },
    { label: 'VAT', value: 'Có' },
    { label: 'Chiết khấu', value: 'Có' },
  ],
  highlights: [
    'Tạo báo giá với nhiều dòng hàng, VAT và chiết khấu.',
    'Theo dõi revision khi khách yêu cầu sửa đổi.',
    'Chuyển đổi báo giá đã duyệt thành đơn hàng 1 click.',
    'Cảnh báo báo giá sắp/đã hết hiệu lực.',
  ],
  resources: [
    'Bảng quotations và quotation_items.',
    'UI list, detail, form, print.',
    'Hook chuyển đổi sang đơn hàng.',
  ],
  entities: ['Quotation header', 'Quotation item', 'Revision', 'Conversion'],
  nextMilestones: [
    'Bản in PDF báo giá.',
    'Gửi báo giá qua email/Zalo.',
    'Báo cáo tỷ lệ chuyển đổi.',
  ],
}
