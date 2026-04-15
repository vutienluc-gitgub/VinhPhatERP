import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { Button } from '@/shared/components';
/* eslint-disable react-refresh/only-export-components */

import { AdaptiveSheet } from './AdaptiveSheet';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
};

export type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (message: string, title?: string) => Promise<void>;
};

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<
    ConfirmOptions & { isAlert?: boolean }
  >({
    message: '',
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions({
      ...opts,
      isAlert: false,
    });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const alert = useCallback(
    (message: string, title?: string): Promise<void> => {
      setOptions({
        message,
        title: title ?? 'Thông báo',
        isAlert: true,
      });
      setOpen(true);
      return new Promise<void>((resolve) => {
        resolveRef.current = () => resolve();
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      confirm,
      alert,
    }),
    [confirm, alert],
  );

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AdaptiveSheet
        open={open}
        onClose={handleCancel}
        title={options.title ?? 'Xác nhận'}
        titleId="confirm-dialog-title"
        footer={
          <>
            {!options.isAlert && (
              <Button variant="secondary" type="button" onClick={handleCancel}>
                {options.cancelLabel ?? 'Huỷ'}
              </Button>
            )}
            <button
              className={
                options.variant === 'danger' ? 'btn-danger' : 'btn-primary'
              }
              type="button"
              onClick={handleConfirm}
              autoFocus
            >
              {options.isAlert ? 'OK' : (options.confirmLabel ?? 'Xác nhận')}
            </button>
          </>
        }
      >
        <p id="confirm-dialog-message" style={{ lineHeight: 1.5 }}>
          {options.message}
        </p>
      </AdaptiveSheet>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
