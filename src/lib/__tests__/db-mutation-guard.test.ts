import { describe, expect, it } from 'vitest';

import {
  assertSingleMutation,
  assertVoidMutation,
} from '@/lib/db-mutation-guard';
import {
  ConcurrencyConflictError,
  InvalidStateTransitionError,
  RecordNotFoundError,
} from '@/domain/core/errors';

describe('db-mutation-guard', () => {
  describe('assertSingleMutation', () => {
    it('returns data when mutation succeeds with valid record', () => {
      const mockRecord = { id: 'rec-1', name: 'Test Record' };
      const result = assertSingleMutation(mockRecord, null, {
        entityName: 'Bản ghi',
      });
      expect(result).toEqual(mockRecord);
    });

    it('throws ConcurrencyConflictError when expectedUpdatedAt is provided and PGRST116 occurs', () => {
      expect(() =>
        assertSingleMutation(
          null,
          { code: 'PGRST116' },
          {
            entityName: 'Đơn hàng',
            expectedUpdatedAt: '2026-08-17T00:00:00Z',
          },
        ),
      ).toThrowError(ConcurrencyConflictError);
    });

    it('throws InvalidStateTransitionError when expectedStatus is provided and PGRST116 occurs', () => {
      expect(() =>
        assertSingleMutation(
          null,
          { code: 'PGRST116' },
          {
            entityName: 'Đơn mua hàng',
            expectedStatus: 'pending_approval',
            transitionName: 'phê duyệt',
          },
        ),
      ).toThrowError(InvalidStateTransitionError);
    });

    it('throws RecordNotFoundError when no expected condition was passed and PGRST116 occurs', () => {
      expect(() =>
        assertSingleMutation(
          null,
          { code: 'PGRST116' },
          {
            entityName: 'Khách hàng',
          },
        ),
      ).toThrowError(RecordNotFoundError);
    });

    it('throws ConcurrencyConflictError when RPC message contains OCC_MISMATCH', () => {
      expect(() =>
        assertSingleMutation(
          null,
          { message: 'ERROR: OCC_MISMATCH in update' },
          {
            entityName: 'Lệnh dệt',
          },
        ),
      ).toThrowError(ConcurrencyConflictError);
    });
  });

  describe('assertVoidMutation', () => {
    it('does not throw when error is null', () => {
      expect(() =>
        assertVoidMutation(null, { entityName: 'Lệnh nhuộm' }),
      ).not.toThrow();
    });

    it('throws InvalidStateTransitionError when message contains INVALID_STATUS', () => {
      expect(() =>
        assertVoidMutation(
          { message: 'DYEING_ORDER_INVALID_STATUS' },
          {
            entityName: 'Lệnh nhuộm',
            expectedStatus: 'sent',
            transitionName: 'hoàn thành',
          },
        ),
      ).toThrowError(InvalidStateTransitionError);
    });
  });
});
