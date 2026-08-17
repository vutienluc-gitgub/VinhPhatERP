import {
  ConcurrencyConflictError,
  InvalidStateTransitionError,
  RecordNotFoundError,
} from '@/domain/core/errors';

export interface MutationContext {
  entityName: string;
  expectedStatus?: string;
  expectedUpdatedAt?: string;
  transitionName?: string;
}

/**
 * Asserts that a single-row mutation succeeded and returns the typed record.
 * Throws a specific DomainError if PostgREST returns PGRST116 (0 rows updated due to OCC or state mismatch).
 */
export function assertSingleMutation<T>(
  data: T | null,
  error: { code?: string; message?: string } | null,
  context: MutationContext,
): T {
  if (error) {
    if (error.code === 'PGRST116') {
      if (context.expectedStatus) {
        throw new InvalidStateTransitionError(
          context.expectedStatus,
          context.transitionName,
        );
      }
      if (context.expectedUpdatedAt) {
        throw new ConcurrencyConflictError();
      }
      throw new RecordNotFoundError(`${context.entityName} không tìm thấy.`);
    }

    if (error.message?.includes('OCC_MISMATCH')) {
      throw new ConcurrencyConflictError();
    }

    throw new Error(error.message || 'Database mutation failed');
  }

  if (!data) {
    throw new RecordNotFoundError(`${context.entityName} không tìm thấy.`);
  }

  return data;
}

/**
 * Asserts that a void mutation (e.g. RPC or update without returning data) succeeded.
 * Maps common RPC error messages into DomainErrors.
 */
export function assertVoidMutation(
  error: { code?: string; message?: string } | null,
  context: MutationContext,
): void {
  if (!error) return;

  if (error.code === 'PGRST116') {
    if (context.expectedStatus) {
      throw new InvalidStateTransitionError(
        context.expectedStatus,
        context.transitionName,
      );
    }
    if (context.expectedUpdatedAt) {
      throw new ConcurrencyConflictError();
    }
    throw new RecordNotFoundError(`${context.entityName} không tìm thấy.`);
  }

  if (error.message?.includes('OCC_MISMATCH')) {
    throw new ConcurrencyConflictError();
  }

  if (
    error.message?.includes('INVALID_STATUS') ||
    error.message?.includes('NOT_DRAFT') ||
    error.message?.includes('NOT_PREPARING') ||
    error.message?.includes('NOT_SHIPPED')
  ) {
    throw new InvalidStateTransitionError(
      context.expectedStatus,
      context.transitionName,
      error.message,
    );
  }

  throw new Error(error.message || 'Database mutation failed');
}
