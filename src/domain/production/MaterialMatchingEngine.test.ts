import { describe, it, expect } from 'vitest';

import {
  evaluateMaterialMatching,
  isMaterialMatching,
  type IncomingMaterialSpec,
  type WorkOrderDemand,
} from './MaterialMatchingEngine';

describe('MaterialMatchingEngine', () => {
  describe('isMaterialMatching', () => {
    it('should match identical fabricType and color', () => {
      const incoming: IncomingMaterialSpec = {
        fabricType: 'Single Jersey',
        color: 'Black',
        quantityKg: 500,
      };
      const demand: WorkOrderDemand = {
        workOrderId: 'wo-1',
        workOrderNumber: 'WO-001',
        fabricType: 'Single Jersey',
        color: 'Black',
        targetQuantityKg: 300,
        allocatedKg: 0,
        missingKg: 300,
      };

      expect(isMaterialMatching(incoming, demand)).toBe(true);
    });

    it('should reject mismatched color', () => {
      const incoming: IncomingMaterialSpec = {
        fabricType: 'Single Jersey',
        color: 'Black',
        quantityKg: 500,
      };
      const demand: WorkOrderDemand = {
        workOrderId: 'wo-2',
        workOrderNumber: 'WO-002',
        fabricType: 'Single Jersey',
        color: 'White',
        targetQuantityKg: 300,
        allocatedKg: 0,
        missingKg: 300,
      };

      expect(isMaterialMatching(incoming, demand)).toBe(false);
    });
  });

  describe('evaluateMaterialMatching', () => {
    it('should allocate materials FIFO and determine ready vs partial status', () => {
      const incoming: IncomingMaterialSpec = {
        fabricType: 'Single Jersey',
        color: 'Black',
        quantityKg: 500,
      };

      const demands: WorkOrderDemand[] = [
        {
          workOrderId: 'wo-1',
          workOrderNumber: 'WO-001',
          fabricType: 'Single Jersey',
          color: 'Black',
          targetQuantityKg: 300,
          allocatedKg: 0,
          missingKg: 300,
        },
        {
          workOrderId: 'wo-2',
          workOrderNumber: 'WO-002',
          fabricType: 'Single Jersey',
          color: 'Black',
          targetQuantityKg: 400,
          allocatedKg: 0,
          missingKg: 400,
        },
      ];

      const result = evaluateMaterialMatching(incoming, demands);

      expect(result.incomingKg).toBe(500);
      expect(result.totalAllocatedFromBatchKg).toBe(500);
      expect(result.remainingUnallocatedKg).toBe(0);
      expect(result.readyWorkOrderCount).toBe(1);
      expect(result.partialWorkOrderCount).toBe(1);
      expect(result.matchedWorkOrders).toHaveLength(2);

      const firstMatch = result.matchedWorkOrders[0]!;
      const secondMatch = result.matchedWorkOrders[1]!;

      // WO-1 should be fully allocated (300kg) -> ready_to_start
      expect(firstMatch.workOrderId).toBe('wo-1');
      expect(firstMatch.matchStatus).toBe('ready_to_start');
      expect(firstMatch.matchedKg).toBe(300);
      expect(firstMatch.stillMissingKg).toBe(0);

      // WO-2 should receive remaining 200kg -> partially_available (still missing 200kg)
      expect(secondMatch.workOrderId).toBe('wo-2');
      expect(secondMatch.matchStatus).toBe('partially_available');
      expect(secondMatch.matchedKg).toBe(200);
      expect(secondMatch.stillMissingKg).toBe(200);
    });
  });
});
