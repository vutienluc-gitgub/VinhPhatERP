/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import {
  ConcurrencyConflictModal,
  type ConcurrencyErrorType,
} from '@/shared/components/ConcurrencyConflictModal';
import {
  ConcurrencyConflictError,
  InvalidStateTransitionError,
  RecordNotFoundError,
  TerminalStateError,
} from '@/domain/core/errors/ConcurrencyErrors';

export interface ConcurrencyConflictOptions {
  error?: unknown;
  title?: string;
  message?: string;
  errorType?: ConcurrencyErrorType;
  onReload?: () => void | Promise<void>;
  queryKeys?: QueryKey[];
}

export interface ConcurrencyConflictContextValue {
  showConflictModal: (options?: ConcurrencyConflictOptions) => void;
  hideConflictModal: () => void;
}

const ConcurrencyConflictContext =
  createContext<ConcurrencyConflictContextValue | null>(null);

export function ConcurrencyConflictProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConcurrencyConflictOptions>({});

  const showConflictModal = useCallback(
    (opts: ConcurrencyConflictOptions = {}) => {
      let resolvedType: ConcurrencyErrorType =
        opts.errorType || 'CONCURRENCY_CONFLICT';
      let resolvedMessage = opts.message;

      if (opts.error) {
        if (opts.error instanceof ConcurrencyConflictError) {
          resolvedType = 'CONCURRENCY_CONFLICT';
          resolvedMessage = opts.error.message;
        } else if (opts.error instanceof InvalidStateTransitionError) {
          resolvedType = 'INVALID_STATE_TRANSITION';
          resolvedMessage = opts.error.message;
        } else if (opts.error instanceof TerminalStateError) {
          resolvedType = 'TERMINAL_STATE';
          resolvedMessage = opts.error.message;
        } else if (opts.error instanceof RecordNotFoundError) {
          resolvedType = 'RECORD_NOT_FOUND';
          resolvedMessage = opts.error.message;
        } else if (opts.error instanceof Error) {
          const msg = opts.error.message;
          if (
            msg.includes('OCC_MISMATCH') ||
            msg.includes('Dữ liệu đã bị thay đổi')
          ) {
            resolvedType = 'CONCURRENCY_CONFLICT';
          } else if (
            msg.includes('INVALID_STATE') ||
            msg.includes('không ở trạng thái') ||
            msg.includes('Trạng thái không hợp lệ')
          ) {
            resolvedType = 'INVALID_STATE_TRANSITION';
          }
        }
      }

      setOptions({
        ...opts,
        errorType: resolvedType,
        message: resolvedMessage || opts.message,
      });
      setIsOpen(true);
    },
    [],
  );

  const hideConflictModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleReload = useCallback(async () => {
    if (options.onReload) {
      await options.onReload();
    } else if (options.queryKeys && options.queryKeys.length > 0) {
      await Promise.all(
        options.queryKeys.map((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        ),
      );
    } else {
      await queryClient.invalidateQueries();
    }
  }, [options, queryClient]);

  const value = useMemo(
    () => ({
      showConflictModal,
      hideConflictModal,
    }),
    [showConflictModal, hideConflictModal],
  );

  return (
    <ConcurrencyConflictContext.Provider value={value}>
      {children}
      <ConcurrencyConflictModal
        open={isOpen}
        onClose={hideConflictModal}
        onReload={handleReload}
        title={options.title}
        message={options.message}
        errorType={options.errorType}
      />
    </ConcurrencyConflictContext.Provider>
  );
}

export function useConcurrencyConflict(): ConcurrencyConflictContextValue {
  const ctx = useContext(ConcurrencyConflictContext);
  if (!ctx) {
    throw new Error(
      'useConcurrencyConflict phải được sử dụng bên trong <ConcurrencyConflictProvider>',
    );
  }
  return ctx;
}
