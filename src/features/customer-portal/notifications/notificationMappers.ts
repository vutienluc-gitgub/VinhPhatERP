import {
  ORDER_STATUS_LABELS,
  PRODUCTION_STAGE_LABELS,
  STAGE_STATUS_LABELS,
  QUOTATION_STATUS_LABELS,
} from '@/features/customer-portal/constants';

import type {
  OrderStatus,
  ProductionStage,
  StageStatus,
  QuotationStatus,
} from './types';

export {
  ORDER_STATUS_LABELS,
  PRODUCTION_STAGE_LABELS,
  STAGE_STATUS_LABELS,
  QUOTATION_STATUS_LABELS,
};

export function mapOrderStatus(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function mapProductionStage(stage: ProductionStage): string {
  return PRODUCTION_STAGE_LABELS[stage] ?? stage;
}

export function mapStageStatus(status: StageStatus): string {
  return STAGE_STATUS_LABELS[status] ?? status;
}

export function mapQuotationStatus(status: QuotationStatus): string {
  return QUOTATION_STATUS_LABELS[status] ?? status;
}
