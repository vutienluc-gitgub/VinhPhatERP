/**
 * Sync Subsystem -- Public API
 *
 * All integration sync functionality is exported from here.
 */

export { generateDeterministicSyncId } from './sync-id';

export {
  handleShipmentSyncOutbound,
  handleOrderSyncOutbound,
  calculateNextRetry,
} from './sync-outbox.service';

export {
  REPORT_SHEET_COLUMNS,
  IMPORT_SHEET_COLUMNS,
  IMPORT_VALIDATION_MESSAGES,
  SHEET_TAB_NAMES,
  type ImportRowStatus,
  type SyncJobStatus,
  type SyncDirection,
  type SyncProvider,
  type SyncEntityType,
} from './sheet-types';

export { mapShipmentToSheetRow } from './sheet-mappers/shipment.mapper';
export type { ShipmentSyncPayload } from './sheet-mappers/shipment.mapper';

export { mapOrderToSheetRow } from './sheet-mappers/order.mapper';
export type { OrderSyncPayload } from './sheet-mappers/order.mapper';

export {
  parseShipmentImportRow,
  type RawShipmentImportRow,
  type ValidatedShipmentImport,
  type ShipmentImportResult,
} from './sheet-mappers/shipment-import.mapper';

export {
  parseOrderImportRow,
  type RawOrderImportRow,
  type ValidatedOrderImport,
  type OrderImportResult,
} from './sheet-mappers/order-import.mapper';

export {
  processOrderImports,
  processShipmentImports,
  type InboundImportSummary,
} from './sync-inbound.service';

export {
  reconcileShipments,
  reconcileOrders,
  executeFullReconciliation,
  type ReconciliationReport,
  type EntityReconciliationSummary,
} from './reconciliation.service';
