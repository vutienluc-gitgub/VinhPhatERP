import { describe, it } from 'vitest';
import * as fc from 'fast-check';

import {
  mapOrderStatus,
  mapProductionStage,
  mapStageStatus,
  ORDER_STATUS_LABELS,
  PRODUCTION_STAGE_LABELS,
  STAGE_STATUS_LABELS,
} from '@/features/customer-portal/notifications/notificationMappers';
import type {
  OrderStatus,
  ProductionStage,
  StageStatus,
} from '@/features/customer-portal/notifications/types';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const orderStatuses = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
const productionStages = Object.keys(
  PRODUCTION_STAGE_LABELS,
) as ProductionStage[];
const stageStatuses = Object.keys(STAGE_STATUS_LABELS) as StageStatus[];

const arbitraryOrderStatus = () => fc.constantFrom(...orderStatuses);
const arbitraryProductionStage = () => fc.constantFrom(...productionStages);
const arbitraryStageStatus = () => fc.constantFrom(...stageStatuses);

// ---------------------------------------------------------------------------
// Property 3: Enum mapping trả về nhãn tiếng Việt không rỗng
// ---------------------------------------------------------------------------

describe('notificationMappers — Property 3: enum mapping returns non-empty Vietnamese string', () => {
  it('mapOrderStatus returns non-empty string for all valid statuses', () => {
    fc.assert(
      fc.property(arbitraryOrderStatus(), (status) => {
        const label = mapOrderStatus(status);
        return typeof label === 'string' && label.length > 0;
      }),
      { numRuns: 100 },
    );
  });

  it('mapProductionStage returns non-empty string for all valid stages', () => {
    fc.assert(
      fc.property(arbitraryProductionStage(), (stage) => {
        const label = mapProductionStage(stage);
        return typeof label === 'string' && label.length > 0;
      }),
      { numRuns: 100 },
    );
  });

  it('mapStageStatus returns non-empty string for all valid statuses', () => {
    fc.assert(
      fc.property(arbitraryStageStatus(), (status) => {
        const label = mapStageStatus(status);
        return typeof label === 'string' && label.length > 0;
      }),
      { numRuns: 100 },
    );
  });
});
