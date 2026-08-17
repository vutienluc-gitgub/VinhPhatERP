import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  ConcurrencyConflictError,
  InvalidStateTransitionError,
  RecordNotFoundError,
  TerminalStateError,
} from '@/domain/core/errors/ConcurrencyErrors';
import { ConcurrencyConflictProvider } from '@/shared/contexts/ConcurrencyConflictContext';
import {
  useConcurrencyConflictHandler,
  isConcurrencyConflictError,
} from '@/shared/hooks/useConcurrencyConflictHandler';

describe('useConcurrencyConflictHandler', () => {
  describe('isConcurrencyConflictError', () => {
    it('returns true for ConcurrencyConflictError', () => {
      expect(isConcurrencyConflictError(new ConcurrencyConflictError())).toBe(
        true,
      );
    });

    it('returns true for InvalidStateTransitionError', () => {
      expect(
        isConcurrencyConflictError(
          new InvalidStateTransitionError('draft', 'send'),
        ),
      ).toBe(true);
    });

    it('returns true for TerminalStateError', () => {
      expect(
        isConcurrencyConflictError(new TerminalStateError('completed')),
      ).toBe(true);
    });

    it('returns true for RecordNotFoundError', () => {
      expect(isConcurrencyConflictError(new RecordNotFoundError())).toBe(true);
    });

    it('returns true for Error containing OCC_MISMATCH or concurrency phrases', () => {
      expect(isConcurrencyConflictError(new Error('OCC_MISMATCH: error'))).toBe(
        true,
      );
      expect(
        isConcurrencyConflictError(new Error('Dữ liệu đã bị thay đổi')),
      ).toBe(true);
      expect(
        isConcurrencyConflictError(
          new Error('Bản ghi không ở trạng thái phù hợp'),
        ),
      ).toBe(true);
    });

    it('returns false for generic errors and falsy inputs', () => {
      expect(isConcurrencyConflictError(new Error('Network error'))).toBe(
        false,
      );
      expect(isConcurrencyConflictError(null)).toBe(false);
      expect(isConcurrencyConflictError(undefined)).toBe(false);
    });
  });

  describe('handleConflict', () => {
    const createWrapper = () => {
      const queryClient = new QueryClient();
      return function Wrapper({ children }: PropsWithChildren) {
        return (
          <QueryClientProvider client={queryClient}>
            <ConcurrencyConflictProvider>
              {children}
            </ConcurrencyConflictProvider>
          </QueryClientProvider>
        );
      };
    };

    it('handles ConcurrencyConflictError and returns true', () => {
      const { result } = renderHook(() => useConcurrencyConflictHandler(), {
        wrapper: createWrapper(),
      });

      let handled = false;
      act(() => {
        handled = result.current.handleConflict(new ConcurrencyConflictError());
      });

      expect(handled).toBe(true);
    });

    it('returns false for generic non-concurrency error', () => {
      const { result } = renderHook(() => useConcurrencyConflictHandler(), {
        wrapper: createWrapper(),
      });

      let handled = true;
      act(() => {
        handled = result.current.handleConflict(new Error('Payment failed'));
      });

      expect(handled).toBe(false);
    });

    it('createMutationErrorHandler routes errors appropriately', () => {
      const { result } = renderHook(() => useConcurrencyConflictHandler(), {
        wrapper: createWrapper(),
      });

      const customOnError = vi.fn();
      const handler = result.current.createMutationErrorHandler({
        onError: customOnError,
      });

      // When concurrency error:
      act(() => {
        handler(new ConcurrencyConflictError());
      });
      expect(customOnError).not.toHaveBeenCalled();

      // When generic error:
      const genericError = new Error('Validation failed');
      act(() => {
        handler(genericError);
      });
      expect(customOnError).toHaveBeenCalledWith(genericError);
    });
  });
});
