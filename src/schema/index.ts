// ── Centralized Schema Registry ──
// All Zod schemas and form types are accessible from @/schema
//
// NOTE: Some schema files share export names (QUALITY_GRADES, ROLL_STATUSES, etc.)
// When importing from @/schema, use specific file imports for those:
//   import { QUALITY_GRADES } from '@/schema/raw-fabric.schema'
//   import { QUALITY_GRADES } from '@/schema/finished-fabric.schema'
//
// For unique exports, import from @/schema directly:
//   import { authSchema, quotationsSchema } from '@/schema'

// ── Standalone schemas (no name conflicts) ──
export * from './company-settings.schema';
export * from './customer.schema';
export * from './order.schema';
export * from './product.schema';
export * from './shipping-rate.schema';
export * from './auth.schema';
export * from './bom.schema';
export * from './fabric-catalog.schema';
export * from './inventory.schema';
export * from './order-progress.schema';
export * from './payment.schema';
export * from './debt.schema';
export * from './dyeing-order.schema';
export * from './employee.schema';
export {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_ICONS,
  DISCOUNT_TYPE_OPTIONS,
  VAT_RATE_OPTIONS,
  quotationItemSchema,
  quotationsSchema,
  emptyQuotationItem,
  quotationsDefaultValues,
  calculateQuotationTotals,
} from './quotation.schema';
export type {
  QuotationStatus,
  DiscountType,
  QuotationItemFormValues,
  QuotationsFormValues,
} from './quotation.schema';
export * from './report.schema';
export * from './supplier.schema';
export * from './work-order.schema';
export * from './yarn-catalog.schema';
export * from './yarn-receipt.schema';

// ── Schemas with shared export names ──
// These are NOT re-exported via barrel to avoid name collisions.
// Import directly from the specific schema file instead:
//   @/schema/raw-fabric.schema
//   @/schema/finished-fabric.schema
//   @/schema/weaving-invoice.schema
//   @/schema/shipment.schema
//
// Selectively export unique items from these files:

export {
  rawFabricSchema,
  rawFabricDefaults,
  bulkRollRowSchema,
  bulkInputSchema,
  bulkInputDefaults,
  generateBarcode,
} from './raw-fabric.schema';
export type {
  RawFabricFormValues,
  BulkRollRow,
  BulkInputFormValues,
} from './raw-fabric.schema';

export {
  finishedFabricSchema,
  finishedFabricDefaults,
  bulkFinishedRollRowSchema,
  bulkFinishedInputSchema,
  bulkFinishedInputDefaults,
} from './finished-fabric.schema';
export type {
  FinishedFabricFormValues,
  BulkFinishedRollRow,
  BulkFinishedInputFormValues,
} from './finished-fabric.schema';

export {
  weavingRollSchema,
  weavingInvoiceHeaderSchema,
  weavingInvoiceFormSchema,
  weavingInvoiceDefaults,
  WEAVING_STATUS_LABELS,
} from './weaving-invoice.schema';
export type {
  WeavingRollFormValues,
  WeavingInvoiceHeaderFormValues,
  WeavingInvoiceFormValues,
} from './weaving-invoice.schema';

export {
  shipmentsSchema,
  shipmentsDefaultValues,
  emptyShipmentItem,
  deliveryConfirmSchema,
  deliveryConfirmDefaultValues,
  SHIPMENT_STATUS_LABELS,
} from './shipment.schema';
export type {
  ShipmentStatus,
  ShipmentItemFormValues,
  ShipmentsFormValues,
  DeliveryConfirmFormValues,
} from './shipment.schema';

export { CreateShipmentFromFinishedSchema } from './shipments.schema';
export type { CreateShipmentFromFinishedInput } from './shipments.schema';
