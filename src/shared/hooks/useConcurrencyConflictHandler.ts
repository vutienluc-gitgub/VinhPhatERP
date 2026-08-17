import { useCallback } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  useConcurrencyConflict,
  type ConcurrencyConflictOptions,
} from '@/shared/contexts/ConcurrencyConflictContext';
import {
  ConcurrencyConflictError,
  InvalidStateTransitionError,
  TerminalStateError,
  RecordNotFoundError,
} from '@/domain/core/errors/ConcurrencyErrors';

/**
 * Checks if an unknown error is related to OCC concurrency conflicts or state transition errors.
 */
export function isConcurrencyConflictError(error: unknown): boolean {
  if (!error) return false;

  if (
    error instanceof ConcurrencyConflictError ||
    error instanceof InvalidStateTransitionError ||
    error instanceof TerminalStateError ||
    error instanceof RecordNotFoundError
  ) {
    return true;
  }

  if (error instanceof Error) {
    const msg = error.message;
    return (
      msg.includes('OCC_MISMATCH') ||
      msg.includes('Dữ liệu đã bị thay đổi') ||
      msg.includes('INVALID_STATE') ||
      msg.includes('không ở trạng thái') ||
      msg.includes('Trạng thái không hợp lệ')
    );
  }

  return false;
}

export interface ConcurrencyHandlerOptions {
  queryKeys?: QueryKey[];
  onReload?: () => void | Promise<void>;
  fallbackToast?: boolean;
  errorMessagePrefix?: string;
}

export function useConcurrencyConflictHandler() {
  const { showConflictModal, hideConflictModal } = useConcurrencyConflict();

  /**
   * Handles an error: opens conflict modal if it's a concurrency error, or optionally triggers a toast.
   * Returns true if handled as concurrency error, false otherwise.
   */
  const handleConflict = useCallback(
    (error: unknown, options: ConcurrencyHandlerOptions = {}): boolean => {
      if (isConcurrencyConflictError(error)) {
        const modalOpts: ConcurrencyConflictOptions = {
          error,
          queryKeys: options.queryKeys,
          onReload: options.onReload,
        };
        showConflictModal(modalOpts);
        return true;
      }

      if (options.fallbackToast && error) {
        const message = error instanceof Error ? error.message : String(error);
        const fullMessage = options.errorMessagePrefix
          ? `${options.errorMessagePrefix}: ${message}`
          : message;
        toast.error(fullMessage);
      }

      return false;
    },
    [showConflictModal],
  );

  /**
   * Helper to create an onError callback for useMutation.
   */
  const createMutationErrorHandler = useCallback(
    (
      options: ConcurrencyHandlerOptions & {
        onError?: (err: Error) => void;
      } = {},
    ) => {
      return (error: unknown) => {
        const isConflict = handleConflict(error, options);
        if (!isConflict && options.onError && error instanceof Error) {
          options.onError(error);
        }
      };
    },
    [handleConflict],
  );

  return {
    handleConflict,
    createMutationErrorHandler,
    showConflictModal,
    hideConflictModal,
    isConcurrencyConflictError,
  };
}
