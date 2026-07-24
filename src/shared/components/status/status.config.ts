import { purchaseOrderStatus } from '@/features/procurement/purchase-orders/po.status';
import { contractStatus } from '@/features/contracts/contracts.status';
import { yarnCatalogStatus } from '@/features/yarn-catalog/yarn.status';
import { workOrderStatus } from '@/features/work-orders/work-orders.status';
import { rfqQuoteStatus } from '@/features/procurement/rfqs/rfqs.status';
import { yarnReceiptStatus } from '@/features/yarn-receipts/yarn-receipts.status';
import { activeStatus } from '@/features/looms/loom.status';
import {
  fabricSampleStatus,
  fabricStockStatus,
} from '@/features/fabric-catalog/fabric-catalog.status';

import type { StatusConfig } from './status.tokens';

export const STATUS_REGISTRY = {
  PO: purchaseOrderStatus,
  CONTRACT: contractStatus,
  YARN: yarnCatalogStatus,
  WORK_ORDER: workOrderStatus,
  RFQ_QUOTE: rfqQuoteStatus,
  YARN_RECEIPT: yarnReceiptStatus,
  ACTIVE_STATUS: activeStatus,
  FABRIC_SAMPLE: fabricSampleStatus,
  FABRIC_STOCK: fabricStockStatus,
} as const;

export type StatusDomain = keyof typeof STATUS_REGISTRY;

export function getStatusConfig(
  domain: StatusDomain,
  status: string | number | boolean,
): StatusConfig | undefined {
  const domainConfig = STATUS_REGISTRY[domain] as Record<string, StatusConfig>;
  return domainConfig[String(status)];
}
